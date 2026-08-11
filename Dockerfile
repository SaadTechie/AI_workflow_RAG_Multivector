FROM python:3.12-slim

# Variables d'environnement Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 1. Installation des dépendances système en une seule couche
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-fra \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Cache PIP : On copie et installe les dépendances séparément du code
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 3. Copie des fichiers applicatifs
COPY src/ ./src/
COPY frontend/ ./frontend/
COPY scripts/ ./scripts/

# 4. Précréation des dossiers de données locaux
RUN mkdir -p data/chroma data/uploads data/temp

EXPOSE 8000
EXPOSE 8501

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]