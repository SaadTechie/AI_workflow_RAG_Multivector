from ..rag.pipeline import rag_pipeline
from ..schemas.schemas import QueryRequest, QueryResponse


class QueryService:
    def answer_question(self, request: QueryRequest) -> QueryResponse:
        """Exécute la question de l'utilisateur dans le pipeline RAG multimodal."""
        #correction içi pour passer les paramètres k_text, k_table et k_image à la méthode run
        return rag_pipeline.run(
            question=request.question, 
            k_text=request.k_text, 
            k_table=request.k_table, 
            k_image=request.k_image
          )


query_service = QueryService()