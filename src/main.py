from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import health, upload, query, auth, conversations

app = FastAPI(
    title="API RAG Multimodal Automobile",
    description="Backend RAG pour le traitement et la recherche d'homologation véhicule.",
    version="1.0.0"
)

# Configuration CORS pour Streamlit / Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routage API
app.include_router(health.router)
app.include_router(upload.router)
app.include_router(query.router)
app.include_router(auth.router)
app.include_router(conversations.router)




if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)