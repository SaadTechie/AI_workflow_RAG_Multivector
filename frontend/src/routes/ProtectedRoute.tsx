import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
  requireRole?: 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireRole }) => {
  const { token, user, loading } = useAuthContext();

  if (loading) return null; // ou un spinner, le temps que useAuth vérifie /auth/me

  if (!token) return <Navigate to="/login" replace />;

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/chat" replace />; // connecté mais pas admin → retour au chat
  }

  return <Outlet />;
};