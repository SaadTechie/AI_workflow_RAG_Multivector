
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..storage.database import get_db

from .deps import get_current_user
from ..models.models import User
from ..schemas.schemas import QueryRequest, QueryResponse
from ..services.query_service import query_service

router = APIRouter(tags=["Query"])


@router.post("/query", response_model=QueryResponse)
def query_rag(
    request: QueryRequest,
    current_user: User= Depends(get_current_user),
    db: Session = Depends(get_db)
  ):
    """Reçoit la question utilisateur et retourne la réponse générée avec ses sources."""
    try:
        return query_service.answer_question(
            request=request, 
            current_user=current_user, 
            db=db
        )
    except HTTPException:
        raise  # 🟢 on laisse les erreurs HTTP volontaires (404, etc.) remonter telles quelles
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du traitement de la requête RAG : {str(e)}"
        )