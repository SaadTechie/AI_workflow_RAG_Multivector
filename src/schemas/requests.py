from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(..., description="La question posée par l'utilisateur", example="Quelles sont les normes d'homologation au Brésil ?")
    k_text: int = Field(default=8, description="Nombre de candidats textes à récupérer")
    k_table: int = Field(default=8, description="Nombre de candidats tableaux à récupérer")
    k_image: int = Field(default=8, description="Nombre de candidats images à récupérer")