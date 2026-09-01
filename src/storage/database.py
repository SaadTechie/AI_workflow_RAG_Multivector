# src/storage/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..config import settings
#from ..models.models import Base

# URL de connexion PostgreSQL
#DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"

engine = create_engine(settings.postgres_dsn, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


#
    # usage dev/test uniquement, ne pas appeler en présence d'Alembic).
   # """Crée les nouvelles tables V2 si elles n'existent pas encore."""
   # Base.metadata.create_all(bind=engine)


def get_db():
    """Injecteur de dépendance FastAPI pour ouvrir/fermer les sessions DB."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()