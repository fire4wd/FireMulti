import React from 'react';
import { Wallet, TrendingUp, CheckCircle2, AlertCircle, Layers, Database } from 'lucide-react';
import { MasaStats, SystemStatus } from '../types';

interface StatsBannerProps {
  masas: MasaStats[];
  system: SystemStatus | null;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ masas, system }) => {
  const totaleCapitale = masas.reduce((acc, m) => acc + (m.capitale || 0), 0);
  const totaleCassa = masas.reduce((acc, m) => acc + (m.cassaAttuale || 0), 0);
  const utileComplessivo = Math.round((totaleCassa - totaleCapitale) * 100) / 100;
  const roiComplessivo = totaleCapitale > 0 ? Math.round((utileComplessivo / totaleCapitale) * 10000) / 100 : 0;

  const totalEventi = masas.reduce((acc, m) => acc + (m.n_eventi || 0), 0);
  const vintiTotali = masas.reduce((acc, m) => acc + (m.vinti || 0), 0);
  const persiTotali = masas.reduce((acc, m) => acc + (m.persi || 0), 0);
  const attiviCount = masas.filter((m) => m.attivo === 1).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
      {/* Bento Tile 1: Server & Port Status (col-span-3) */}
      <div className="md:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Server Status</span>
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]"></div>
        </div>
        <div className="my-2.5">
          <p className="text-4xl font-mono font-black text-white tracking-tight">{system?.port || 3000}</p>
          <p className="text-xs text-zinc-400 font-mono mt-1">Active TCP Port</p>
        </div>
        <div className="pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>PID: <strong className="text-zinc-200">{system?.pid || 12844}</strong></span>
          <span>Up: <strong className="text-zinc-200">{Math.floor((system?.uptimeSeconds || 0) / 60)}m</strong></span>
        </div>
      </div>

      {/* Bento Tile 2: SQLite Filesystem Instance (col-span-6) */}
      <div className="md:col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              SQLite Filesystem Instance
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-zinc-950 text-zinc-300 border border-zinc-800 font-semibold">
              better-sqlite3
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between my-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400 font-mono uppercase">Database Path</p>
              <p className="text-sm bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 font-mono text-zinc-200 truncate" title={system?.dbPath}>
                {system?.dbPath || './data/app.db'}
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="text-3xl font-bold font-mono text-white">{system?.dbSizeKB || 0} KB</p>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-mono mt-0.5">Database Size</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3.5 border-t border-zinc-800/80 font-mono">
          <div>
            <p className="text-lg font-bold text-white">{system?.totalMasa || masas.length}</p>
            <p className="text-xs text-zinc-400 uppercase">Piani Masa</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{system?.totalEventi || totalEventi}</p>
            <p className="text-xs text-zinc-400 uppercase">Totale Eventi</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-400">Stable</p>
            <p className="text-xs text-zinc-400 uppercase">Integrità WAL</p>
          </div>
        </div>
      </div>

      {/* Bento Tile 3: Financial Cassa & Capital Instance (col-span-3) */}
      <div className="md:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Cassa &amp; Capitale</span>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
              utileComplessivo >= 0 ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950/70 text-rose-400 border border-rose-500/40'
            }`}
          >
            ROI {roiComplessivo >= 0 ? `+${roiComplessivo}%` : `${roiComplessivo}%`}
          </span>
        </div>

        <div className="my-2.5">
          <p className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight">
            €{totaleCassa.toFixed(2)}
          </p>
          <p className="text-sm text-zinc-400 font-mono mt-1">
            su <span className="text-zinc-200 font-bold">€{totaleCapitale.toFixed(2)}</span> iniziali
          </p>
        </div>

        <div className="pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">Resa Netta:</span>
          <span className={`text-sm font-bold ${utileComplessivo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {utileComplessivo >= 0 ? `+€${utileComplessivo.toFixed(2)}` : `-€${Math.abs(utileComplessivo).toFixed(2)}`}
          </span>
        </div>
      </div>
    </div>
  );
};
