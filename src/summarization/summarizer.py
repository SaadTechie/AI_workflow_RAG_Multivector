from langchain_core.runnables import RunnableLambda
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from ..config import settings
import litellm
litellm.suppress_debug_info = True
# ou pour couper carrément les logs d'erreur intermédiaires :
import logging
logging.getLogger("LiteLLM").setLevel(logging.CRITICAL)

import os
os.environ.setdefault("GEMINI_API_KEY", settings.GOOGLE_API_KEY)

# ----------- TEXT / TABLE -----------

TEXT_PROMPT = """
You are an assistant tasked with summarizing tables and text.

Give a concise summary of the table or text in the input language.

Respond only with the summary.
Strict constraints:
- Base your summary STRICTLY on automotive/vehicle technical regulations context.
- Do NOT assume or invent topics like visas, immigration, or travel.
- Respond only with the summary, no additional comment.

Table or text chunk:

{element}
"""

text_prompt = ChatPromptTemplate.from_template(TEXT_PROMPT)

def _to_litellm_messages(prompt_value) -> list[dict]:
    return [{"role": "user", "content": m.content} for m in prompt_value.to_messages()]

def _summarize_with_fallback(prompt_value) -> str:
    response = litellm.completion(
        model="groq/openai/gpt-oss-20b",
        messages=_to_litellm_messages(prompt_value),
        fallbacks=["gemini/gemini-3.5-flash-lite"],
        temperature=0.0,
        num_retries=1,
    )
    return response.choices[0].message.content

summarize_chain = (
    text_prompt
    | RunnableLambda(lambda msgs: _summarize_with_fallback(msgs))
    | StrOutputParser()
)
    

# ----------- IMAGE -----------

IMAGE_PROMPT = """Décrivez cette image de manière détaillée dans le contexte d'un processus d'homologation véhicule.

Identifiez tous les éléments présents : étapes du processus, acteurs impliqués, documents, formulaires, systèmes d'information, décisions, flux, relations entre les blocs, tableaux, captures d'écran, diagrammes, schémas et annotations.

Expliquez le rôle de chaque élément ainsi que la séquence des opérations représentées. Décrivez précisément les interactions entre les acteurs, les entrées et sorties de chaque étape, les validations, les livrables produits et les systèmes utilisés.

Conservez intégralement les intitulés métier importants tels qu'ils apparaissent dans l'image, notamment les acronymes, références documentaires et termes spécifiques : RCE, TVV, CNIT, COC, NRE, DGM, HVE, TWV, ainsi que tout autre terme métier présent.

Pour les tableaux, restituez les colonnes, les lignes, les intitulés et les informations visibles. Pour les schémas de processus, décrivez les flux, les flèches, les décisions, les dépendances et l'ordre chronologique des étapes. Pour les captures d'écran, identifiez l'application affichée, les informations métier visibles, les références, les statuts, les pièces jointes et les actions demandées.

Vous êtes un expert en homologation automobile. Analysez cette image issue d'une présentation technique intitulée : 
"An introduction to Homologation Compliance: Regulation, Homologation and Standards".

Produisez une description textuelle exhaustive et structurée, optimisée pour l'indexation dans un système de recherche documentaire (RAG) par embedding.

Consignes de contenu :
1. RÔLE ET FLUX DE PROCESSUS : Expliquez le rôle de chaque élément, la séquence des opérations, les interactions entre acteurs, les entrées/sorties, les validations et les systèmes utilisés (ex: portails web, bases de données).
2. CONSERVATION STRICTE DES TERMES MÉTIER : Conservez TOUS les acronymes, références documentaires, noms de formulaires, codes projet, numéros de version, identifiants et termes spécifiques (ex: RHN, RD2, WVTA, COP, FMI, etc.).
3. TABLEAUX ET SCHÉMAS : Restituez intégralement les colonnes, lignes et valeurs visibles dans les tableaux. Pour les schémas, décrivez les flèches, les dépendances et l'ordre chronologique des étapes.
4. CAPTURES D'ÉCRAN ET CERTIFICATS : Identifiez l'application ou le portail affiché, les statuts, références, pièces jointes et actions demandées.
5. RIGUEUR & ANTI-HALLUCINATION : Ne décrivez STRICTEMENT que ce qui est visible dans l'image. N'inventez pas d'informations non écrites.
6. TITRE ET CONTEXTE DE SLIDE : Si un titre de slide ou d'étape est visible (ex: "Homologation process stage 2: SYSTEM TYPE APPROVAL"), reproduisez-le explicitement en première phrase. Ces titres sont des points d'ancrage critiques pour la recherche.
7. MOTS-CLÉS DE RECHERCHE : Terminez la description par une ligne "Mots-clés: " suivie de 5-8 termes courts résumant le sujet (ex: essai, choc frontal, certificat d'homologation, document d'information, rapport de test).

Consignes STRICTES de format de sortie (à respecter impérativement) :
- N'écrivez AUCUN titre, AUCUN en-tête Markdown (pas de #, ##, ###, ni de texte en gras type **Titre**).
- N'écrivez AUCUNE phrase d'introduction ou de contextualisation (interdits : "Voici la description...", "Description de l'image", "CONTEXTE DE L'IMAGE", "Cette image montre...", "Dans cette présentation...").
- N'ajoutez AUCUNE conclusion ni phrase de clôture (interdits : "En résumé...", "Cette image illustre...").
- La toute première ligne de votre réponse doit être la première information factuelle elle-même, sans aucun préambule.
- Rédigez en prose continue et/ou listes à puces brutes, directement exploitable telle quelle comme chunk de texte pour un moteur d'embedding.
- N'utilisez aucune mise en forme Markdown superflue (pas de gras, pas d'italique, pas de blocs de citation).

Répondez uniquement avec le contenu factuel demandé, rien d'autre avant ou après

L'objectif est de générer une description textuelle optimisée pour un système de recherche documentaire (RAG). Conservez tous les termes métier, acronymes, références documentaires, noms de formulaires, codes projet, identifiants, numéros de version, liens, procédures et étapes de processus. Ne résumez pas excessivement l'image et ne supprimez aucune information importante visible. Produisez une description exhaustive, structurée et fidèle au contenu de l'image."""

image_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "user",
            [
                {"type": "text", "text": IMAGE_PROMPT},
                {
                    "type": "image_url",
                    "image_url": {
                        # ⬇️ dynamique au lieu de "data:image/jpeg;base64,{image}" codé en dur.
                        # Vos ImageRecord (PDF -> image/png, PPTX -> réel) portent le bon mime type,
                        # on ne veut pas mentir à Gemini sur le format envoyé.
                        "url": "data:{mime_type};base64,{image}"
                    },
                },
            ],
        )
    ]
)

image_chain = (
    image_prompt
    | ChatGoogleGenerativeAI(
        model="gemini-3.5-flash-lite",
        google_api_key=settings.GOOGLE_API_KEY,
        max_retries=5,   # utile aussi pour absorber les 429 ponctuels
    )
    | StrOutputParser()
)