import React, { useState } from 'react';
import { X, Shield, UserCheck, Key, Lock, Check, Terminal, Copy } from 'lucide-react';
import { AuthMe } from '../types';
import { setSimulatedUser, setBasicAuth } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  auth: AuthMe | null;
  onRefreshAuth: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  auth,
  onRefreshAuth,
}) => {
  const [customUser, setCustomUser] = useState('');
  const [basicUser, setBasicUser] = useState('');
  const [basicPass, setBasicPass] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSelectUser = async (user: string) => {
    setSimulatedUser(user);
    setBasicAuth('');
    await onRefreshAuth();
  };

  const handleApplyBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!basicUser) return;
    const token = btoa(`${basicUser}:${basicPass}`);
    setBasicAuth(token);
    setSimulatedUser('');
    await onRefreshAuth();
  };

  const handleResetToDefault = async () => {
    setSimulatedUser('');
    setBasicAuth('');
    await onRefreshAuth();
  };

  const nginxSnippet = `# /etc/nginx/sites-available/masa.conf
server {
    listen 80;
    server_name masa.tuodominio.it;

    # 1. Protezione con HTTP Basic Auth (.htpasswd)
    auth_basic "Accesso Riservato Masaniello";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        # 2. Inoltro porta Express (es. porta dinamica 4000 o 3000)
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # 3. Trasmette l'utente autenticato al backend Node.js
        proxy_set_header X-Remote-User $remote_user;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`;

  const copyNginxConfig = () => {
    navigator.clipboard.writeText(nginxSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAdmin = auth?.isAdmin ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-900/30 border border-red-500/40 text-red-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-sans">
                Autenticazione Web, Nginx &amp; Permessi
              </h3>
              <p className="text-xs text-zinc-400 font-mono">Supporto HTTP Basic Auth, .htpasswd e x-remote-user</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-zinc-300 text-xs">
          {/* Current Auth Status Card */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-2 font-semibold">
              SESSIONE CORRENTE RILEVATA DA /api/auth/me
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-zinc-500 block text-[10px]">Utente:</span>
                <strong className="text-white text-sm font-mono">{auth?.username}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Ruolo:</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold ${
                    isAdmin ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {auth?.role}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Metodo Rilevato:</span>
                <span className="font-mono text-zinc-300 text-[11px] truncate block" title={auth?.authMethod}>
                  {auth?.authMethod}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Porta Backend:</span>
                <span className="font-mono text-red-400 text-[11px] font-bold">
                  {auth?.systemdPort || 3000}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-800">
              <span className="text-zinc-500 block text-[10px] mb-1">Permessi Attivi:</span>
              <div className="flex flex-wrap gap-1">
                {auth?.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Test & Switch User Identities */}
          <div className="space-y-3">
            <div className="font-semibold text-white flex items-center gap-1.5 font-mono">
              <UserCheck className="w-4 h-4 text-red-400" />
              <span>Simula Utente &amp; Ruoli per Collaudo</span>
            </div>
            <p className="text-zinc-400 text-xs">
              Sul VPS Linux di produzione l&apos;utente viene iniettato automaticamente da Nginx tramite l&apos;header <code className="text-red-400 font-mono">x-remote-user</code>. Qui puoi testare il comportamento sia come amministratore che come operatore standard:
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSelectUser('fire')}
                className={`px-3 py-2 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                  auth?.username === 'fire'
                    ? 'bg-red-600 text-white border-red-500 shadow-sm'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-red-200" />
                <span>fire (Admin Completo)</span>
              </button>

              <button
                onClick={() => handleSelectUser('operatore')}
                className={`px-3 py-2 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                  auth?.username === 'operatore'
                    ? 'bg-zinc-700 text-white border-zinc-600 shadow-sm'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-zinc-300" />
                <span>operatore (User standard)</span>
              </button>

              <button
                onClick={handleResetToDefault}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-mono transition-colors"
              >
                Ripristina Default di Sistema
              </button>
            </div>
          </div>

          {/* Test HTTP Basic Auth Generator */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 font-mono">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Test Header Authorization: Basic (Simulatore .htpasswd)</span>
            </div>
            <form onSubmit={handleApplyBasic} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Username (es. fire)"
                value={basicUser}
                onChange={(e) => setBasicUser(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-red-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={basicPass}
                onChange={(e) => setBasicPass(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors"
              >
                Invia Header Basic Auth
              </button>
            </form>
          </div>

          {/* Nginx & .htpasswd Documentation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white flex items-center gap-1.5 font-mono">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span>Configurazione Nginx consigliata su VPS</span>
              </div>
              <button
                onClick={copyNginxConfig}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white font-mono"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>
            <pre className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
              {nginxSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-semibold transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
