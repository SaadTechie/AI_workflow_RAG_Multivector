import React from 'react';
import type { User } from '../../types/auth.types';
import { SegulaLogo } from '../ui/SegulaLogo';

interface HeaderProps {
  user: User | null;
  onNewChat: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onNewChat, onLogout }) => {
  return (
    <header className="h-16 bg-segula-dark text-white px-6 flex items-center justify-between shadow-sm border-b border-white/10 shrink-0">
      <div className="flex items-center space-x-3">
        <SegulaLogo size="md" />
        <div>
          <h1 className="text-sm font-bold tracking-tight">SEGULA Technologies</h1>
          <p className="text-[10px] text-segula-cyan font-medium">Assistant Homologation Automobile</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onNewChat}
          className="px-3.5 py-1.5 bg-segula-blue hover:bg-segula-cyan text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm flex items-center space-x-1.5 active:scale-95"
        >
          <span>+ Nouvelle session</span>
        </button>

        <div className="flex items-center space-x-3 pl-3 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold">{user?.full_name}</p>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase bg-segula-cyan/20 text-segula-cyan">
              {user?.role}
            </span>
          </div>

          <button
            onClick={onLogout}
            title="Se déconnecter"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </header>
  );
};