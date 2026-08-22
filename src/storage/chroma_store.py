# storage/chroma_store.py
from google import genai
from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings

from ..config import settings

_client = genai.Client(api_key=settings.GOOGLE_API_KEY)


class GeminiEmbeddingsDirect(Embeddings):
    """Contourne le bug connu de langchain_google_genai (500 INTERNAL sur embed_query)
    en appelant directement le SDK google-genai."""

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [
            _client.models.embed_content(
                model=settings.EMBEDDING_MODEL.replace("models/", ""),
                contents=t,
            ).embeddings[0].values
            for t in texts
        ]

    def embed_query(self, text: str) -> list[float]:
        return _client.models.embed_content(
            model=settings.EMBEDDING_MODEL.replace("models/", ""),
            contents=text,
        ).embeddings[0].values


def get_vectorstore() -> Chroma:
    """Retourne l'instance du VectorStore ChromaDB persistant."""
    embeddings = GeminiEmbeddingsDirect()
    return Chroma(
        collection_name=settings.CHROMA_COLLECTION,
        embedding_function=embeddings,
        persist_directory=settings.CHROMA_PERSIST_DIR
    )