import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MessageBubble } from './components/chat/MessageBubble';
import { ChatInput } from './components/chat/ChatInput';
import { SegulaLogo } from './components/ui/SegulaLogo';
import {
  type Conversation,
  fetchConversations,
  createConversation,
  updateConversationTitle,
  fetchConversationMessages,
  sendChatMessage,
} from './api/chat.api';
import type { Message } from './types/api.types';

export const App: React.FC = () => {
  const { user, token, loading, login, register, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Charger les conversations au démarrage
  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token]);

  const loadConversations = async () => {
    try {
      const list = await fetchConversations();
      setConversations(list);
      if (list.length > 0 && !currentSessionId) {
        selectConversation(list[0].id);
      } else if (list.length === 0) {
        handleNewChat();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectConversation = async (id: string) => {
    setCurrentSessionId(id);
    try {
      const history = await fetchConversationMessages(id);
      setMessages(history);
    } catch {
      setMessages([]);
    }
  };

  const handleNewChat = async () => {
    try {
      const newConv = await createConversation();
      setConversations((prev) => [newConv, ...prev]);
      setCurrentSessionId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      const updated = await updateConversationTitle(id, newTitle);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentSessionId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await sendChatMessage({
        question: content,
        conversation_id: currentSessionId,
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
      };

      setMessages((prev) => [...prev, aiMsg]);
      // Rafraîchir la liste pour obtenir d'éventuels titres générés automatiquement par l'IA
      loadConversations();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Désolé, une erreur s'est produite lors du traitement.",
          isError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-segula-dark flex items-center justify-center text-white text-sm">
        Chargement de SEGULA AI...
      </div>
    );
  }

  if (!token) return <AuthPage onLogin={login} onRegister={register} />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <Header user={user} onNewChat={handleNewChat} onLogout={logout} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          conversations={conversations}
          currentSessionId={currentSessionId}
          onSelectConversation={selectConversation}
          onRenameConversation={handleRename}
          onNewChat={handleNewChat}
        />

        <main className="flex-1 flex flex-col justify-between overflow-hidden relative bg-white">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center my-auto py-12">
                <SegulaLogo size="lg" />
                <h3 className="text-lg font-bold text-slate-800 mt-4">
                  Bonjour {user?.full_name}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Posez vos questions sur la réglementation et l'homologation des véhicules.
                </p>
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
            )}
          </div>

          <ChatInput onSendMessage={handleSendMessage} isLoading={isSending} />
        </main>
      </div>
    </div>
  );
};

export default App;