// Requête envoyée au backend FastAPI
export interface ChatRequest {
  conversation_id: string;
  question: string;
  k_text?: number;
  k_table?: number;
  k_image?: number;
}

// Source retournée par le RAG
export interface SourceDocument {
  doc_id: string;
  type: 'text' | 'table' | 'image';
  source: string;
  location?: string; // ← Nouveau : "Page 5" ou "Slide 12"
  content_preview?: string;
  image_url?: string;
}

// Réponse reçue du backend FastAPI
export interface ChatResponse {
  question: string;
  answer: string;
  sources?: SourceDocument[];
}

// Structure locale d'un message pour l'UI
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceDocument[];
  isError?: boolean;
}