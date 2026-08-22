import React, { useState, type KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ajustement automatique de la hauteur du champ de texte
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
      // Réinitialiser la hauteur après l'envoi
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="relative flex items-end bg-white rounded-2xl shadow-lg border border-gray-100 transition-all focus-within:shadow-xl focus-within:border-segula-cyan/30">
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez votre question sur l'homologation..."
          disabled={isLoading}
          className="w-full max-h-37.5 py-4 pl-5 pr-14 bg-transparent border-none resize-none outline-none text-segula-text placeholder-gray-400 font-sans text-[15px] leading-relaxed disabled:opacity-50 overflow-y-auto"
          rows={1}
        />

        {/* Bouton d'envoi intégré à la barre de saisie */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className={`absolute right-3 bottom-3 p-2 rounded-xl flex items-center justify-center transition-all duration-200 
            ${
              message.trim() && !isLoading
                ? 'bg-segula-blue text-white shadow-md hover:bg-segula-cyan hover:-translate-y-0.5'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
          aria-label="Envoyer le message"
        >
          {/* Icône SVG d'envoi (type PaperAirplane) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 ml-0.5"
          >
            <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
          </svg>
        </button>
      </div>
      
      {/* Petit texte informatif sous la barre */}
      <div className="text-center mt-2">
        <span className="text-xs text-gray-400 font-sans">
          L'IA peut faire des erreurs. Vérifiez toujours les informations critiques avec les documents officiels.
        </span>
      </div>
    </div>
  );
};