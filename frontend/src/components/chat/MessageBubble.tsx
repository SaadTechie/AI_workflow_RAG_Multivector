import React, { useState, type JSX } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, SourceDocument } from '../../types/api.types';

// ============================================================================
// SOUS-COMPOSANT : Affichage des Sources
// ============================================================================
const SOURCE_CONFIG: Record<string, { label: string; icon: JSX.Element; badge: string }> = {
  text: {
    label: 'Texte',
    badge: 'bg-slate-100 text-slate-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-1.519-3.75L12 15.75m0 0l-1.481-1.5M12 15.75V21m-7.5-3.75h.008v.008H4.5v-.008zM6 18a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
  },
  table: {
    label: 'Tableau',
    badge: 'bg-violet-50 text-violet-600',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM3.75 9h16.5M3.75 15h16.5M9 3.75v16.5" />
      </svg>
    ),
  },
  image: {
    label: 'Image',
    badge: 'bg-amber-50 text-amber-600',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 8.25a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 8.25v8.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5V8.25zM15 8.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
};

const SourceViewer: React.FC<{ sources: SourceDocument[] }> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getFilename = (path?: string) => {
    if (!path) return 'Document inconnu';
    return path.split('/').pop()?.split('\\').pop() || 'Document';
  };

  const uniqueSources = sources.filter(
    (v, i, a) => a.findIndex((t) => (t.doc_id ? t.doc_id === v.doc_id : t.source === v.source)) === i
  );

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors group"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="border-b border-transparent group-hover:border-slate-300">
          {uniqueSources.length} source{uniqueSources.length > 1 ? 's' : ''} consultée{uniqueSources.length > 1 ? 's' : ''}
        </span>
      </button>

      {isOpen && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
          {uniqueSources.map((source, index) => {
            const cfg = SOURCE_CONFIG[source.type] || SOURCE_CONFIG.text;
            return (
              <div
                key={source.doc_id || index}
                className="p-3 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.badge}`}>
                    {cfg.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 truncate" title={source.source}>
                        {getFilename(source.source)}
                      </span>
                    </div>
                    {source.location && (
                      <span className="inline-block mt-0.5 text-[10px] font-medium text-slate-400">
                        {source.location}
                      </span>
                    )}
                    {source.content_preview && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {source.content_preview}
                      </p>
                    )}
                  </div>
                </div>

                {source.type === 'image' && source.image_url && (
                  <img
                    src={source.image_url}
                    alt="Aperçu extrait"
                    className="mt-2.5 max-h-28 w-full object-contain rounded-lg border border-slate-100 bg-slate-50"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// RENDU MARKDOWN — composants stylés à la main (pas de dépendance @tailwindcss/typography)
// ============================================================================
const markdownComponents = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-slate-900">{children}</strong>,
  ul: ({ children }: any) => <ul className="mb-3 last:mb-0 pl-5 space-y-1 list-disc marker:text-slate-300">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-3 last:mb-0 pl-5 space-y-1 list-decimal marker:text-slate-400 marker:font-medium">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }: any) => (
    <code className="bg-slate-100 text-segula-blue px-1.5 py-0.5 rounded-md text-[13px] font-mono">{children}</code>
  ),
  a: ({ children, href }: any) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-segula-blue underline underline-offset-2 hover:text-segula-cyan">
      {children}
    </a>
  ),
  h1: ({ children }: any) => <h3 className="font-bold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h3>,
  h2: ({ children }: any) => <h3 className="font-bold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h3>,
  h3: ({ children }: any) => <h4 className="font-semibold text-slate-900 mt-3 mb-1.5 first:mt-0">{children}</h4>,
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-slate-100">
      <table className="w-full text-[13px]">{children}</table>
    </div>
  ),
  th: ({ children }: any) => <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-100">{children}</th>,
  td: ({ children }: any) => <td className="px-3 py-2 border-b border-slate-50 text-slate-600">{children}</td>,
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // ---- Message utilisateur : bulle, aligné à droite ----
  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[85%] sm:max-w-[70%] bg-slate-900 text-white rounded-3xl rounded-br-lg px-5 py-3 shadow-sm">
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // ---- Message assistant : pas de bulle, pleine largeur, style "document" ----
  return (
    <div className="flex w-full mb-8 gap-3.5">
      <div className="w-7 h-7 rounded-full bg-segula-dark flex items-center justify-center shrink-0 shadow-sm mt-0.5">
        <svg className="w-3.5 h-3.5 text-segula-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div className={`min-w-0 flex-1 text-[15px] text-slate-700 ${message.isError ? 'text-red-500' : ''}`}>
        {message.isPending ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
          </div>
        ) : message.isError ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        )}

        {message.sources && message.sources.length > 0 && (
          <SourceViewer sources={message.sources} />
        )}
      </div>
    </div>
  );
};