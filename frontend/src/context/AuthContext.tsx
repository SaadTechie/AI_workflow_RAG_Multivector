import React, { createContext, useContext } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';

type AuthContextType = ReturnType<typeof useAuthHook>;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthHook();  // 🟢 appelé UNE SEULE FOIS pour toute l'app
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext doit être utilisé à l\'intérieur de <AuthProvider>');
  return ctx;
};