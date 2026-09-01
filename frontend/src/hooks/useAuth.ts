import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types/auth.types';
import { loginApi, fetchCurrentUser, registerApi } from '../api/auth.api';
import { AUTH_EXPIRED_EVENT } from '../api/httpClient';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Écouteur global pour déconnexion automatique sur 401
  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [logout]);

  // Initialisation de la session au démarrage
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const userData = await fetchCurrentUser(savedToken);
          setUser(userData);
          setToken(savedToken);
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [logout]);

  const login = async (email: string, password: string) => {
    const tokenData = await loginApi(email, password);
    localStorage.setItem('token', tokenData.access_token);
    setToken(tokenData.access_token);

    const userData = await fetchCurrentUser(tokenData.access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (email: string, password: string, fullName: string) => {
    await registerApi({ email, password, full_name: fullName });
    await login(email, password);
  };

  return { user, token, loading, login, register, logout };
};