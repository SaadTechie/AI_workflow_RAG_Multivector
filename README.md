Python 3.12.6

External tools:
- Tesseract OCR 5.5.0.20241111
- Poppler 25.12.0

Installation:
pip install -r requirements.txt


## Stack locale (Ollama) — non testée

Le code de bascule vers une stack 100% locale (Mistral 3 8B, Llama 3.2 Vision 11B, 
BGE-M3, tout via Ollama) est présent en commentaire dans `summarizer.py`, 
`chroma_store.py` et `chain.py`.

⚠️ Ce code n'a jamais été exécuté : le développement s'est fait sur un poste 
CPU-only (12 Go RAM, sans GPU dédié), incompatible avec les prérequis matériels 
de cette stack (≥8 Go VRAM recommandés, voir tableau ci-dessous).

**Avant d'activer cette configuration sur un poste équipé :**
1. Décommenter le code Ollama dans les 3 fichiers cités
2. Installer Ollama + `ollama pull mistral:8b llama3.2-vision:11b bge-m3`
3. Tester chaque brique isolément (texte, vision, embedding) avant intégration
4. Réindexer entièrement la base documentaire (changement de modèle d'embedding = 
   espace vectoriel incompatible avec l'existant)


Commandes Ollama d'initialisation :
ollama pull mistral
ollama pull llama3.2-vision:11b
ollama pull bge-m3

## pour passer à la solution local ⚠️ Étape obligatoire — ré-indexation complète des  documents ingéré 
car BGE-M3 (1024 dimensions) est mathématiquement incompatible avec vos vecteurs gemini-embedding-001 actuels (3072 dimensions) — aucune recherche ne fonctionnera tant que vous 
n'avez pas tout réindexé

## Re-indexation :
docker-compose down
Remove-Item -Recurse -Force .\data\chroma\*
docker-compose exec postgres psql -U postgres -d ragdb -c "TRUNCATE langchain_key_value_stores;"
docker-compose up -d postgres minio
python -m scripts.ingest_initial_docs 
#Puis réingérez manuellement les documents ajoutés depuis via l'interface admin.


