from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """Vérifie l'état de fonctionnement de l'API."""
    return {
        "status": "healthy",
        "service": "Multimodal RAG API",
        "version": "1.0.0"
    }