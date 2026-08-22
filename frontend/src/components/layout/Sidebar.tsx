import React, { useState } from 'react';
import type { Conversation } from '../../api/chat.api';

interface SidebarProps {
  conversations: Conversation[];
  currentSessionId: string | null;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentSessionId,
  onSelectConversation,
  onRenameConversation,
  onNewChat,
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
    <aside className="w-72 bg-white border-r border-slate-200/70 flex flex-col h-full shrink-0 hidden md:flex font-sans">
      
      {/* Bouton Nouveau Chat */}
      <div className="p-4 border-b border-slate-100">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-segula-blue text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-98"
        >
          <span className="text-base">+</span>
          <span>Nouvelle conversation</span>
        </button>
      </div>

      {/* Titre Historique */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Historique des sessions
        </h2>
      </div>

      {/* Liste Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {conversations.map((conv) => {
          const isActive = conv.id === currentSessionId;
          const isEditing = editingId === conv.id;

          return (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`group relative flex items-center justify-between p-3 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'bg-segula-cyan/10 text-segula-blue font-semibold border border-segula-cyan/20 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate w-full pr-6">
                <span className="text-sm opacity-70">💬</span>

                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleSaveRename(conv.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(conv.id)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-white border border-segula-cyan rounded px-2 py-0.5 text-xs text-slate-800 outline-none"
                  />
                ) : (
                  <span className="truncate">{conv.title || 'Discussion sans titre'}</span>
                )}
              </div>

              {/* Bouton d'édition (Crayon apparaissant au survol) */}
              {!isEditing && (
                <button
                  onClick={(e) => handleStartRename(conv, e)}
                  title="Renommer"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-segula-blue text-slate-400 rounded transition-opacity"
                >
                  ✏️
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info Documents */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="font-medium">Base documentaire</span>
        <span className="bg-emerald-500/10 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
          154 docs
        </span>
      </div>
    </aside>
  );
};