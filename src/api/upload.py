import os
import shutil
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks

from .deps import get_current_admin_user
from ..services.ingestion_service import ingestion_service

router = APIRouter(tags=["Ingestion"])

# Stockage en mémoire des jobs — suffisant pour un seul worker uvicorn.
# Limite connue : perdu au redémarrage du conteneur, non partagé entre plusieurs workers.
# Évolution V2 envisagée : persistance via Redis/Celery.
_jobs: dict[str, dict] = {}

def _run_ingestion_job(job_id: str, temp_path: str):
    try:
        result = ingestion_service.ingest_file(temp_path)
        _jobs[job_id] = {"status": "done", "result": result}
    except Exception as e:
        _jobs[job_id] = {"status": "error", "error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/upload",dependencies=[Depends(get_current_admin_user)])
def upload_document(file: UploadFile = File(...), background_tasks: BackgroundTasks= None):
    """Reçoit un fichier, le sauvegarde temporairement et lance l'ingestion en arrière-plan.
    Répond immédiatement avec un job_id — ne bloque jamais la requête HTTP."""
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

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la réception du fichier : {e}")

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": "processing"}
    background_tasks.add_task(_run_ingestion_job, job_id, temp_path)

    return {"job_id": job_id, "status": "processing"}


@router.get("/upload/status/{job_id}", dependencies=[Depends(get_current_admin_user)])
def get_upload_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job introuvable.")
    return job