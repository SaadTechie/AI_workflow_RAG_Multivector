import time
from typing import List
from langchain_core.documents import Document
from .summarizer import summarize_chain
from ..config import settings


def _batched(items: list, size: int):
    """Découpe une liste en sous-lots de taille fixe."""
    for i in range(0, len(items), size):
        yield items[i:i + size]


def summarize_texts(docs: List[Document], batch_size: int = settings.TEXT_BATCH_SIZE, pause_seconds: float = settings.TEXT_BATCH_PAUSE_S) -> List[str]:
    if not docs:
        return []

    # Extraction sécurisée du contenu textuel
    inputs = [
        {"element": d.page_content if hasattr(d, "page_content") else str(d)}
        for d in docs
    ]

    final_summaries: List[str] = []
    
    # 🟢 1. Découpage en sous-lots pour lisser la consommation de tokens (Groq 429 TPM)
    sub_batches = list(_batched(inputs, batch_size))

    for idx, batch_inputs in enumerate(sub_batches):
        # 🟢 2. Traitement du sous-lot avec concurrency contrôlée
        try:
            results = summarize_chain.batch(
                batch_inputs,
                config={"max_concurrency": settings.TEXT_CONCURRENCY},
                return_exceptions=True,
            )
        except Exception:
            results = [Exception("batch global échoué")] * len(batch_inputs)

        for i, res in enumerate(results):
            if isinstance(res, Exception):
                try:
                    # Retry individuel en cas d'échec sur l'élément du lot
                    time.sleep(pause_seconds)
                    summary = summarize_chain.invoke({"element": batch_inputs[i]["element"]})
                    final_summaries.append(summary)
                except Exception:
                    # Repli de sécurité : conservation du texte brut tronqué
                    final_summaries.append(batch_inputs[i]["element"][:1000])
            else:
                final_summaries.append(res)

        # 🟢 3. Pause stratégique entre chaque lot pour libérer la limite de débit TPM
        if idx < len(sub_batches) - 1:
            time.sleep(pause_seconds)

    return final_summaries