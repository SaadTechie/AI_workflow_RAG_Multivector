from typing import Dict, Any, List
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

from ..config import settings
from ..rag.retriever import retrieve_by_type


def build_prompt(inputs: Dict[str, Any]) -> List[HumanMessage]:
    """Construit le message multimodal (Texte + Images Base64) pour Gemini."""
    docs_by_type = inputs["context"]
    user_question = inputs["question"]

    context_text = ""
    if docs_by_type["texts"]:
        for text_element in docs_by_type["texts"]:
            context_text += text_element.page_content + "\n\n"

    prompt_template = f"""Tu es un assistant IA expert en homologation automobile.Répondez à la question en vous basant exclusivement sur le contexte fourni ci-dessous (texte, tableaux et images). Utilisez uniquement les informations présentes dans ce contexte. Si la réponse n'est pas explicitement disponible ou ne peut pas être déduite de manière fiable à partir du contexte, indiquez que l'information n'est pas disponible. Conservez les termes métier, acronymes et références documentaires tels qu'ils apparaissent dans les documents.

    Si une ou plusieurs images du contexte illustrent directement un élément de votre réponse (schéma, certificat, capture d'écran, tableau visuel), mentionnez-le explicitement en fin de réponse sous la forme "Voir l'Image N" en vous référant à l'ordre dans lequel les images sont fournies ci-dessous.

    Context:
    {context_text}

    Question: {user_question}"""

    prompt_content: List[Dict[str, Any]] = [{"type": "text", "text": prompt_template}]

    if docs_by_type["images"]:
        for img in docs_by_type["images"]:
            prompt_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{img['content_type']};base64,{img['data']}"}
            })

    return [HumanMessage(content=prompt_content)]


def fetch_context(inputs: dict):
    """Extrait la question et les paramètres k pour le retriever."""
    return retrieve_by_type(
        question=inputs.get("question"),
        k_text=inputs.get("k_text"),
        k_table=inputs.get("k_table"),
        k_image=inputs.get("k_image")
    )


# Modèle d'inférence Gemini Multimodal
llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",
    google_api_key=settings.GOOGLE_API_KEY,
    temperature=0.0,
    max_retries=5
)

# ---------------------------------------------------------
# CHAÎNE 1 : Chaîne de génération simple (renvoie juste le texte)
# ---------------------------------------------------------
chain = (
    RunnablePassthrough.assign(context=fetch_context)
    | RunnableLambda(build_prompt)
    | llm
    | StrOutputParser()
)

# ---------------------------------------------------------
# CHAÎNE 2 : Chaîne complète (renvoie le dictionnaire entier)
# ---------------------------------------------------------
# Permet à l'API de récupérer result["answer"] ET result["context"]
chain_with_sources = RunnablePassthrough().assign(
    context=fetch_context
).assign(
    answer=(
        RunnableLambda(build_prompt)
        | llm
        | StrOutputParser()
    )
)