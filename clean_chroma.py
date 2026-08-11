from src.storage.chroma_store import get_vectorstore

vs = get_vectorstore()
files = []

for f in files:
    res = vs.get(where={"source": f})
    ids = res["ids"]
    if ids:
        vs.delete(ids=ids)
        print(f"{f}: {len(ids)} entrees supprimees")
    else:
        print(f"{f}: rien a supprimer")
