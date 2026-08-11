from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from langchain_core.documents import Document


@dataclass
class ImageRecord:
    data: str
    ext: str
    content_type: str
    source_location: Optional[int] = None


@dataclass
class ExtractionResult:
    texts: list[Document]
    tables: list[Document]
    images: list[ImageRecord]


class Extractor(ABC):

    @abstractmethod
    def extract(self, file_path: str) -> ExtractionResult:
        pass