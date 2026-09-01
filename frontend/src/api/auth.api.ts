import type { User, TokenResponse, RegisterPayload } from '../types/auth.types';

// 1. Connexion OAuth2 (Form-Data) -> Renvoie { access_token, token_type }
export const loginApi = async (email: string, password: string): Promise<TokenResponse> => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Email ou mot de passe incorrect.');
  }

  return response.json();
};

// 2. Récupération du profil utilisateur (GET /auth/me)
export const fetchCurrentUser = async (token: string): Promise<User> => {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Impossible de récupérer le profil utilisateur.');
  }

  return response.json();
};

// 3. Inscription utilisateur
export const registerApi = async (payload: RegisterPayload): Promise<User> => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Échec lors de l'inscription.");
  }

  return response.json();
};