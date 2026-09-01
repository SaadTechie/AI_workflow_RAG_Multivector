from google import genai
from src.config import settings

client = genai.Client(api_key=settings.GOOGLE_API_KEY)

response = client.models.embed_content(
    model=settings.EMBEDDING_MODEL,  # "models/gemini-embedding-001"
    contents="expliquez moi le processus d'homologation",
)
print(response)
print("OK, dimension:", len(response.embeddings[0].values))
