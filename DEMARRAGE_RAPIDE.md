# Démarrage rapide — Assistant IA d'Homologation Véhicule

Ce guide permet de lancer l'intégralité de l'application (backend, frontend, base de données, stockage) en une seule commande, sans installer Python ni Node.js sur la machine.

---

## Prérequis

- **Docker Desktop** installé et démarré ([télécharger](https://www.docker.com/products/docker-desktop/)) — inclut Docker Compose, aucune installation supplémentaire nécessaire.
- Aucun autre logiciel requis pour cette méthode.

---

## 1. Récupération du projet

**Option A — via Git :**
```bash
git clone https://github.com/SaadTechie/AI_workflow_RAG_Multivector.git
cd AI_workflow
```

**Option B — via archive ZIP :**
1. Téléchargez et extrayez l'archive du projet.
2. Ouvrez un terminal dans le dossier extrait (celui contenant `docker-compose.yml`).

---

## 2. Configuration (obligatoire avant le premier lancement)

Créez un fichier nommé `.env` à la racine du projet — copiez le contenu ci-dessous et remplacez les valeurs marquées `<...>` :

```dotenv
# --- Clés API des modèles IA (cloud) ---
GOOGLE_API_KEY=<votre_cle_google_ai_studio>
GROQ_API_KEY=<votre_cle_groq>
LANGCHAIN_API_KEY=<votre_cle_langsmith>

# --- PostgreSQL ---
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5433
POSTGRES_DB=ragdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<choisissez_un_mot_de_passe>

# --- MinIO ---
#MINIO_ENDPOINT=127.0.0.1:9002
MINIO_ENDPOINT=minio:9000
MINIO_PUBLIC_ENDPOINT=localhost:9002
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=rag-documents
MINIO_SECURE=False

# --- ChromaDB ---
CHROMA_PERSIST_DIR=./data/chroma
CHROMA_COLLECTION=multi_modal_rag_v4
EMBEDDING_MODEL=models/gemini-embedding-001

# --- Authentification JWT ---
JWT_SECRET_KEY=<a_generer_ci-dessous>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**Génération du secret JWT** (nécessite Python déjà installé, ou générez-le sur [ce site](https://generate-secret.vercel.app/32)) :
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copiez le résultat dans `JWT_SECRET_KEY=`.

> ⚠️ Sans ce fichier `.env` complet, la commande de l'étape 3 démarrera les conteneurs mais le backend s'arrêtera immédiatement (variables de configuration manquantes).
## 3. Lancement

Depuis la racine du projet (là où se trouve `docker-compose.yml`) :

```bash
docker-compose up -d --build
```

Premier lancement : plusieurs minutes (téléchargement des images de base, installation des dépendances, compilation du frontend). Les lancements suivants seront nettement plus rapides grâce au cache Docker.

### Ce que cette commande fait automatiquement
- Démarre PostgreSQL et MinIO, avec vérification de bonne santé
- Construit et démarre le backend (API) et le frontend (interface web)

### Ce qu'elle ne fait PAS automatiquement
- Créer les tables de la base de données
- Créer un compte administrateur
- Ingérer des documents dans la base documentaire

Ces trois étapes sont volontaires et manuelles (elles ne doivent s'exécuter qu'une fois, pas à chaque redémarrage) — voir section 4.

---

## 4. Initialisation (à faire une seule fois, après le premier lancement)

Vérifiez d'abord que les conteneurs sont bien démarrés et en bonne santé :
```bash
docker-compose ps
```

Puis, dans l'ordre :

```bash
# a. Création des tables de la base de données
docker-compose exec backend alembic upgrade head

# b. Création d'un compte administrateur
docker-compose exec backend python -m scripts.create_admin

```

## 5. Accès à l'application

| Service | Adresse |
|---|---|
| Application web | http://localhost:5173 |
| Documentation technique de l'API | http://localhost:8000/docs |
| Console d'administration MinIO | http://localhost:9003 |

Connectez-vous avec le compte administrateur créé à l'étape 4b.

---

## 6. Arrêt / redémarrage

```bash
docker-compose stop      # arrête sans supprimer les données
docker-compose up -d     # relance (pas besoin de --build si le code n'a pas changé)
```

⚠️ N'utilisez **jamais** `docker-compose down -v` sauf volonté explicite de tout réinitialiser — le `-v` supprime définitivement les données de la base et les documents indexés.

---

## En cas de problème

Consultez la section « Dépannage » du guide d'installation complet (`GUIDE_INSTALLATION.md`), qui documente les incidents les plus fréquemment rencontrés au cours du développement (conflits de ports, dérive de mot de passe Postgres, etc.).

Diagnostic rapide dans tous les cas :
```bash
docker-compose logs -f backend
```
