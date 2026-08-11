from fastapi import APIRouter, HTTPException
from ..schemas.schemas import QueryRequest, QueryResponse
from ..services.query_service import query_service

router = APIRouter(tags=["Query"])


@router.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """Reçoit la question utilisateur et retourne la réponse générée avec ses sources."""
    try:
        return query_service.answer_question(request)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du traitement de la requête RAG : {str(e)}"
        )