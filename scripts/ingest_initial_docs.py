import os
from src.services.ingestion_service import ingestion_service

# Chemin vers vos 2 supports techniques entreprise
DOCS_TO_INDEX = [
    #mettre les chemins vers vos fichiers PDF et PPTX ici,
    ]

if __name__ == "__main__":
    for doc_path in DOCS_TO_INDEX:
        if os.path.exists(doc_path):
            print(f"🚀 Ingestion initiale de {doc_path}...")
            res = ingestion_service.ingest_file(doc_path)
            print(f"✅ Terminé : {res}")
        else:
            print(f"⚠️ Fichier introuvable : {doc_path}")