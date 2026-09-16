# src/api/stats.py
from fastapi import APIRouter, Depends

from .deps import get_current_user
from ..models.models import User
from ..storage.chroma_store import get_vectorstore

router = APIRouter(tags=["Stats"])


@router.get("/documents/count")
def get_documents_count(current_user: User = Depends(get_current_user)):
    """Nombre total de chunks indexés (texte, tableau, image confondus)."""
    vectorstore = get_vectorstore()
    count = vectorstore._collection.count()
    return {"count": count}