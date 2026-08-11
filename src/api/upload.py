import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.ingestion_service import ingestion_service

router = APIRouter(tags=["Ingestion"])


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Reçoit un fichier (PDF ou PPTX), le sauvegarde temporairement et lance l'ingestion."""
    allowed_extensions = [".pdf", ".pptx"]
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté. Seuls {allowed_extensions} sont acceptés."
        )

    temp_dir = os.path.join("data", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Ingestion complète (MinIO, Chroma, Postgres)
        result = ingestion_service.ingest_file(temp_path)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'ingestion : {str(e)}")

    finally:
        # Nettoyage du fichier temporaire
        if os.path.exists(temp_path):
            os.remove(temp_path)