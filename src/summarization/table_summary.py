import time
from typing import List
from langchain_core.documents import Document
from .summarizer import summarize_chain
from ..config import settings


def _batched(items: list, size: int):
    """Découpe une liste en sous-lots de taille fixe."""
    for i in range(0, len(items), size):
        yield items[i:i + size]


def summarize_tables(docs: List[Document], batch_size: int = settings.TEXT_BATCH_SIZE, pause_seconds: float = settings.TEXT_BATCH_PAUSE_S) -> List[str]:
    if not docs:
        return []

    # Extraction sécurisée de la représentation textuelle / Markdown du tableau
    inputs = [
        {"element": d.page_content if hasattr(d, "page_content") else str(d)}
        for d in docs
    ]

    final_summaries: List[str] = []

    # Découpage en sous-lots pour réguler la consommation de tokens Groq
    sub_batches = list(_batched(inputs, batch_size))

    for idx, batch_inputs in enumerate(sub_batches):
        results = summarize_chain.batch(
            batch_inputs,
            config={"max_concurrency": settings.TEXT_CONCURRENCY},
            return_exceptions=True,
        )

        for i, res in enumerate(results):
            if isinstance(res, Exception):
                try:
                    # Tentative individuelle en cas d'erreur sur le lot
                    time.sleep(pause_seconds)
                    summary = summarize_chain.invoke({"element": batch_inputs[i]["element"]})
                    final_summaries.append(summary)
                except Exception:
                    # Repli de sécurité : contenu brut du tableau tronqué
                    final_summaries.append(batch_inputs[i]["element"][:1000])
            else:
                final_summaries.append(res)

        # Pause entre les lots pour respecter le quota TPM
        if idx < len(sub_batches) - 1:
            time.sleep(pause_seconds)

    return final_summaries