import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { startUpload, getUploadStatus, fetchDocuments, deleteDocument } from '../../api/admin.api';
import { UploadDropzone } from '../../components/admin/UploadDropzone';
import { Header } from '../../components/layout/Header';
import { DocumentsTable } from '../../components/admin/DocumentsTable';
import { useAuthContext } from '../../context/AuthContext';
import type { UploadResult, AdminDocument } from '../../types/admin.types';

export const AdminUploadPage: React.FC = () => {
  const { user, logout } = useAuthContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    }
  };

  // Chargement initial de la liste
  useEffect(() => {
    loadDocuments();
  }, []);

  // Nettoyage automatique si le composant est démonté pendant un polling en cours
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    stopPolling();
    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const { job_id } = await startUpload(selectedFile);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await getUploadStatus(job_id);

          if (status.status === "done") {
            stopPolling();
            setResult(status.result!);
            setIsUploading(false);
            setSelectedFile(null);
            loadDocuments();   // 🟢 rafraîchit la liste après une ingestion réussie
          } else if (status.status === "error") {
            stopPolling();
            setError(status.error || "Erreur lors de l'ingestion.");
            setIsUploading(false);
          }
        } catch (pollErr: any) {
          stopPolling();
          setError(pollErr.message);
          setIsUploading(false);
        }
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue pendant l'ingestion.");
      setIsUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      await deleteDocument(filename);
      await loadDocuments();   // 🟢 rafraîchit la liste après suppression
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header user={user} onLogout={logout} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Ingestion de documents
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ajoutez ou retirez un support technique (PDF ou PowerPoint) de la base documentaire.
            </p>
          </div>

          <Link
            to="/chat"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <svg className="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Retour au chat</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <UploadDropzone onFileSelected={setSelectedFile} disabled={isUploading} />

          {selectedFile && !result && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-slate-200/80 flex items-center justify-center text-slate-700 shrink-0 font-bold text-xs uppercase">
                  {selectedFile.name.split('.').pop()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Le bouton Annuler disparaît pendant l'ingestion, au lieu d'être juste grisé */}
                {!isUploading && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Annuler
                  </button>
                )}
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-400 border-t-white" />
                      <span>Ingestion...</span>
                    </>
                  ) : (
                    <span>Lancer l'ingestion</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 flex items-start gap-3">
              <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>L'extraction et le résumé des documents peuvent prendre plusieurs minutes. Merci de patienter pendant l'indexation.</span>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {result?.status === 'success' && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-emerald-900 mb-0.5">"{result.filename}" indexé avec succès</p>
                {result.counts && (
                  <p className="text-xs text-emerald-700">
                    {result.counts.texts} textes · {result.counts.tables} tableaux · {result.counts.images} images ({result.counts.total_indexed} éléments au total)
                  </p>
                )}
              </div>
            </div>
          )}

          {result?.status === 'skipped' && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-sm flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-amber-900 mb-0.5">"{result.filename}" déjà indexé</p>
                <p className="text-xs text-amber-700">{result.reason}</p>
              </div>
            </div>
          )}
        </div>

        {/* 🟢 Liste des documents indexés, avec suppression */}
        <div className="mt-10">
          <h2 className="text-sm font-bold text-slate-700 mb-3">
            Documents indexés ({documents.length})
          </h2>
          <DocumentsTable documents={documents} onDelete={handleDelete} />
        </div>
      </main>
    </div>
  );
};