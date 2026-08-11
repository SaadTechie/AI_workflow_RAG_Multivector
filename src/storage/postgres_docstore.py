# storage/postgres_docstore.py
from langchain_community.storage import SQLStore
from ..config import settings


def get_postgres_docstore() -> SQLStore:
    """Initialise le Key-Value Store PostgreSQL pour le MultiVectorRetriever."""
    store = SQLStore(namespace="docstore", db_url=settings.postgres_dsn)
    store.create_schema()
    return store

