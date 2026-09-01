import React from 'react';
import type { AdminUser } from '../../types/admin.types';

interface UsersTableProps {
  users: AdminUser[];
}

export const UsersTable: React.FC<UsersTableProps> = ({ users }) => {
  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">Aucun utilisateur enregistré</p>
        <p className="text-xs text-slate-400 mt-1">Les comptes enregistrés apparaîtront ici.</p>
      </div>
    );
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4">Utilisateur</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Rôle</th>
              <th className="px-6 py-4 text-right">Inscrit le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                    {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span>
                    {u.full_name || <span className="text-slate-400 italic font-normal">Non renseigné</span>}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 font-normal">{u.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-xs text-slate-400 font-normal">
                  {formatDate(u.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};