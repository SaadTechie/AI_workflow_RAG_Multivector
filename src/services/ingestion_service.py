import os
import uuid
from typing import Dict, Any, List
from langchain_core.documents import Document

from ..extraction.base import ExtractionResult
from ..extraction.pdf_extractor import PDFExtractor
from ..extraction.pptx_extractor import PPTXExtractor
from ..summarization import summarize_extraction
from ..storage.minio_client import minio_client
from ..storage.chroma_store import get_vectorstore
from ..storage.postgres_docstore import get_postgres_docstore
from ..config import settings


class IngestionService:
    def __init__(self):
        self.vectorstore = get_vectorstore()
        self.docstore = get_postgres_docstore()
        self.id_key = "doc_id"

    def _check_minio_available(self) -> None:
        """Vérifie que MinIO est joignable AVANT tout traitement coûteux.
        Échoue vite et clairement plutôt que de laisser l'ingestion planter
        après extraction + résumé (temps perdu, quota API gaspillé pour rien)."""
        try:
            minio_client.client.bucket_exists(minio_client.bucket_name)
        except Exception as e:
            raise RuntimeError(
                f"MinIO injoignable (endpoint configuré : {settings.MINIO_ENDPOINT}). "
                f"Vérifiez que le conteneur MinIO tourne et que MINIO_ENDPOINT correspond bien "
                f"au contexte d'exécution (nom de service Docker interne, pas 'localhost', "
                f"si le backend tourne lui-même en conteneur). Détail : {e}"
            ) from e

    def ingest_file(self, file_path: str) -> Dict[str, Any]:
        """
        Orchestre l'ingestion complète d'un fichier (PPTX ou PDF) :
        1. Sauvegarde du document brut dans MinIO
        2. Extraction du contenu (Textes, Tables, Images)
        3. Génération des résumés via summarize_extraction
        4. Traitement des images (conversion Base64 -> MinIO)
        5. Stockage des résumés dans ChromaDB et des bruts dans Postgres Docstore
        """
        file_ext = os.path.splitext(file_path)[1].lower()
        file_name = os.path.basename(file_path)

        # Garde anti-duplication : on vérifie si ce nom de fichier a déjà été ingéré
        existing = self.vectorstore.get(where={"source": file_name}, limit=1)
        if existing and existing.get("ids"):
            return {
                "status": "skipped",
                "filename": file_name,
                "reason": "Déjà indexé — utilisez fichier différent ou supprimez d'abord les entrées existantes."
            }

        self._check_minio_available()

        # 1. Sauvegarde du fichier original dans MinIO
        with open(file_path, "rb") as f:
            file_bytes = f.read()
        raw_file_minio_key = f"raw_documents/{uuid.uuid4()}_{file_name}"
        try:
            minio_client.upload_bytes(file_bytes, raw_file_minio_key)
        except Exception as e:
            raise RuntimeError(f"Échec de l'upload du fichier original vers MinIO : {e}") from e

        # 2. Extraction selon le type de fichier
        if file_ext == ".pptx":
            extractor = PPTXExtractor()
            extraction_res: ExtractionResult = extractor.extract(file_path)
        elif file_ext == ".pdf":
            extractor = PDFExtractor()
            extraction_res: ExtractionResult = extractor.extract(file_path)
        else:
            # ajout prochainement: support pour d'autres formats (Word, Excel, etc.)
            raise ValueError(f"Format de fichier non supporté : {file_ext}")

        # 3. Génération des résumés synchronisés
        summaries_dict = summarize_extraction(extraction_res)
        text_summaries = summaries_dict["text_summaries"]
        table_summaries = summaries_dict["table_summaries"]
        image_summaries = summaries_dict["image_summaries"]

        all_vector_docs = []
        all_docstore_pairs = []

        # 4. Ingestion des TEXTES
        for raw_text, summary in zip(extraction_res.texts, text_summaries):
            doc_id = str(uuid.uuid4())
            meta = {
                self.id_key: doc_id,
                "type": "text",
                "source": file_name,
                "page": raw_text.metadata.get("page", None),
                "raw_file_key": raw_file_minio_key
            }
            all_vector_docs.append(Document(page_content=summary, metadata=meta))
            all_docstore_pairs.append((doc_id, raw_text.page_content.encode("utf-8")))

        # 5. Ingestion des TABLEAUX
        for raw_table, summary in zip(extraction_res.tables, table_summaries):
            doc_id = str(uuid.uuid4())
            meta = {
                self.id_key: doc_id,
                "type": "table",
                "source": file_name,
                "page": raw_table.metadata.get("page", None),
                "raw_file_key": raw_file_minio_key
            }
            all_vector_docs.append(Document(page_content=summary, metadata=meta))
            table_content = raw_table.page_content if hasattr(raw_table, "page_content") else str(raw_table)
            all_docstore_pairs.append((doc_id, table_content.encode("utf-8")))

        # 6. Ingestion des IMAGES (Upload Base64 -> MinIO)
        for img_record, summary in zip(extraction_res.images, image_summaries):
            doc_id = str(uuid.uuid4())

            ext = getattr(img_record, "ext", "png")
            content_type = getattr(img_record, "content_type", f"image/{ext}")
            b64_data = img_record.data if hasattr(img_record, "data") else img_record
            page_num = getattr(img_record, "source_location", None)

            img_minio_key = f"extracted_images/{doc_id}.{ext}"

            minio_client.upload_base64_image(
                b64_string=b64_data,
                object_name=img_minio_key,
                content_type=content_type
            )
            img_url = minio_client.get_presigned_url(img_minio_key)

            meta = {
                self.id_key: doc_id,
                "type": "image",
                "source": file_name,
                "minio_key": img_minio_key,
                "image_url": img_url,
                "page": page_num
            }
            docstore_payload = f"MINIO_KEY:{img_minio_key}|URL:{img_url}"
            all_vector_docs.append(Document(page_content=summary, metadata=meta))
            all_docstore_pairs.append((doc_id, docstore_payload.encode("utf-8")))

        # 7. Sauvegarde dans ChromaDB (Vectorstore)
        if all_vector_docs:
            self.vectorstore.add_documents(all_vector_docs)

        # 8. Sauvegarde dans Postgres SQLStore (Docstore parent)
        if all_docstore_pairs:
            self.docstore.mset(all_docstore_pairs)

        return {
            "status": "success",
            "filename": file_name,
            "raw_file_key": raw_file_minio_key,
            "counts": {
                "texts": len(extraction_res.texts),
                "tables": len(extraction_res.tables),
                "images": len(extraction_res.images),
                "total_indexed": len(all_vector_docs)
            }
        }

    def list_documents(self) -> List[Dict[str, Any]]:
        """
        Liste les documents distincts déjà indexés, avec leur répartition
        par type (texte/tableau/image).

        Un document source produit potentiellement des centaines de chunks
        vectorisés dans Chroma — on les regroupe ici par `source` (nom du
        fichier original) pour donner une vue exploitable côté admin,
        plutôt que de renvoyer chaque chunk brut.
        """
        all_entries = self.vectorstore.get(include=["metadatas"])
        metadatas = all_entries.get("metadatas", [])

        if not metadatas:
            return []

        documents: Dict[str, Dict[str, Any]] = {}

        for meta in metadatas:
            source = meta.get("source")
            if not source:
                continue  # entrée orpheline sans métadonnée source, on l'ignore

            if source not in documents:
                documents[source] = {
                    "filename": source,
                    "raw_file_key": meta.get("raw_file_key"),
                    "counts": {"text": 0, "table": 0, "image": 0},
                    "total_chunks": 0,
                }

            doc_type = meta.get("type", "unknown")
            documents[source]["counts"][doc_type] = (
                documents[source]["counts"].get(doc_type, 0) + 1
            )
            documents[source]["total_chunks"] += 1

        return sorted(documents.values(), key=lambda d: d["filename"])

    def delete_document(self, file_name: str) -> Dict[str, Any]:
        """Supprime un document déjà ingéré (Chroma, Postgres, MinIO), sans impacter les autres."""
        existing = self.vectorstore.get(where={"source": file_name})
        ids = existing.get("ids", [])
        metadatas = existing.get("metadatas", [])

        if not ids:
            return {"status": "not_found", "filename": file_name}

        doc_ids = [m["doc_id"] for m in metadatas]

        # 1. Nettoyage MinIO — fichier brut + images extraites de CE document
        minio_keys = {m["raw_file_key"] for m in metadatas if m.get("raw_file_key")}
        minio_keys |= {m["minio_key"] for m in metadatas if m.get("minio_key")}
        for key in minio_keys:
            try:
                minio_client.client.remove_object(settings.MINIO_BUCKET, key)
            except Exception:
                pass

        # 2. Suppression du contenu brut (Postgres)
        self.docstore.mdelete(doc_ids)

        # 3. Suppression des résumés vectorisés (Chroma)
        self.vectorstore.delete(ids=ids)

        return {"status": "deleted", "filename": file_name, "chunks_removed": len(ids)}


ingestion_service = IngestionService()