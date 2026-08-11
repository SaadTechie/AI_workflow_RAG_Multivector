"""
Point d'entrée unique pour ingestion_service.py.
"""
from ..extraction.base import ExtractionResult
from .text_summary import summarize_texts
from .table_summary import summarize_tables
from .image_summary import summarize_images
import re


def summarize_extraction(result: ExtractionResult) -> dict:
    text_summaries = summarize_texts(result.texts)
    table_summaries = summarize_tables(result.tables)
    image_summaries = summarize_images(result.images)

    def clean_summary(text: str) -> str:
        text = re.sub(r'^#{1,6}\s.*$', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\*\*[^*]+\*\*\s*$', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n{3,}', '\n\n', text).strip()
        return text

    image_summaries = [clean_summary(s) for s in image_summaries]

    assert len(text_summaries) == len(result.texts), "Désalignement texts/text_summaries"
    assert len(table_summaries) == len(result.tables), "Désalignement tables/table_summaries"
    assert len(image_summaries) == len(result.images), "Désalignement images/image_summaries"

    return {
        "text_summaries": text_summaries,
        "table_summaries": table_summaries,
        "image_summaries": image_summaries,
    }