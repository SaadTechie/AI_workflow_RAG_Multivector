import React, { useState } from 'react';
import type { AdminDocument } from '../../types/admin.types';

interface DocumentsTableProps {
  documents: AdminDocument[];
  onDelete: (filename: string) => Promise<void>;
}

export const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, onDelete }) => {
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const handleDeleteClick = async (filename: string) => {
    const confirmed = window.confirm(
      `Supprimer définitivement "${filename}" de la base documentaire ?\nCette action est irréversible.`
    );
    if (!confirmed) return;

    setDeletingFile(filename);
    try {
      await onDelete(filename);
    } finally {
      setDeletingFile(null);
    }
  };

  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">
        Aucun document indexé pour le moment.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 font-semibold">Document</th>
            <th className="px-4 py-3 font-semibold text-center">Textes</th>
            <th className="px-4 py-3 font-semibold text-center">Tableaux</th>
            <th className="px-4 py-3 font-semibold text-center">Images</th>
            <th className="px-4 py-3 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <tr key={doc.filename} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-xs" title={doc.filename}>
                {doc.filename}
              </td>
              <td className="px-4 py-3 text-center text-slate-500">{doc.counts.text}</td>
              <td className="px-4 py-3 text-center text-slate-500">{doc.counts.table}</td>
              <td className="px-4 py-3 text-center text-slate-500">{doc.counts.image}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDeleteClick(doc.filename)}
                  disabled={deletingFile === doc.filename}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingFile === doc.filename ? 'Suppression...' : 'Supprimer'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};