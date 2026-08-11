import base64,os
import hashlib

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
from langchain_core.documents import Document

from .base import (
    Extractor,
    ExtractionResult,
    ImageRecord
)


def _iter_shapes(shapes):
    for shape in shapes:
        if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
            yield from _iter_shapes(shape.shapes)
        else:
            yield shape


class PPTXExtractor(Extractor):

    def extract(self, file_path: str) -> ExtractionResult:

        prs = Presentation(file_path)

        text_docs = []
        table_docs = []
        image_records = []

        seen_hashes = set()

        for slide_idx, slide in enumerate(prs.slides, start=1):

            slide_text_parts = []

            for shape in _iter_shapes(slide.shapes):

                # TABLES
                if shape.has_table:

                    html = "<table>"

                    for row in shape.table.rows:
                        html += "<tr>"

                        for cell in row.cells:
                            html += f"<td>{cell.text.strip()}</td>"

                        html += "</tr>"

                    html += "</table>"

                    table_docs.append(
                        Document(
                            page_content=html,
                            metadata={
                                "type": "table",
                                "slide": slide_idx,
                                "source": file_path
                            }
                        )
                    )

                # IMAGES
                elif shape.shape_type == MSO_SHAPE_TYPE.PICTURE:

                    image_bytes = shape.image.blob

                    img_hash = hashlib.sha256(
                        image_bytes
                    ).hexdigest()

                    if img_hash in seen_hashes:
                        continue

                    seen_hashes.add(img_hash)

                    image_records.append(
                        ImageRecord(
                            data=base64.b64encode(
                                image_bytes
                            ).decode("utf-8"),
                            ext=shape.image.ext,
                            content_type=shape.image.content_type,
                            source_location=slide_idx
                        )
                    )

                # TEXT
                elif shape.has_text_frame:

                    text = shape.text.strip()

                    if text:
                        slide_text_parts.append(text)

            if slide_text_parts:

                text_docs.append(
                    Document(
                        page_content="\n".join(
                            slide_text_parts
                        ),
                        metadata={
                            "type": "text",
                            "slide": slide_idx,
                            "source": file_path
                        }
                    )
                )

        
        os.makedirs("extracted_images", exist_ok=True)
        print(f"Saving {len(image_records)} extracted images")

        return ExtractionResult(
            texts=text_docs,
            tables=table_docs,
            images=image_records
        )