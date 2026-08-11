import time

from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from ..extraction.base import ImageRecord
from .summarizer import image_chain
from ..config import settings


def _batched(items: list, size: int):
    for i in range(0, len(items), size):
        yield items[i:i + size]

SUPPORTED_MIME_TYPES = {
    "image/png", "image/jpeg", "image/jpg", 
    "image/webp", "image/heic", "image/heif"
}


def summarize_images(images: list[ImageRecord]) -> list[str]:
    """
    Batché avec pause entre chaque lot -> évite les 429 sur Gemini vision
    quand le nombre d'images grossit (52+ dans vos tests). Renvoie une
    liste de même longueur que `images`, dans le même ordre (garde
    l'alignement avec ImageRecord pour la suite du pipeline).
    """
    if not images:
        return []

    # 🟢 Pré-allocation par index -> garantit l'alignement quel que soit
    # le mélange de formats supportés/non supportés
    summaries: list[str] = [None] * len(images)

    supported_indices = []
    inputs = []

    for i, img in enumerate(images):
        if img.content_type.lower() not in SUPPORTED_MIME_TYPES:
            summaries[i] = f"[Image au format vectoriel ({img.ext}) non supportée par la vision]"
        else:
            supported_indices.append(i)
            inputs.append({"image": img.data, "mime_type": img.content_type})

    if not inputs:
        return summaries

    index_batches = list(_batched(supported_indices, settings.VISION_BATCH_SIZE))
    input_batches = list(_batched(inputs, settings.VISION_BATCH_SIZE))

    for batch_idx, (idx_batch, input_batch) in enumerate(zip(index_batches, input_batches)):
        try:
            results = _invoke_batch_with_backoff(input_batch)
            for i, result in zip(idx_batch, results):
                summaries[i] = result
        except Exception:
            # repli image par image : isole celle qui pose problème
            for i, single in zip(idx_batch, input_batch):
                try:
                    summaries[i] = _invoke_single_with_backoff(single)
                except Exception:
                    summaries[i] = "[Résumé image indisponible - Erreur API Vision]"

        if batch_idx < len(index_batches) - 1:
            time.sleep(settings.VISION_BATCH_PAUSE_S)

    return summaries


# --------------------------------------------------------------------------
# Backoff exponentiel dédié aux erreurs de quota (429 / ResourceExhausted)
# --------------------------------------------------------------------------

@retry(
    wait=wait_exponential(multiplier=2, min=4, max=60),
    stop=stop_after_attempt(5),
    reraise=True,
)
def _invoke_batch_with_backoff(batch):
    return image_chain.batch(batch, {"max_concurrency": settings.VISION_CONCURRENCY})


@retry(
    wait=wait_exponential(multiplier=2, min=4, max=60),
    stop=stop_after_attempt(5),
    reraise=True,
)
def _invoke_single_with_backoff(single):
    return image_chain.invoke(single)