from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RetrievedSource(BaseModel):
    doc_id: str
    type: str  # text, table, image
    source: str
    location: Optional[str] = None  # ← Nouveau : "Page 5" ou "Slide 12"
    content_preview: Optional[str] = None
    image_url: Optional[str] = None


class QueryResponse(BaseModel):
    question: str
    answer: str
    sources: List[RetrievedSource] = Field(default_factory=list)

