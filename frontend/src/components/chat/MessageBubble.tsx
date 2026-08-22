import React, { useState } from 'react';
import type { Message, SourceDocument } from '../../types/api.types';

// ============================================================================
// SOUS-COMPOSANT : Affichage des Sources (Pliable/Dépliable)
// ============================================================================
const SourceViewer: React.FC<{ sources: SourceDocument[] }> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getFilename = (path?: string) => {
    if (!path) return 'Document inconnu';
    return path.split('/').pop()?.split('\\').pop() || 'Document';
  };

  const getSourceIcon = (type?: 'text' | 'table' | 'image') => {
    switch (type) {
      case 'table': return '📊';
      case 'image': return '🖼️';
      default: return '📄';
    }
  };

  // Déduplication basée sur doc_id (ou fallback sur la combinaison source + preview)
  const uniqueSources = sources.filter((v, i, a) => 
    a.findIndex(t => (t.doc_id ? t.doc_id === v.doc_id : t.source === v.source)) === i
  );

  return (
    <div className="mt-4 pt-3 border-t border-gray-200/60">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-xs font-semibold text-segula-blue hover:text-segula-cyan transition-colors"
      >
        <span>{isOpen ? '▼' : '▶'}</span>
        <span>{uniqueSources.length} source{uniqueSources.length > 1 ? 's' : ''} consultée{uniqueSources.length > 1 ? 's' : ''}</span>
      </button>

      {isOpen && (
        <div className="mt-3 grid grid-cols-1 gap-2">
          {uniqueSources.map((source, index) => (
            <div key={source.doc_id || index} className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-xs text-gray-600">
              <div className="flex items-center space-x-3">
                <span className="text-base" title={`Type: ${source.type || 'text'}`}>
                  {getSourceIcon(source.type)}
                </span>
                <div className="flex flex-col truncate flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-segula-dark truncate" title={source.source}>
                      {getFilename(source.source)}
                    </span>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {/* Badge de Localisation (Page / Slide / Paragraphe) */}
                      {source.location && (
                        <span className="bg-segula-blue/10 text-segula-blue font-mono font-semibold px-1.5 py-0.5 rounded text-[10px]">
                          {source.location}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 capitalize px-1 bg-gray-50 rounded border">
                        {source.type}
                      </span>
                    </div>
                  </div>
                  {source.content_preview && (
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 font-mono">
                      {source.content_preview}
                    </p>
                  )}
                </div>
              </div>

              {/* Affichage d'image si le type est 'image' et qu'une URL est fournie */}
              {source.type === 'image' && source.image_url && (
                <div className="mt-2 pt-2 border-t border-gray-50">
                  <img 
                    src={source.image_url} 
                    alt="Aperçu extrait" 
                    className="max-h-32 rounded border border-gray-200 object-contain bg-gray-50"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL : Bulle de message
// ============================================================================
interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      
      {/* Avatar IA */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-segula-blue flex items-center justify-center mr-3 mt-1 shrink-0 shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      )}

      {/* Conteneur de la bulle */}
      <div 
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 ${
          isUser 
            ? 'bg-segula-blue text-white rounded-br-sm shadow-md' 
            : 'bg-segula-gray text-segula-text rounded-bl-sm border border-gray-100 shadow-sm'
        } ${message.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
      >
        {/* Texte du message */}
        <div className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
          {message.content}
        </div>

        {/* Affichage des sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceViewer sources={message.sources} />
        )}
      </div>

      {/* Avatar Utilisateur */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-segula-cyan flex items-center justify-center ml-3 mt-1 shrink-0 shadow-sm">
          <span className="text-white text-xs font-bold font-sans">Vous</span>
        </div>
      )}
      
    </div>
  );
};