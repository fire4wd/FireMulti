import React from 'react';
import { Shield, Database, Server, Plus, Settings, RefreshCw, UserCheck, Layers, Trophy, Flame, ChefHat } from 'lucide-react';
import { AuthMe, SystemStatus } from '../types';
import metadata from '../../metadata.json';

interface HeaderProps {
  auth: AuthMe | null;
  system: SystemStatus | null;
  activeAppTab: 'masa' | 'bbeater' | 'anda' | 'hattrick';
  onChangeAppTab: (tab: 'masa' | 'bbeater' | 'anda' | 'hattrick') => void;
  onOpenNewMasa: () => void;
  onOpenAuthModal: () => void;
  onOpenSystemModal: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  auth,
  system,
  activeAppTab,
  onChangeAppTab,
  onOpenNewMasa,
  onOpenAuthModal,
  onOpenSystemModal,
  onRefresh,
  isRefreshing = false,
}) => {
  const isAdmin = auth?.isAdmin ?? false;
  const initial = (auth?.username || 'F').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Brand & System Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 font-black text-lg tracking-tighter shadow-sm">
                <span className="text-red-500">FM</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-red-500">
                    Fire<span className="text-white font-medium">Multip</span>
                  </h1>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    v{system?.version || (metadata as any).version || '1.3.1'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono flex items-center gap-2">
                  <span>PORT: {system?.port || 3000}</span>
                  <span>•</span>
                  <span className="text-zinc-400 truncate max-w-[160px]" title={system?.dbPath}>
                    SQLITE: {system?.dbSizeKB || 0} KB
                  </span>
                </p>
              </div>
            </div>

            {/* Mobile Tab switch */}
            <div className="flex sm:hidden items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-xs overflow-x-auto">
              <button
                onClick={() => onChangeAppTab('masa')}
                className={`px-2 py-1 rounded-lg ${
                  activeAppTab === 'masa' ? 'bg-red-600 text-white font-bold' : 'text-zinc-400'
                }`}
              >
                Masa
              </button>
              <button
                onClick={() => onChangeAppTab('bbeater')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 ${
                  activeAppTab === 'bbeater' ? 'bg-red-600 text-white font-bold' : 'text-zinc-400'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>BB</span>
              </button>
              <button
                onClick={() => onChangeAppTab('anda')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 ${
                  activeAppTab === 'anda' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400'
                }`}
              >
                <ChefHat className="w-3 h-3 text-amber-400" />
                <span>AnDa</span>
              </button>
              <button
                onClick={() => onChangeAppTab('hattrick')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 ${
                  activeAppTab === 'hattrick' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400'
                }`}
              >
                <span>⚽ HT</span>
              </button>
            </div>
          </div>

          {/* Center Main App Tabs (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-xs shadow-inner">
            <button
              onClick={() => onChangeAppTab('masa')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeAppTab === 'masa'
                  ? 'bg-red-600 text-white font-bold shadow-md shadow-red-950/50'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Masaniello</span>
              {system?.activeMasa !== undefined && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-950 text-zinc-300">
                  {system.activeMasa}
                </span>
              )}
            </button>

            <button
              onClick={() => onChangeAppTab('bbeater')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeAppTab === 'bbeater'
                  ? 'bg-red-600 text-white font-bold shadow-md shadow-red-950/50'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>BuzzerBeater</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-950 text-red-300 border border-red-500/30">
                PRO
              </span>
            </button>

            <button
              onClick={() => onChangeAppTab('anda')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeAppTab === 'anda'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-950/50'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ChefHat className={`w-3.5 h-3.5 ${activeAppTab === 'anda' ? 'text-zinc-950' : 'text-amber-400'}`} />
              <span>AnDa</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                activeAppTab === 'anda' ? 'bg-zinc-950 text-amber-400 font-bold' : 'bg-zinc-950 text-zinc-400'
              }`}>
                {system?.totalRecipes !== undefined && system.totalRecipes > 0 ? system.totalRecipes : 'RECIPES'}
              </span>
            </button>

            <button
              onClick={() => onChangeAppTab('hattrick')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeAppTab === 'hattrick'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span className="text-xs">⚽</span>
              <span>Hattrick</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                activeAppTab === 'hattrick' ? 'bg-zinc-950 text-emerald-400 font-bold' : 'bg-zinc-950 text-zinc-400'
              }`}>
                {system?.totalHtPlayers !== undefined && system.totalHtPlayers > 0 ? system.totalHtPlayers : 'HT'}
              </span>
            </button>
          </div>

          {/* Actions & User Identity */}
          <div className="flex items-center justify-end gap-2 sm:gap-2.5">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800 disabled:opacity-50"
              title="Ricarica dati"
              aria-label="Ricarica dati"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-red-400' : ''}`} />
            </button>

            {/* System Info Button */}
            <button
              onClick={onOpenSystemModal}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
              title="Dettagli Sistema, Systemd e Nginx .htpasswd"
              aria-label="Dettagli Sistema"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Auth Pill Button */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all text-xs"
              title="Gestione Utente & Autenticazione Nginx"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-tight">Auth</p>
                <p className="text-xs font-semibold text-zinc-200">{auth?.username || 'fire'}</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-red-900/30 border border-red-500/50 flex items-center justify-center text-red-500 font-bold font-mono text-xs">
                {initial}
              </div>
            </button>

            {/* Nuovo Masaniello Button (if in masa tab) */}
            {activeAppTab === 'masa' && (
              <button
                onClick={onOpenNewMasa}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-md shadow-red-950/40 transition-all active:scale-95 font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuovo Masa</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
