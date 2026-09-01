from src.storage.chroma_store import get_vectorstore

vs = get_vectorstore()
collection = vs._collection
print("Nombre de documents:", collection.count())

sample = collection.get(limit=1, include=["embeddings"])

embeddings = sample.get("embeddings")
if embeddings is not None and len(embeddings) > 0:
    print("Dimension stockée:", len(embeddings[0]))
else:
    print("Aucun embedding trouvé dans l'échantillon.")