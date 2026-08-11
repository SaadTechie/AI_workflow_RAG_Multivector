import sys

print("=== 1. Config ===")
from src.config import settings
print("OK -", settings.POSTGRES_HOST, settings.POSTGRES_PORT, settings.MINIO_ENDPOINT)

print("\n=== 2. Postgres (ecriture/lecture) ===")
from src.storage.postgres_docstore import get_postgres_docstore
docstore = get_postgres_docstore()
docstore.mset([("__smoketest__", b"ok")])
assert docstore.mget(["__smoketest__"]) == [b"ok"]
docstore.mdelete(["__smoketest__"])
print("OK")

print("\n=== 3. MinIO (upload/presign) ===")
from src.storage.minio_client import minio_client
minio_client.upload_bytes(b"test", "smoketest.txt")
url = minio_client.get_presigned_url("smoketest.txt")
print("OK -", url[:60], "...")

print("\n=== 4. Chroma (vectorstore + embedding) ===")
from src.storage.chroma_store import get_vectorstore
from langchain_core.documents import Document
vs = get_vectorstore()
vs.add_documents([Document(page_content="test embedding", metadata={"type": "text", "source": "smoketest", "doc_id": "smoketest"})])
res = vs.get(where={"source": "smoketest"})
assert len(res["ids"]) == 1
vs.delete(ids=res["ids"])
print("OK - embedding + stockage + suppression valides")

print("\n=== 5. Resume texte (Groq + fallback Gemini) ===")
from src.summarization.summarizer import summarize_chain
r = summarize_chain.invoke({"element": "Test rapide de resume."})
print("OK -", r[:80])

print("\n=== 6. Resume image (Gemini vision) ===")
from src.extraction.pptx_extractor import PPTXExtractor
from src.summarization.image_summary import summarize_images
extraction = PPTXExtractor().extract("data/uploads/Introduction_to_Homologation_Compliance_-_Regulation_Homologation_Standards_01442_20_01088.pptx")
if extraction.images:
    s = summarize_images(extraction.images[:1])
    print("OK -", s[0][:80])
else:
    print("ATTENTION - aucune image extraite pour ce test")

print("\n✅ TOUS LES COMPOSANTS SONT OPERATIONNELS")
