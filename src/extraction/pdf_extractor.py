"""
PDFExtractor - extraction de texte, tableaux et images depuis des PDF techniques
(schémas de processus, documents automobile/qualité, etc.) via `unstructured`.

Stratégie pour les images/schémas :
1. Les vrais tableaux (`el_type == "Table"`) sont extraits directement via
   `image_base64` fourni par `unstructured` — ils sont en général une seule
   région cohérente, pas fragmentée.
2. Les schémas/diagrammes (`el_type == "Image"`) sont souvent fragmentés en
   plusieurs sous-régions par le détecteur de layout en mode `hi_res`
   (chaque boîte, flèche, forme = une région distincte). Pour ces pages :
   - Si une page contient beaucoup de fragments Image (page dense en schéma),
     on rend la PAGE ENTIÈRE en image plutôt que de tenter un recadrage
     précis (peu fiable sur des mises en page complexes type flowchart +
     tableau imbriqués). C'est la stratégie la plus robuste pour ce type
     de document.
   - Sinon (page avec juste 1-2 images isolées), on garde un recadrage
     précis via clustering des bounding boxes + rendu ciblé avec PyMuPDF.
"""

import base64
import os
import re
from collections import defaultdict

import fitz  # PyMuPDF
from unstructured.partition.pdf import partition_pdf
from unstructured.cleaners.core import clean_extra_whitespace
from langchain_core.documents import Document

from .base import (
    Extractor,
    ExtractionResult,
    ImageRecord,
)


# --------------------------------------------------------------------------
# Utilitaires de clustering / rendu pour les images fragmentées
# --------------------------------------------------------------------------

def cluster_boxes(boxes, proximity=50):
    """
    Fusionne des bounding boxes proches les unes des autres en clusters.
    `proximity` est exprimé dans le système de coordonnées interne
    d'unstructured (PixelSpace), pas en points PDF.
    """
    boxes = list(boxes)
    changed = True
    while changed:
        changed = False
        merged = []
        used = [False] * len(boxes)
        for i in range(len(boxes)):
            if used[i]:
                continue
            x0, y0, x1, y1 = boxes[i]
            used[i] = True
            for j in range(i + 1, len(boxes)):
                if used[j]:
                    continue
                bx0, by0, bx1, by1 = boxes[j]
                if not (bx0 > x1 + proximity or bx1 < x0 - proximity or
                        by0 > y1 + proximity or by1 < y0 - proximity):
                    x0, y0, x1, y1 = min(x0, bx0), min(y0, by0), max(x1, bx1), max(y1, by1)
                    used[j] = True
                    changed = True
            merged.append((x0, y0, x1, y1))
        boxes = merged
    return boxes


def _collect_image_fragments(chunks, min_width=60, min_height=60, min_area=6000):
    """
    Parcourt tous les chunks et regroupe par page :
    - les bounding boxes des éléments `Image`
    - la résolution de rendu interne utilisée par unstructured pour cette page
      (nécessaire pour convertir les coordonnées vers l'espace du PDF réel)

    Filtre les fragments trop petits pour être de vrais schémas/images
    (puces de liste type "a.", "b.", petites icônes, artefacts de détection).
    Les seuils sont exprimés dans l'espace de coordonnées interne
    d'unstructured (PixelSpace), pas en points PDF.
    """
    boxes_per_page = defaultdict(list)
    layout_dims_per_page = {}

    for chunk in chunks:
        orig_elements = getattr(chunk.metadata, "orig_elements", None) or []
        for el in orig_elements:
            if type(el).__name__ != "Image":
                continue

            page = getattr(el.metadata, "page_number", None)
            coords = getattr(el.metadata, "coordinates", None)
            if not (page and coords and coords.points):
                continue

            xs = [p[0] for p in coords.points]
            ys = [p[1] for p in coords.points]
            x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)

            width = x1 - x0
            height = y1 - y0
            area = width * height

            # 🟢 Filtre anti-puces / petites icônes : on ignore les fragments
            # trop petits pour être un schéma réel
            if width < min_width or height < min_height or area < min_area:
                continue

            boxes_per_page[page].append((x0, y0, x1, y1))

            if page not in layout_dims_per_page:
                system = getattr(coords, "system", None)
                w = getattr(system, "width", None)
                h = getattr(system, "height", None)
                if w and h:
                    layout_dims_per_page[page] = (w, h)

    return boxes_per_page, layout_dims_per_page


