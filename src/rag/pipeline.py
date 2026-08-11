from ..rag.chain import chain_with_sources
from ..schemas.responses import QueryResponse, RetrievedSource


class RAGPipeline:
    def run(self, question: str, k_text: int = None, k_table: int = None, k_image: int = None) -> QueryResponse:
        try:
            result = chain_with_sources.invoke({
                "question": question,
                "k_text": k_text,
                "k_table": k_table,
                "k_image": k_image,
            })

            raw_context = result.get("context", {})
            answer_text = result.get("answer") or "Aucune information pertinente n'a été trouvée pour répondre à votre question."

            sources = []
            for doc in raw_context.get("texts", []):
                meta = getattr(doc, "metadata", {})
                sources.append(RetrievedSource(
                    doc_id=meta.get("doc_id", "unknown"),
                    type=meta.get("type", "text"),
                    source=meta.get("source", "unknown"),
                    content_preview=doc.page_content[:200] if hasattr(doc, "page_content") else str(doc)[:200]
                ))

            for img in raw_context.get("images", []):
                meta = img.get("metadata", {})
                sources.append(RetrievedSource(
                    doc_id=meta.get("doc_id", "unknown"),
                    type="image",
                    source=meta.get("source", "unknown"),
                    image_url=img.get("url")
                ))

            return QueryResponse(question=question, answer=answer_text, sources=sources)

        except Exception as e:
            print(f"Erreur dans la pipeline RAG : {e}")
            return QueryResponse(
                question=question,
                answer="Je n'ai pas pu traiter votre demande. Veuillez reformuler ou réessayer plus tard.",
                sources=[]
            )


rag_pipeline = RAGPipeline()