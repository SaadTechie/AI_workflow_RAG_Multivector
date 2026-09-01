//code mort à supprimer -- plus utilisé depuis qu'App.tsx gère tout en interne)
import { useEffect, useState } from 'react';
import { sendChatMessage } from '../api/chat.api';
import type { Message, ChatRequest } from '../types/api.types';

export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMessages([]);   // 🟢 vide l'historique affiché à chaque nouvelle conversation
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // 1. Ajouter le message de l'utilisateur à l'UI
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 2. Préparer le payload (avec vos paramètres RAG par défaut)
      const payload: ChatRequest = {
        conversation_id: conversationId,
        question: content,
        k_text: 8,
        k_table: 4,
        k_image: 2,
      };

      // 3. Appel backend
      const response = await sendChatMessage(payload);

      // 4. Ajouter la réponse de l'assistant
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Je n'ai pas pu traiter votre demande. Veuillez réessayer.",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, sendMessage };
};