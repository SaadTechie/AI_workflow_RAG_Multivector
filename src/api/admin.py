# src/api/admin.py
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

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


