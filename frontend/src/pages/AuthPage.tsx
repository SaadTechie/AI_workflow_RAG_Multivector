import React, { useState } from 'react';
import { SegulaLogo } from '../components/ui/SegulaLogo';

interface AuthPageProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string, name: string) => Promise<void>;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onRegister }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await onRegister(email, password, fullName);
      } else {
        await onLogin(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans antialiased relative overflow-hidden">
      {/* Halos de couleur en fond */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-segula-cyan/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-segula-blue/10 rounded-full blur-3xl" />

      <div className="w-full max-w-sm relative">
        {/* Logo + titre */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <SegulaLogo size="lg" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isRegister ? 'Créer votre compte' : 'Bon retour'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isRegister ? 'Rejoignez la plateforme SEGULA Homologation' : 'Connectez-vous à SEGULA Homologation'}
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <form autoComplete="off" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium text-center">
                {error}
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nom complet</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nom Prénom"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-segula-blue/30 focus:ring-4 focus:ring-segula-blue/10 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Adresse email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@segula.fr"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-segula-blue/30 focus:ring-4 focus:ring-segula-blue/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Mot de passe</label>
              <div className="relative w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-50 border border-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-segula-blue/30 focus:ring-4 focus:ring-segula-blue/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12c1.274 4.057 5.065 7 9.964 7 4.9 0 8.69-2.943 9.964-7-1.274-4.057-5.064-7-9.964-7-4.899 0-8.69 2.943-9.964 7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-segula-dark hover:bg-segula-blue text-white text-sm font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Chargement...
                </span>
              ) : isRegister ? "Créer mon compte" : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Bascule login/register */}
        <p className="text-center text-sm text-slate-400 mt-6">
          {isRegister ? 'Déjà un compte ?' : "Pas encore de compte ?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setShowPassword(false);
            }}
            className="text-segula-blue font-semibold hover:text-segula-dark transition-colors"
          >
            {isRegister ? 'Se connecter' : "S'inscrire"}
          </button>
        </p>
      </div>
    </div>
  );
};