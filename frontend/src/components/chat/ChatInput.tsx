import React, { useState, type KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    onSendMessage(message);
    setMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2">
      <div className="relative flex items-end bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-200 focus-within:shadow-md focus-within:border-slate-300">

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez votre question sur l'homologation..."
          disabled={isLoading}
          className="w-full max-h-37.5 py-3.5 pl-5 pr-14 bg-transparent border-none resize-none outline-none text-slate-800 placeholder-slate-400 font-sans text-[15px] leading-relaxed disabled:opacity-50 overflow-y-auto"
          rows={1}
        />

        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className={`absolute right-2.5 bottom-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            message.trim() && !isLoading
              ? 'bg-slate-900 text-white hover:bg-segula-blue active:scale-90'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
          aria-label="Envoyer le message"
        >
          {isLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-center mt-2.5 text-[11px] text-slate-400">
        SEGULA AI peut faire des erreurs. Vérifiez les informations critiques avec les documents officiels.
      </p>
    </div>
  );
};