import base64
from typing import List, Dict, Any, Tuple
from langchain_core.documents import Document
import mimetypes
from ..config import settings
from ..storage.chroma_store import get_vectorstore
from ..storage.postgres_docstore import get_postgres_docstore
from ..storage.minio_client import minio_client

SUPPORTED_MIME_TYPES = {
    "image/png", "image/jpeg", "image/jpg",
    "image/webp", "image/heic", "image/heif"
}

def _filter_by_relative_gap(
    results: List[Tuple[Document, float]],
    margin: float = settings.RETRIEVAL_MARGIN,
    min_keep: int = 1,
    max_keep: int = settings.RETRIEVAL_MAX_KEEP,
) -> List[Document]:
    """Filtre les documents dont la distance est proche du meilleur score obtenu."""
    if not results:
        return []

    # Tri par distance croissante (ChromaDB)
    results = sorted(results, key=lambda x: x[1])
    best_score = results[0][1]

    kept = [doc for doc, score in results if score <= best_score + margin]
    if len(kept) < min_keep:
        kept = [doc for doc, _ in results[:min_keep]]

    return kept[:max_keep]


def parse_docs(raw_docs: List[Any], summary_metadatas: List[Dict[str, Any]]) -> Dict[str, List[Any]]:
    """Sépare les contenus bruts issus du docstore (Textes/Tables vs Images MinIO)."""
    images = []
    texts = []

    for raw_content, meta in zip(raw_docs, summary_metadatas):
        if not raw_content:
            continue

        # 🟢 CORRECTION : Décodage systématique des bytes PostgreSQL
        if isinstance(raw_content, bytes):
            raw_content = raw_content.decode("utf-8")

        doc_type = meta.get("type", "text")

        if doc_type == "image":
            # Si le docstore contient une clé MinIO
            if isinstance(raw_content, str) and "MINIO_KEY:" in raw_content:
                parts = raw_content.split("|")
                minio_key = parts[0].replace("MINIO_KEY:", "")

                # 🟢 Détection automatique via la bibliothèque standard Python
                mime_type, _ = mimetypes.guess_type(minio_key)
                mime_type = mime_type or "image/png"  # Repli si inconnu

                if mime_type.lower() not in SUPPORTED_MIME_TYPES:
                    continue  # on ignore cette image côté génération, comme on l'a fait côté résumé

                
                # Téléchargement des octets bruts pour conversion Base64 Gemini
                try:
                    img_data = minio_client.client.get_object(settings.MINIO_BUCKET, minio_key).read()
                except Exception:
                    continue  # on ignore cette image, on garde le reste du contexte
                b64_str = base64.b64encode(img_data).decode("utf-8")
                presigned_url = minio_client.get_presigned_url(minio_key)


                images.append({
                    "data": b64_str,
                    "content_type": mime_type,
                    "url": presigned_url,
                    "metadata": meta
                })
            elif isinstance(raw_content, dict) and "data" in raw_content:
                images.append(raw_content)
        else:
            doc_obj = Document(page_content=raw_content, metadata=meta)
            texts.append(doc_obj)

    return {"images": images, "texts": texts}


def retrieve_by_type(
    question: str,
    k_text: int = None,
    k_table: int =None,
    k_image: int = None,
) -> Dict[str, List[Any]]:
    """Exécute une recherche vectorielle ciblée par type et récupère les bruts dans le Docstore."""
    """
    Récupère les documents pertinents en filtrant par type.
    Utilise les paramètres k fournis, sinon bascule sur config.settings.
    """
    # 🟢 Priorité aux paramètres de la requête, repli sur le paramétrage global
    final_k_text = k_text if k_text is not None else settings.RETRIEVAL_K_TEXT
    final_k_table = k_table if k_table is not None else settings.RETRIEVAL_K_TABLE
    final_k_image = k_image if k_image is not None else settings.RETRIEVAL_K_IMAGE
    
    vectorstore = get_vectorstore()
    docstore = get_postgres_docstore()

    # 1. Recherche filtrée par type dans Chroma
    text_results = vectorstore.similarity_search_with_score(
        question, k=final_k_text, filter={"type": "text"}
    )
    filtered_texts = _filter_by_relative_gap(text_results)

    table_results = vectorstore.similarity_search_with_score(
        question, k=final_k_table, filter={"type": "table"}
    )
    filtered_tables = _filter_by_relative_gap(table_results)

    image_results = vectorstore.similarity_search_with_score(
        question, k=final_k_image, filter={"type": "image"}
    )
    filtered_images = _filter_by_relative_gap(image_results)

    all_summaries = filtered_texts + filtered_tables + filtered_images
    if not all_summaries:
        return {"images": [], "texts": []}

    # 2. Récupération des documents parents via doc_id
    doc_ids = [d.metadata["doc_id"] for d in all_summaries]
    metadatas = [d.metadata for d in all_summaries]
    raw_docs = docstore.mget(doc_ids)

    return parse_docs(raw_docs, metadatas)