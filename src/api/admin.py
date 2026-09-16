# src/api/admin.py
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..services.ingestion_service import ingestion_service

from ..storage.database import get_db
from ..models.models import User
from ..schemas.auth import UserResponse
from .deps import get_current_admin_user

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin_user)],  
)


@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """Liste tous les utilisateurs enregistrés (admin uniquement)."""
    return db.query(User).order_by(User.created_at.desc()).all()



@router.get("/documents")
def list_documents():
    """Liste les documents distincts déjà indexés, avec leur répartition par type."""
    return ingestion_service.list_documents()



@router.delete("/documents/{filename}", dependencies=[Depends(get_current_admin_user)])
def delete_document(filename: str):
    result = ingestion_service.delete_document(filename)
    if result["status"] == "not_found":
        raise HTTPException(404, "Document introuvable dans la base.")
    return result


