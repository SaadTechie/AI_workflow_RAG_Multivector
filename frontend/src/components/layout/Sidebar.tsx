import React, { useState } from 'react';
import type { Conversation } from '../../api/chat.api';

interface SidebarProps {
  conversations: Conversation[];
  currentSessionId: string | null;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onNewChat: () => void;
  disableNewChat?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentSessionId,
  onSelectConversation,
  onRenameConversation,
  onNewChat,
  disableNewChat = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="w-72 bg-slate-50/60 border-r border-slate-100 flex flex-col h-full shrink-0 hidden md:flex font-sans">

      {/* Bouton Nouveau Chat */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          disabled={disableNewChat}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs transition-all ${
            disableNewChat
              ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm active:scale-[0.98]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Nouvelle conversation</span>
        </button>
      </div>

      {/* Titre Historique */}
      <div className="px-4 pt-3 pb-1.5">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Historique
        </h2>
      </div>

      {/* Liste Scrollable */}
      <div className="flex-1 overflow-y-auto px-2.5 space-y-0.5">
        {conversations.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8 px-2">
            Aucune conversation pour l'instant.
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === currentSessionId;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] cursor-pointer transition-colors duration-100 ${
                  isActive
                    ? 'bg-white text-slate-900 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-white/70'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate w-full pr-6">
                  <svg
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-segula-blue' : 'text-slate-400'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>

                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveRename(conv.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(conv.id)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white border border-segula-blue/40 rounded-lg px-2 py-0.5 text-[13px] text-slate-800 outline-none focus:ring-2 focus:ring-segula-blue/20"
                    />
                  ) : (
                    <span className="truncate">{conv.title || 'Discussion sans titre'}</span>
                  )}
                </div>

                {!isEditing && (
                  <button
                    onClick={(e) => handleStartRename(conv, e)}
                    title="Renommer"
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-opacity"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Documents */}
      <div className="p-3 mx-2 mb-2 rounded-xl bg-white border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="font-medium">Base documentaire</span>
        <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full text-[10px]">
          192 docs
        </span>
      </div>
    </aside>
  );
};