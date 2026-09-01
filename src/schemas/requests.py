from pydantic import BaseModel, Field
from uuid import UUID


class QueryRequest(BaseModel):
    conversation_id: UUID = Field(..., description="Identifiant unique de la conversation", example="123e4567-e89b-12d3-a456-426614174000")
    question: str = Field(..., description="La question posée par l'utilisateur", example="Quelles sont les normes d'homologation au Brésil ?")
    k_text: int = Field(default=8, description="Nombre de candidats textes à récupérer")
    k_table: int = Field(default=8, description="Nombre de candidats tableaux à récupérer")
    k_image: int = Field(default=8, description="Nombre de candidats images à récupérer")

