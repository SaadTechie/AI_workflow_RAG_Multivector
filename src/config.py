from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GOOGLE_API_KEY: str
    GROQ_API_KEY: str
    LANGCHAIN_API_KEY: str

    # --- PostgreSQL (docstore) ---
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str

    @property
    def postgres_dsn(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # --- MinIO (fichiers + images) ---
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str = "rag-documents"
    MINIO_SECURE: bool = False
    MINIO_PUBLIC_ENDPOINT: str = "localhost:9002"  # Endpoint public pour les URLs pré-signées (ex: localhost:9002 ou minio.example.com)

    # --- Chroma (vectorstore) ---
    CHROMA_PERSIST_DIR: str
    CHROMA_COLLECTION: str = "multi_modal_rag_v4"
    EMBEDDING_MODEL: str = "models/gemini-embedding-001" # dimension: 3072


    # --- Batching / anti quota (utilisé par image_summary.py) ---
    VISION_BATCH_SIZE: int = 2
    VISION_CONCURRENCY: int = 1
    VISION_BATCH_PAUSE_S: int = 30
    EMBEDDING_BATCH_SIZE: int = 5
    EMBEDDING_BATCH_PAUSE_S: int = 15

    TEXT_BATCH_SIZE: int = 2            # Réduit à 2 textes/tableaux (évite l'explosion du TPM Groq à 8000)
    TEXT_CONCURRENCY: int = 1           # Traitement 1 par 1 pour le LLM texte
    TEXT_BATCH_PAUSE_S: int = 15

    # --- Retrieval (pour rag/retriever.py, plus tard) ---
    RETRIEVAL_K_TEXT: int = 8
    RETRIEVAL_K_TABLE: int = 8
    RETRIEVAL_K_IMAGE: int = 8
    RETRIEVAL_MARGIN: float = 0.12
    RETRIEVAL_MAX_KEEP: int = 6

    # Dans src/config.py
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    #pour rendre solution 100% local et retirez GOOGLE_API_KEY, GROQ_API_KEY, LANGCHAIN_API_KEY de la classe — plus requis
    #OLLAMA_BASE_URL: str = "http://localhost:11434"
    #LLM_MODEL: str = "mistral:8b"
    #VISION_MODEL: str = "llama3.2-vision:11b"
    #EMBEDDING_MODEL: str = "bge-m3"

    

    # Nouvelle syntaxe Pydantic v2
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Ignore les clés inutiliséesb au lieu de faire crasher le script
    )


settings = Settings()