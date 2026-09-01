from typing import Dict, Any, List
from google import genai
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

from ..config import settings
from ..rag.retriever import retrieve_by_type

# Client unique natif Google pour éviter les conflits gRPC avec LangChain
genai_client = genai.Client(api_key=settings.GOOGLE_API_KEY)

#llm de géneration local

#from langchain_ollama import ChatOllama

# llm = ChatOllama(
   # model=settings.LLM_MODEL,
   # base_url=settings.OLLAMA_BASE_URL,
   # temperature=0.0,
#)


def reformulate_question(question: str, chat_history: str) -> str:
    """Reformule la question via le SDK natif google.genai."""
    if not chat_history or not chat_history.strip():
        return question

    prompt = f"""Étant donné l'historique de conversation ci-dessous et la nouvelle question, reformule la question en une requête de recherche autonome et explicite (sans pronoms ambigus, en reprenant les termes techniques déjà mentionnés). Si la question est déjà autonome, renvoie-la telle quelle. Réponds uniquement avec la question reformulée, rien d'autre.

    Historique:
    {chat_history}

    Nouvelle question: {question}"""

    try:
        #response = llm.invoke(prompt)
        response = genai_client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt
        )

        return response.text.strip()
    except Exception as e:
        print(f"Repli sur la question brute (erreur reformulation) : {e}")
        return question


def build_prompt(inputs: Dict[str, Any]) -> List[HumanMessage]:
    """Construit le message multimodal (Texte + Tableaux + Images Base64) pour Gemini."""
    docs_by_type = inputs.get("context", {})
    user_question = inputs.get("question", "")
    chat_history = inputs.get("chat_history", "")

    # 1. Extraction sécurisée du texte ET des tableaux
    context_text = ""
    texts = docs_by_type.get("texts", [])

    for element in texts :
        context_text += element.page_content + "\n\n"

    prompt_template = f"""Tu es un assistant IA expert en homologation automobile. Répondez à la question en vous basant sur le contexte et l'historique de conversation ci-dessous.
    Répondez à la question en vous basant exclusivement sur le contexte fourni ci-dessous (texte, tableaux et images). Utilisez uniquement les informations présentes dans ce contexte. Si la réponse n'est pas explicitement disponible ou ne peut pas être déduite de manière fiable à partir du contexte, indiquez que l'information n'est pas disponible. Conservez les termes métier, acronymes et références documentaires tels qu'ils apparaissent dans les documents.

    Si une ou plusieurs images du contexte illustrent directement un élément de votre réponse (schéma, certificat, capture d'écran, tableau visuel), mentionnez-le explicitement en fin de réponse sous la forme "Voir l'Image N" en vous référant à l'ordre dans lequel les images sont fournies ci-dessous.

    === HISTORIQUE DE LA CONVERSATION ===
    {chat_history if chat_history else "Aucun historique antérieur."}

    === CONTEXTE DOCUMENTAIRE ===
    {context_text if context_text else "Aucun texte ou tableau disponible."}

    === QUESTION ACTUELLE ===
    {user_question}"""

    prompt_content: List[Dict[str, Any]] = [{"type": "text", "text": prompt_template}]

    # 2. Ajout sécurisé des images
    images = docs_by_type.get("images", [])
    for img in images:
        if isinstance(img, dict) and "data" in img:
            content_type = img.get("content_type", "image/png")
            prompt_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{content_type};base64,{img['data']}"}
            })

    return [HumanMessage(content=prompt_content)]


# Modèle d'inférence Gemini Multimodal
llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash-lite",
    google_api_key=settings.GOOGLE_API_KEY,
    max_retries=5
)


def fetch_context(inputs: dict):
    """Extrait le contexte RAG en reformulant la question de manière native si nécessaire."""
    question = inputs.get("question", "")
    chat_history = inputs.get("chat_history", "")

    # Reformulation via SDK natif (pas de conflit de SDK)
    search_query = reformulate_question(question, chat_history)

    return retrieve_by_type(
        question=search_query,
        k_text=inputs.get("k_text"),
        k_table=inputs.get("k_table"),
        k_image=inputs.get("k_image")
    )


# ---------------------------------------------------------
# CHAÎNE COMPLÈTE
# ---------------------------------------------------------
chain_with_sources = RunnablePassthrough().assign(
    context=fetch_context
).assign(
    answer=(
        RunnableLambda(build_prompt)
        | llm
        | StrOutputParser()
    )
)