def render_full_pages_for_diagrams(file_path, boxes_per_page, min_fragments=3, dpi=200):
    """
    Stratégie robuste : pour toute page dont le nombre de fragments Image
    dépasse `min_fragments`, on rend la page ENTIÈRE en image plutôt que
    de tenter un recadrage précis. Retourne les records et l'ensemble des
    numéros de page traitées de cette façon (pour les exclure du clustering
    précis ensuite).
    """
    pages_to_render = {
        page for page, boxes in boxes_per_page.items()
        if len(boxes) >= min_fragments
    }

    doc = fitz.open(file_path)
    records = []
    for page_num in pages_to_render:
        page = doc[page_num - 1]
        pix = page.get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72))
        b64 = base64.b64encode(pix.tobytes("png")).decode()
        records.append({
            "page": page_num,
            "data": b64,
            "ext": "png",
            "content_type": "image/png",
        })
    doc.close()
    return records, pages_to_render


def render_clustered_crops(file_path, boxes_per_page, layout_dims_per_page,
                            skip_pages, dpi=200, proximity=50, margin=10):
    """
    Pour les pages NON traitées en pleine page (peu de fragments, cas simple
    d'une image isolée) : clustering précis des bounding boxes + recadrage
    ciblé dans le PDF source via PyMuPDF.
    """
    doc = fitz.open(file_path)
    records = []

    for page_num, boxes in boxes_per_page.items():
        if page_num in skip_pages:
            continue

        clusters = cluster_boxes(boxes, proximity=proximity)
        page = doc[page_num - 1]

        # Échelle dynamique entre l'espace de rendu interne d'unstructured
        # et la taille réelle de la page PDF (ne PAS supposer 72/dpi)
        layout_w, layout_h = layout_dims_per_page.get(
            page_num, (page.rect.width, page.rect.height)
        )
        scale_x = page.rect.width / layout_w
        scale_y = page.rect.height / layout_h

        for (x0, y0, x1, y1) in clusters:
            rect = fitz.Rect(
                max(0, x0 * scale_x - margin),
                max(0, y0 * scale_y - margin),
                min(page.rect.width, x1 * scale_x + margin),
                min(page.rect.height, y1 * scale_y + margin),
            )
            pix = page.get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72), clip=rect)
            b64 = base64.b64encode(pix.tobytes("png")).decode()
            records.append({
                "page": page_num,
                "data": b64,
                "ext": "png",
                "content_type": "image/png",
            })

    doc.close()
    return records


def extract_diagram_images(file_path, chunks, min_fragments=3, dpi=200,
                            proximity=50, margin=10,
                            min_width=60, min_height=60, min_area=6000):
    """
    Point d'entrée unique : combine les deux stratégies.
    - Pages denses en fragments -> rendu pleine page (robuste)
    - Pages avec peu de fragments -> recadrage précis par clustering
    Dédupliqué et appelé une seule fois par extraction (pas dans une boucle).

    `min_width`, `min_height`, `min_area` filtrent les petits fragments
    (puces de liste, icônes) qui ne sont pas de vrais schémas.
    """
    boxes_per_page, layout_dims_per_page = _collect_image_fragments(
        chunks, min_width=min_width, min_height=min_height, min_area=min_area
    )

    if not boxes_per_page:
        return []

    full_page_records, rendered_pages = render_full_pages_for_diagrams(
        file_path, boxes_per_page, min_fragments=min_fragments, dpi=dpi
    )

    cropped_records = render_clustered_crops(
        file_path, boxes_per_page, layout_dims_per_page,
        skip_pages=rendered_pages, dpi=dpi, proximity=proximity, margin=margin
    )

    return full_page_records + cropped_records


# --------------------------------------------------------------------------
# Préprocessing des textes
# --------------------------------------------------------------------------

