import React from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../../types/auth.types';
import { SegulaLogo } from '../ui/SegulaLogo';

interface HeaderProps {
  user: User | null;
  onNewChat?: () => void;
  onLogout: () => void;
}

const getInitials = (name?: string | null) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md text-slate-800 px-4 sm:px-6 flex items-center justify-between border-b border-slate-100 shrink-0 z-10">

      {/* Bloc gauche : logo + nom */}
      <div className="flex items-center gap-3">
        <SegulaLogo size="md" />
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
            SEGULA Technologies
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Assistant Homologation Automobile</p>
        </div>
      </div>

      {/* Bloc droit : navigation + actions + profil */}
      <div className="flex items-center gap-2 sm:gap-3">

        {user?.role === 'admin' && (
          <Link
            to="/admin/users"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
            Administration
          </Link>
        )}
        
        

        <div className="flex items-center gap-2 pl-2 sm:pl-3 ml-1 border-l border-slate-100">
          <div
            className="w-8 h-8 rounded-full bg-segula-cyan/15 text-segula-blue flex items-center justify-center text-[11px] font-bold shrink-0"
            title={user?.full_name || ''}
          >
            {getInitials(user?.full_name)}
          </div>

          <button
            onClick={onLogout}
            title="Se déconnecter"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};