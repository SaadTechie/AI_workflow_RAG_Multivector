from src.rag.retriever import retrieve_by_type
r = retrieve_by_type("Expliquez moi processus d\'homologation", k_text=8, k_table=8, k_image=1)
print("texts:", len(r["texts"]), "images:", len(r["images"]))
