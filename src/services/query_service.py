from ..rag.pipeline import rag_pipeline
from ..schemas.schemas import QueryRequest, QueryResponse

from uuid import UUID
from sqlalchemy.orm import Session
from datetime import datetime

from ..models.models import Conversation, Message, User
from fastapi import HTTPException, status
from datetime import datetime, timezone


class QueryService:
    def answer_question(
            self,
            request: QueryRequest,
            current_user: User,
            db: Session
        ) -> QueryResponse:
        """Exécute la question de l'utilisateur dans le pipeline RAG multimodal."""
        # 1. Vérifier que la conversation appartient bien à l'utilisateur
        conv = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id
        ).first()

        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation introuvable ou accès non autorisé."
            )
        print("1. Recherche des messages récents...")
        # 2. Charger les 6 derniers messages pour la mémoire contextuelle
        recent_messages = (
            db.query(Message)
            .filter(Message.conversation_id == request.conversation_id)
            .order_by(Message.created_at.desc())
            .limit(6)
            .all()
        )

        recent_messages.reverse() # pour que le plus ancien soit en premier

        # Formater l'historique sous forme de texte
        history_str = ""
        for msg in recent_messages:
            role_label = "Utilisateur" if msg.role == "user" else "Assistant"
            history_str += f"{role_label}: {msg.content}\n"


        
        print("2. Lancement du pipeline RAG...")
        # 3. Exécuter la question dans le pipeline RAG
        rag_response = rag_pipeline.run(
            question=request.question,
            chat_history=history_str, 
            k_text=request.k_text, 
            k_table=request.k_table, 
            k_image=request.k_image
          )

        # Convertir les objets Pydantic 'sources' en dictionnaires pour le champ JSONB de Postgres
        sources_dict = [source.model_dump() for source in rag_response.sources]
        # 4. Enregistrer la question de l'utilisateur dans PostgreSQL
        user_msg = Message(
            conversation_id=request.conversation_id,
            role="user",
            content=request.question
        )
        db.add(user_msg)

        # 5. Enregistrer la réponse du bot avec ses sources dans PostgreSQL
        assistant_msg = Message(
            conversation_id=request.conversation_id,
            role="assistant",
            content=rag_response.answer,
            sources=sources_dict
        )
        db.add(assistant_msg)
        print("3. Sauvegarde dans PostgreSQL...")
        # 6. Mettre à jour la date de modification de la conversation et valider
        conv.updated_at = datetime.now(timezone.utc)
        db.commit()
        print("4. Terminé !")
        return rag_response

    


query_service = QueryService()