def is_boilerplate(text: str) -> bool:
    """
    Détecte les lignes parasites courantes (dates d'export, URLs isolées,
    numéros de page type "3/29") quand elles constituent l'essentiel d'un
    chunk court. On ne filtre PAS un chunk juste parce qu'il contient une
    URL ou une date au milieu d'un texte substantiel — seulement quand le
    chunk entier est court ET correspond à un de ces motifs.
    """
    patterns = [
        r"\d{1,2}/\d{1,2}/\d{2,4},?\s*\d{1,2}:\d{2}\s*(AM|PM)",
        r"https?://\S+",
        r"^\d+/\d+$",
    ]
    return len(text) < 100 and any(re.search(p, text) for p in patterns)


def preprocess_texts(text_docs):
    """
    Nettoie et filtre les Document de type texte issus de l'extraction :
    - suppression des espaces superflus (unstructured.cleaners.core)
    - suppression des chunks "boilerplate" (dates d'export, URLs isolées,
      numéros de page)

    Adapté pour des objets `langchain_core.documents.Document`
    (attribut `page_content`), et non des chunks unstructured bruts
    (qui utilisent `.text`).
    """
    cleaned = []
    for doc in text_docs:
        cleaned_text = clean_extra_whitespace(doc.page_content or "")

        if not cleaned_text or is_boilerplate(cleaned_text):
            continue

        doc.page_content = cleaned_text
        cleaned.append(doc)

    return cleaned


# --------------------------------------------------------------------------
# Extracteur principal
# --------------------------------------------------------------------------

class PDFExtractor(Extractor):

    def extract(self, file_path: str) -> ExtractionResult:

        chunks = partition_pdf(
            filename=file_path,
            infer_table_structure=True,
            strategy="hi_res",
            languages=["fra"],
            extract_image_block_types=["Image", "Table"],
            extract_image_block_to_payload=True,
            chunking_strategy="by_title",
            max_characters=10000,
            combine_text_under_n_chars=200,
            new_after_n_chars=6000,
        )

        text_docs = []
        table_docs = []
        image_records = []

        for chunk in chunks:

            chunk_type = type(chunk).__name__
            page_num = getattr(chunk.metadata, "page_number", None)

            # TABLES (texte structuré en HTML)
            if chunk_type == "Table":
                table_content = getattr(chunk.metadata, "text_as_html", str(chunk))
                table_docs.append(
                    Document(
                        page_content=table_content,
                        metadata={
                            "type": "table",
                            "page": page_num,
                            "source": file_path,
                        },
                    )
                )

            # TEXTE
            elif chunk_type == "CompositeElement":
                text_docs.append(
                    Document(
                        page_content=str(chunk),
                        metadata={
                            "type": "text",
                            "page": page_num,
                            "source": file_path,
                        },
                    )
                )

            # Captures de TABLEAUX uniquement ici (pas les schémas fragmentés,
            # traités séparément après la boucle via extract_diagram_images)
            orig_elements = getattr(chunk.metadata, "orig_elements", []) or []
            for el in orig_elements:
                if type(el).__name__ != "Table":
                    continue

                img_b64 = getattr(el.metadata, "image_base64", None)
                if not img_b64:
                    continue

                mime_type = getattr(el.metadata, "image_mime_type", None) or "image/png"
                ext = mime_type.split("/")[-1].lower()
                if ext == "jpeg":
                    ext = "jpg"

                if not any(rec.data == img_b64 for rec in image_records):
                    image_records.append(
                        ImageRecord(
                            data=img_b64,
                            ext=ext,
                            content_type=mime_type,
                            source_location=getattr(el.metadata, "page_number", page_num),
                        )
                    )

        # Schémas/diagrammes : traité UNE SEULE FOIS, hors de la boucle sur les chunks
        diagram_images = extract_diagram_images(
            file_path, chunks, min_fragments=3, dpi=200, proximity=50, margin=10
        )
        for img in diagram_images:
            if not any(rec.data == img["data"] for rec in image_records):
                image_records.append(
                    ImageRecord(
                        data=img["data"],
                        ext=img["ext"],
                        content_type=img["content_type"],
                        source_location=img["page"],
                    )
                )

        # Nettoyage et filtrage des chunks texte (espaces superflus,
        # dates d'export, URLs isolées, numéros de page)
        text_docs = preprocess_texts(text_docs)

        os.makedirs("extracted_images_pdf", exist_ok=True)
        print(f"Extraction PDF : {len(image_records)} images/schémas détectés")

        return ExtractionResult(
            texts=text_docs,
            tables=table_docs,
            images=image_records,
        )