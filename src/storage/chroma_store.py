# storage/chroma_store.py
from google import genai
from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings
from concurrent.futures import ThreadPoolExecutor

from ..config import settings

#pour embedding local
#from langchain_ollama import OllamaEmbeddings
#!! Retirez complètement GeminiEmbeddingsDirect et le client google.genai.

_client = genai.Client(api_key=settings.GOOGLE_API_KEY)


class GeminiEmbeddingsDirect(Embeddings):
    """Contourne le bug connu de langchain_google_genai (500 INTERNAL sur embed_query)
    en appelant directement le SDK google-genai."""

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        def _embed_one(t):
            return _client.models.embed_content(
                model=settings.EMBEDDING_MODEL.replace("models/", ""),
                contents=t,
            ).embeddings[0].values

        with ThreadPoolExecutor(max_workers=4) as executor:
            return list(executor.map(_embed_one, texts))

    def embed_query(self, text: str) -> list[float]:
        return _client.models.embed_content(
            model=settings.EMBEDDING_MODEL.replace("models/", ""),
            contents=text,
        ).embeddings[0].values


def get_vectorstore() -> Chroma:
    """Retourne l'instance du VectorStore ChromaDB persistant."""
    embeddings = GeminiEmbeddingsDirect()
    #embeddings = OllamaEmbeddings(
     #   model=settings.EMBEDDING_MODEL,
      #  base_url=settings.OLLAMA_BASE_URL,
    #)
    return Chroma(
        collection_name=settings.CHROMA_COLLECTION,
        embedding_function=embeddings,
        persist_directory=settings.CHROMA_PERSIST_DIR
    )