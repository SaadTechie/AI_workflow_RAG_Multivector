import { fetchWithAuth } from './httpClient';
import type { AdminUser, UploadJobStarted, UploadJobStatus, AdminDocument } from '../types/admin.types';

export const fetchAllUsers = async (): Promise<AdminUser[]> => {
  const response = await fetchWithAuth('/api/admin/users');
  if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs');
  return response.json();
};

// Pas de header Content-Type ici : le navigateur génère lui-même le
// multipart/form-data avec le bon "boundary". Le fixer manuellement casse l'upload.
export const startUpload = async (file: File): Promise<UploadJobStarted> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithAuth('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Échec de l'ingestion du document.");
  }

  return response.json();
};

export const getUploadStatus = async (jobId: string): Promise<UploadJobStatus> => {
  const response = await fetchWithAuth(`/api/upload/status/${jobId}`);
  if (!response.ok) throw new Error("Impossible de récupérer le statut de l'ingestion.");
  return response.json();
};

export const fetchDocuments = async (): Promise<AdminDocument[]> => {
  const response = await fetchWithAuth('/api/admin/documents');
  if (!response.ok) throw new Error('Erreur lors du chargement des documents');
  return response.json();
};

// Nouveau — suppression d'un document (nom encodé pour gérer espaces/accents)
export const deleteDocument = async (filename: string): Promise<{ status: string; chunks_removed?: number }> => {
  const response = await fetchWithAuth(`/api/admin/documents/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Échec de la suppression du document.');
  }
  return response.json();
};