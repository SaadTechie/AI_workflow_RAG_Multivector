import streamlit as st
import requests

import os
API_URL = os.getenv("API_URL", "http://127.0.0.1:8000")

st.set_page_config(
    page_title="Plateforme Inteligent - Homologation",
    page_icon="🚗",
    layout="wide"
)

st.title("🚗 Assistant Multimodal — Homologation Automobile")

# Stockage de l'historique du tchat dans la session Streamlit
if "messages" not in st.session_state:
    st.session_state.messages = []

# ==========================================
# BARRE LATÉRALE : STATUS & GESTION DES DOCS
# ==========================================
with st.sidebar:
    st.header("⚙️ Configuration & Base de données")
    
    # 1. Test de connexion Backend API
    try:
        res = requests.get(f"{API_URL}/health", timeout=3)
        if res.status_code == 200:
            st.success("API Backend : Connectée ✅")
        else:
            st.error("API Backend : Erreur ❌")
    except Exception:
        st.error("API Backend : Inaccessible ❌")

    st.divider()

    # 2. Section POC / Supports Entreprise
    st.subheader("📌 Documents de Référence POC")
    st.info(
        "Les 2 supports techniques d'homologation de l'entreprise sont pré-indexés "
        "dans la base vectorielle (ChromaDB + PostgreSQL)."
    )

    st.divider()

    # 3. Section d'ingestion dynamique (optionnelle)
    st.subheader("📤 Ingestier un nouveau fichier")
    uploaded_file = st.file_uploader("Ajouter un support (PDF / PPTX)", type=["pdf", "pptx"])
    if uploaded_file is not None:
        if st.button("Lancer l'ingestion"):
            with st.spinner("Extraction, résumés multimodaux et indexation en cours..."):
                files = {"file": (uploaded_file.name, uploaded_file.getvalue())}
                response = requests.post(f"{API_URL}/upload", files=files)
                
                if response.status_code == 200:
                    data = response.json()
                    st.success(f"Fichier '{uploaded_file.name}' indexé avec succès ! 🎉")
                    st.json(data.get("counts", {}))
                else:
                    st.error(f"Erreur d'ingestion : {response.text}")


# ==========================================
# ESPACE PRINCIPAL : CHATBOT RAG MULTIMODAL
# ==========================================

# Affichage des messages précédents
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        
        # Si le message contient des sources, les afficher
        if "sources" in message and message["sources"]:
            with st.expander("📚 Sources & Documents consultés"):
                for idx, src in enumerate(message["sources"], 1):
                    src_type = src.get("type", "text").upper()
                    st.write(f"**[{src_type}] Source {idx}** — `{src.get('source', 'Inconnu')}`")
                    
                    if src.get("content_preview"):
                        st.caption(f"_{src['content_preview']}_")
                    
                    # Affichage des images retournées via l'URL presignée MinIO
                    if src.get("image_url"):
                        st.image(
                            src["image_url"], 
                            caption=f"Image issue du document : {src.get('doc_id')}", 
                            use_container_width=True
                        )

# Zone de saisie de la question utilisateur
if prompt := st.chat_input("Posez votre question sur l'homologation véhicule..."):
    # 1. Afficher et stocker le message de l'utilisateur
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # 2. Interroger l'API FastAPI
    with st.chat_message("assistant"):
        with st.spinner("Recherche hybride & génération Gemini en cours..."):
            try:
                payload = {"question": prompt, "k_text": 8, "k_table": 8, "k_image": 8}
                response = requests.post(f"{API_URL}/query", json=payload)

                if response.status_code == 200:
                    data = response.json()
                    answer = data.get("answer", "Pas de réponse générée.")
                    sources = data.get("sources", [])

                    # Affichage de la réponse textuelle de Gemini
                    st.markdown(answer)

                    # Affichage des sources et des images
                    if sources:
                        with st.expander("📚 Sources & Documents consultés"):
                            for idx, src in enumerate(sources, 1):
                                src_type = src.get("type", "text").upper()
                                st.write(f"**[{src_type}] Source {idx}** — `{src.get('source', 'Inconnu')}`")
                                
                                if src.get("content_preview"):
                                    st.caption(f"_{src['content_preview']}_")
                                
                                if src.get("image_url"):
                                    st.image(
                                        src["image_url"], 
                                        caption=f"Image issue du document : {src.get('doc_id')}", 
                                        use_container_width=True
                                    )

                    # Stocker la réponse dans l'historique
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": answer,
                        "sources": sources
                    })
                else:
                    st.error(f"Erreur de l'API RAG : {response.text}")

            except Exception as e:
                st.error(f"Impossible de se connecter au serveur backend : {str(e)}")