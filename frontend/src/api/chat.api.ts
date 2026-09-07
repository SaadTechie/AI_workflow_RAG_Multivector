import { fetchWithAuth } from './httpClient';
import type  { ChatRequest, ChatResponse, Message } from '../types/api.types';

export interface Conversation {
  id: string;
  title: string;
  created_at?: string;
}

// 1. Récupérer toutes les conversations de l'utilisateur
export const fetchConversations = async (): Promise<Conversation[]> => {
  const response = await fetchWithAuth('/api/conversations');
  if (!response.ok) throw new Error('Erreur lors du chargement de l\'historique');
  return response.json();
};

// 2. Récupérer les messages d'une conversation spécifique
export const fetchConversationMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await fetchWithAuth(`/api/conversations/${conversationId}/messages`);
  if (!response.ok) throw new Error('Erreur lors du chargement des messages');
  return response.json();
};

// 3. Renommer une conversation (style Claude/ChatGPT)
export const updateConversationTitle = async (conversationId: string, newTitle: string): Promise<Conversation> => {
  const response = await fetchWithAuth(`/api/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle }),
  });
  if (!response.ok) throw new Error('Erreur lors du renommage');
  return response.json();
};

// 4. Création d'une nouvelle session
export const createConversation = async (): Promise<Conversation> => {
  const response = await fetchWithAuth('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error('Échec de la création de conversation');
  return response.json();
};


// 5. Envoi du message
export const sendChatMessage = async (payload: ChatRequest): Promise<ChatResponse> => {
  const response = await fetchWithAuth('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: payload.conversation_id,
      question: payload.question,
      k_text: payload.k_text ?? 5,
      k_table: payload.k_table ?? 2,
      k_image: payload.k_image ?? 3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  return response.json();
};