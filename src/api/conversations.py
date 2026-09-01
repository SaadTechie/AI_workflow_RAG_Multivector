# src/api/conversations.py

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..storage.database import get_db
from ..models.models import User, Conversation, Message
from ..schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    MessageResponse,
    ConversationUpdate
)
from ..api.deps import get_current_user

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée un nouveau fil de discussion pour l'utilisateur connecté."""
    conv = Conversation(
        user_id=current_user.id,
        title=conv_in.title or "Nouvelle discussion"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("", response_model=List[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère toutes les conversations de l'utilisateur connecté."""
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère l'historique chronologique des messages d'une conversation."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation introuvable ou non autorisée."
        )

    return conv.messages


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime une conversation et tous ses messages associés (cascade)."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation introuvable ou non autorisée."
        )

    db.delete(conv)
    db.commit()
    return None


@router.patch("/{conversation_id}", response_model=ConversationResponse)
def rename_conversation(
    conversation_id: UUID,
    payload: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable ou non autorisée.")

    conv.title = payload.title
    db.commit()
    db.refresh(conv)
    return conv