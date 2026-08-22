import React, { useState } from 'react';

interface AuthPageProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string, name: string) => Promise<void>;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onRegister }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-linear-to-br from-segula-dark via-segula-blue to-segula-dark flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 relative">
        
        {/* Banner Header Segula */}
        <div className="bg-segula-dark p-8 text-center text-white relative">
          <div className="w-12 h-12 bg-segula-cyan rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl shadow-lg mb-3">
            S
          </div>
          <h2 className="text-xl font-bold tracking-wide">SEGULA Technologies</h2>
          <p className="text-xs text-segula-cyan/80 mt-1 font-medium">
            Plateforme RAG Homologation
          </p>
        </div>

        {/* Formulaire */}
        <form autoComplete="off" onSubmit={handleSubmit} className="p-8 space-y-4">
          <h3 className="text-lg font-bold text-segula-dark text-center mb-2">
            {isRegister ? 'Créer un compte' : 'Espace Connexion'}
          </h3>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nom complet</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ex. Nom Prenom"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-segula-cyan focus:ring-2 focus:ring-segula-cyan/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Adresse Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@segula.fr"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-segula-cyan focus:ring-2 focus:ring-segula-cyan/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-segula-cyan focus:ring-2 focus:ring-segula-cyan/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-segula-blue hover:bg-segula-cyan text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 mt-2"
          >
            {loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se connecter'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-segula-blue hover:text-segula-cyan font-medium transition-colors"
            >
              {isRegister
                ? 'Déjà un compte ? Se connecter'
                : "Pas encore de compte ? S'inscrire"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};