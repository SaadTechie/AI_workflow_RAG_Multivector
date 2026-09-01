import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllUsers } from '../../api/admin.api';
import { UsersTable } from '../../components/admin/UsersTable';
import { Header } from '../../components/layout/Header';
import { useAuthContext } from '../../context/AuthContext';
import type { AdminUser } from '../../types/admin.types';

export const AdminUsersPage: React.FC = () => {
  const { user, logout } = useAuthContext();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header user={user} onLogout={logout} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Gestion des utilisateurs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
            </p>
          </div>

          <Link
            to="/admin/upload"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Ingérer un document</span>
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-300 border-t-slate-900" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && <UsersTable users={users} />}
      </main>
    </div>
  );
};