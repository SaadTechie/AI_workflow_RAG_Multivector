<!---
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: auto; padding: 20px; }
h1 { color: #2c3e50; border-bottom: 3px solid #3498db; }
h2 { color: #34495e; border-bottom: 2px solid #ecf0f1; }
code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
pre { background: #f8f8f8; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db; }
table { border-collapse: collapse; width: 100%; }
th { background: #3498db; color: white; padding: 10px; }
td { border: 1px solid #ddd; padding: 8px; }
tr:nth-child(even) { background: #f9f9f9; }
</style>
--->

# Guide d'installation — Assistant IA d'Homologation Véhicule

Ce document décrit l'installation complète du projet sur un poste n'ayant jamais exécuté le code, en partant de zéro. Il couvre le scénario principal (infrastructure en Docker, backend et frontend en local pour le développement) ainsi qu'une alternative "tout Docker" en une seule commande.

---

## 1. Prérequis logiciels

| Outil | Version testée | Rôle |
|---|---|---|
| Python | 3.12.6 | Backend FastAPI |
| Node.js | 20.x ou supérieur | Frontend React/Vite |
| Docker Desktop | récent, avec Docker Compose v2 | Postgres, MinIO (et frontend/backend en option) |
| Git | — | Récupération du dépôt |

### Outils système requis pour l'extraction de documents (uniquement si le backend tourne en local, hors Docker)

| Outil | Version testée | Pourquoi |
|---|---|---|
| Tesseract OCR | 5.5.0.20241111 | OCR sur les PDF scannés (`unstructured`, stratégie `hi_res`) |
| Poppler | 25.12.0 | Rendu des pages PDF (`pdf2image`) |

> ⚠️ Ces deux outils système ne sont nécessaires **que si vous lancez le backend directement sur votre machine** (pas via Docker). Si vous passez par le scénario "tout Docker" (section 8), ils sont déjà installés dans l'image du conteneur — aucune action requise.

**Installation Windows :**
- Tesseract : installeur [UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki), en cochant le pack de langue **French**. Ajoutez le dossier d'installation au `PATH` système.
- Poppler : téléchargez le [build Windows officiel](https://github.com/oschwartz10612/poppler-windows/releases), extrayez et ajoutez le sous-dossier `bin/` au `PATH`.

**Vérification après installation :**
```powershell
tesseract --list-langs      # doit afficher "fra" dans la liste
pdftoppm -v                 # doit afficher un numéro de version
```

---

## 2. Récupération du projet

```powershell
git clone <url-du-depot>
cd AI_workflow
```

---

## 3. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet (à côté de `docker-compose.yml`), sur le modèle suivant :

```dotenv
# --- Clés API des modèles cloud (phase actuelle du projet) ---
GOOGLE_API_KEY=votre_cle_google_ai_studio
GROQ_API_KEY=votre_cle_groq
LANGCHAIN_API_KEY=votre_cle_langsmith        # requis par la config même si non utilisé activement

# --- PostgreSQL ---
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5433
POSTGRES_DB=ragdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=choisissez_un_mot_de_passe

# --- MinIO ---
MINIO_ENDPOINT=localhost:9002
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
JWT_SECRET_KEY=a_regenerer_voir_section_4
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

> Les ports `5433` (Postgres) et `9002`/`9003` (MinIO) sont volontairement décalés des ports par défaut (`5432`/`9000`/`9001`) pour éviter tout conflit avec un service déjà installé sur la machine hôte (cause fréquente d'échec de démarrage — voir section 9, dépannage).

### Génération d'un secret JWT sécurisé

Un secret trop court déclenche un avertissement de sécurité (`InsecureKeyLengthWarning`) et fragilise l'authentification. Générez-en un correct :

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copiez le résultat dans `JWT_SECRET_KEY=` du `.env`.

---

## 4. Démarrage de l'infrastructure (Postgres + MinIO)

```powershell
docker-compose up -d postgres minio
```

Vérifiez que les deux services sont `healthy` avant de continuer :
```powershell
docker-compose ps
```

---

## 5. Environnement Python et dépendances

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt --break-system-packages
```

---

## 6. Initialisation de la base de données

Le schéma est géré par **Alembic**. Depuis la racine du projet :

```powershell
alembic upgrade head
```

Cette commande crée les tables applicatives (`users`, `conversations`, `messages`). La table `langchain_key_value_stores` (utilisée par le pipeline RAG pour stocker le contenu brut) se crée automatiquement au premier lancement du backend.

---

## 7. Lancement du backend

```powershell
uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

Vérifiez que le démarrage se termine par `Application startup complete.` sans traceback. Documentation interactive disponible sur `http://127.0.0.1:8000/docs`.

### Création d'un compte administrateur

Nécessaire pour accéder à l'espace d'administration (ingestion de documents, gestion des utilisateurs) :

```powershell
python -m scripts.create_admin
```
*(ajustez le nom du script selon celui présent dans `scripts/` — modifiez l'email/mot de passe en tête du fichier avant exécution)*

### Ingestion initiale des documents

Deux options :
- **Via script** (documents placés à l'avance dans `data/uploads/`) :
  ```powershell
  python -m scripts.ingest_initial_docs
  ```
- **Via l'interface web**, une fois connecté en tant qu'administrateur (section 8) : page `/admin/upload`.

> L'ingestion peut prendre plusieurs minutes par document (extraction, résumés IA, vectorisation). C'est normal, ne pas interrompre le processus.

---

## 8. Lancement du frontend (mode développement)

Dans un second terminal :

```powershell
cd frontend
npm install
npm run dev
```

Application accessible sur `http://localhost:5173`. Le serveur de développement Vite redirige automatiquement les appels `/api/*` vers le backend (`http://127.0.0.1:8000`) — aucune configuration CORS supplémentaire n'est nécessaire dans ce mode.

---

## 9. Alternative — Démarrage complet via Docker (une seule commande)

Pour éviter d'installer Node/Python en local, l'ensemble de la stack peut être conteneurisé :

```powershell
docker-compose up -d --build
```

Cette commande construit et démarre les 4 services (`postgres`, `minio`, `backend`, `frontend`). Le frontend est alors accessible sur `http://localhost:5173`, servi par un conteneur Nginx qui reproduit le comportement du proxy de développement.

**Étapes 6 et 7 (Alembic, création admin, ingestion) restent nécessaires**, en les exécutant à l'intérieur du conteneur backend :
```powershell
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m scripts.create_admin
docker-compose exec backend python -m scripts.ingest_initial_docs
```

---

## 10. Vérification de bon fonctionnement

1. `http://127.0.0.1:8000/health` → doit répondre `{"status": "healthy", ...}`
2. `http://localhost:5173` → page de connexion doit s'afficher avec le style visuel complet (si la page apparaît sans mise en forme, voir section 9 du dépannage)
3. Connexion avec le compte administrateur créé à l'étape 7
4. Poser une question test dans le chat, vérifier l'apparition d'une réponse et des sources associées
5. Rafraîchir la page (F5) sur une route comme `/admin/users` en étant connecté → doit rester sur cette page, pas de retour inattendu à l'accueil

---

## 11. Dépannage — problèmes fréquents et solutions

| Symptôme | Cause probable | Solution |
|---|---|---|
| `password authentication failed for user "postgres"` | Le conteneur Postgres a été créé une première fois avec un `.env` différent (le mot de passe n'est appliqué qu'à la création initiale du volume) | `docker-compose down` → `docker volume rm ai_workflow_postgres_data` → `docker-compose up -d postgres` |
| Le conteneur `minio` reste `unhealthy` | Le `healthcheck` du `docker-compose.yml` doit utiliser `mc ready local` (pas `curl`, absent des images MinIO récentes) | Vérifier le `healthcheck` dans `docker-compose.yml` |
| Connexion MinIO/Postgres échoue avec une erreur réseau bizarre alors que le conteneur est `healthy` | Un autre service Windows écoute déjà sur le port `5432`/`9000` (VPN, install locale antérieure, etc.) | `netstat -ano \| findstr :5432` pour identifier le conflit ; les ports du projet sont déjà décalés (`5433`/`9002`) pour l'éviter |
| `relation "langchain_key_value_stores" does not exist` | Le schéma du docstore RAG n'a pas été créé | Redémarrer le backend une fois (la création est automatique au premier import) ou exécuter manuellement `SQLStore(...).create_schema()` |
| Le backend reste bloqué au démarrage, sans afficher `Application startup complete.` | `litellm` tente un appel réseau bloquant à l'import (récupération de sa table de coûts) | Vérifier que `main.py` définit bien `os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"` **avant** l'import des routers |
| La page de connexion s'affiche sans aucune mise en forme (texte brut, pas de couleurs) | Tailwind v4 : les couleurs personnalisées ne sont générées que si elles sont déclarées dans un bloc `@theme` de `index.css` (pas dans un simple `:root`, et pas via `tailwind.config.ts` sans directive `@config`) | Vérifier `frontend/src/index.css` |
| `npm run dev` plante avec `Invalid hook call` | Copie de `react` dupliquée dans `node_modules` après ajout d'une dépendance | `rm -rf node_modules package-lock.json && npm install` dans `frontend/` |
| Erreur `422 Unprocessable Entity` sur `/query` ou `/conversations` | Corps de requête vide ou champ mal nommé (le backend attend `question`, pas `query`) | Vérifier la charge utile envoyée dans `api/chat.api.ts` |
| `ModuleNotFoundError` au démarrage du backend | Une dépendance a été installée manuellement en cours de développement sans être ajoutée à `requirements.txt` | Comparer `pip freeze` avec `requirements.txt` |

---

## Annexe — Bascule vers une stack 100% locale (Ollama)

Le projet prévoit une architecture alternative reposant entièrement sur des modèles locaux (**Mistral 3 8B**, **Llama 3.2 Vision 11B**, **BGE-M3**), pour répondre à des exigences de confidentialité renforcées. Le code correspondant est présent en commentaire dans `summarizer.py`, `chroma_store.py` et `chain.py`.

> ⚠️ **Cette configuration n'a jamais été exécutée en conditions réelles.** Le développement du projet s'est fait sur un poste CPU uniquement (12 Go de RAM, sans GPU dédié), incompatible avec les prérequis matériels recommandés pour cette stack (GPU ≥ 8 Go de VRAM, en particulier pour le modèle de vision). Cette section décrit la marche à suivre pour un poste correctement équipé.

### Prérequis matériels
- GPU dédié avec ≥ 8 Go de VRAM (obligatoire pour un usage confortable du modèle de vision)
- ≥ 16 Go de RAM

### Étapes d'activation

1. Installer [Ollama](https://ollama.com) puis télécharger les modèles :
   ```powershell
   ollama pull mistral
   ollama pull llama3.2-vision:11b
   ollama pull bge-m3
   ```
2. Décommenter le code Ollama dans `summarizer.py`, `chroma_store.py` et `chain.py`, et ajouter `langchain-ollama` à `requirements.txt`.
3. Tester chaque brique isolément (génération texte, vision, embedding) avant intégration complète.
4. **Réindexer entièrement la base documentaire** — étape obligatoire, non optionnelle : BGE-M3 produit des vecteurs de 1024 dimensions, incompatibles avec les vecteurs `gemini-embedding-001` (3072 dimensions) déjà stockés. Aucune recherche ne fonctionnera sans cette étape.
   ```powershell
   docker-compose down
   Remove-Item -Recurse -Force .\data\chroma\*
   docker-compose exec postgres psql -U postgres -d ragdb -c "TRUNCATE langchain_key_value_stores;"
   docker-compose up -d postgres minio
   python -m scripts.ingest_initial_docs
   ```
   Réingérer ensuite manuellement, via l'interface d'administration, tout document ajouté depuis l'ingestion initiale.
