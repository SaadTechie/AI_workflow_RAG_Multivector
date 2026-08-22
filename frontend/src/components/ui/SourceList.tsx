import React from 'react';
import type { SourceDocument } from '../../types/api.types';

interface SourceListProps {
  sources: SourceDocument[];
}

export const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  const getFilename = (path: string) => path.split('/').pop()?.split('\\').pop() || 'Document';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm mt-3 text-xs">
      <div className="font-bold text-segula-dark uppercase tracking-wider mb-2 text-[10px]">
        Extraits documentaires ({sources.length})
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {sources.map((src) => (
          <div key={src.doc_id || src.source} className="p-2 bg-segula-gray/60 rounded-lg border border-gray-100">
            <div className="flex items-center justify-between mb-1 font-semibold text-segula-blue">
              <span className="truncate max-w-50" title={src.source}>
                {getFilename(src.source)}
              </span>
              <span className="bg-segula-cyan/10 text-segula-cyan px-1.5 py-0.5 rounded text-[10px] font-mono capitalize">
                {src.type}
              </span>
            </div>

            {src.content_preview && (
              <p className="text-gray-600 line-clamp-2 font-mono text-[11px] leading-relaxed">
                {src.content_preview}
              </p>
            )}

            {src.type === 'image' && src.image_url && (
              <div className="mt-2">
                <img 
                  src={src.image_url} 
                  alt="Aperçu source" 
                  className="max-h-24 rounded border border-gray-200 object-cover" 
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};