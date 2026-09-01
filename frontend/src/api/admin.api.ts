import { fetchWithAuth } from './httpClient';
import type { AdminUser, UploadResult } from '../types/admin.types';

export const fetchAllUsers = async (): Promise<AdminUser[]> => {
  const response = await fetchWithAuth('/api/admin/users');
  if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs');
  return response.json();
};

// Pas de header Content-Type ici : le navigateur génère lui-même le
// multipart/form-data avec le bon "boundary". Le fixer manuellement casse l'upload.
export const uploadDocument = async (file: File): Promise<UploadResult> => {
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