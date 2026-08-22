// Événement personnalisé pour notifier l'application lors d'un 401
export const AUTH_EXPIRED_EVENT = 'auth:expired';

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token');

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Interception globale du 401 (Token expiré ou invalide)
  if (response.status === 401) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  return response;
};