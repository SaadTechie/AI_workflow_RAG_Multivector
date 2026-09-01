import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { SegulaLogo } from '../components/ui/SegulaLogo';
import {
  type Conversation,
  fetchConversations,
  createConversation,
  updateConversationTitle,
  fetchConversationMessages,
  sendChatMessage,
} from '../api/chat.api';
import type { Message } from '../types/api.types';

export const ChatPage: React.FC = () => {
  const { user, logout } = useAuthContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Initialisation : charge la liste et sélectionne la première discussion
  useEffect(() => {
    const initChat = async () => {
      try {
        const list = await fetchConversations();
        setConversations(list);
        if (list.length > 0) {
          selectConversation(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    initChat();
  }, []);

  // Uniquement rafraîchir la liste latérale sans toucher au chat actif
  const refreshSidebar = async () => {
    try {
      const list = await fetchConversations();
      setConversations(list);
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

  const handleNewChat = () => {
    // Permet de réinitialiser si on n'a pas de session OU si l'écran est vide
    if (currentSessionId === null && messages.length === 0) return;
    setCurrentSessionId(null);
    setMessages([]);
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
    let activeId = currentSessionId;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };

    const pendingId = crypto.randomUUID();
    const pendingMsg: Message = {
      id: pendingId,
      role: 'assistant',
      content: '',
      isPending: true,
    };

    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setIsSending(true);

    try {
      if (!activeId) {
        const newConv = await createConversation();
        activeId = newConv.id;
        setCurrentSessionId(activeId);
      }

      const res = await sendChatMessage({
        question: content,
        conversation_id: activeId,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { id: pendingId, role: 'assistant', content: res.answer, sources: res.sources }
            : m
        )
      );

      // Rafraîchit uniquement la liste dans la Sidebar sans perturber le chat courant
      await refreshSidebar();
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { id: pendingId, role: 'assistant', content: "Désolé, une erreur s'est produite lors du traitement.", isError: true }
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <Header user={user} onLogout={logout} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          conversations={conversations}
          currentSessionId={currentSessionId}
          onSelectConversation={selectConversation}
          onRenameConversation={handleRename}
          onNewChat={handleNewChat}
          disableNewChat={currentSessionId === null && messages.length === 0}
        />

        <main className="flex-1 flex flex-col justify-between overflow-hidden relative bg-white">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center my-auto py-12">
                <SegulaLogo size="lg" />
                <h3 className="text-xl font-bold text-slate-900 mt-5 tracking-tight">
                  Bonjour {user?.full_name?.split(' ')[0]}
                </h3>
                <p className="text-sm text-slate-400 max-w-sm mt-1.5">
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

export default ChatPage;