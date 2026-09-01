#src/schemas/chat.py
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Any, Optional


class MessageCreate(BaseModel):
    role: str
    content: str
    sources: Optional[List[Any]] = None


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    sources: Optional[List[Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    title: Optional[str] = "Nouvelle discussion"


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationUpdate(BaseModel):
    title: str