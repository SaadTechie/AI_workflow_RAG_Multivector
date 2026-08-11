from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from ..config import settings


def get_vectorstore() -> Chroma:
    """Retourne l'instance du VectorStore ChromaDB persistant."""
    embeddings = GoogleGenerativeAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
    )

    return Chroma(
        collection_name=settings.CHROMA_COLLECTION,
        embedding_function=embeddings,
        persist_directory=settings.CHROMA_PERSIST_DIR
    )