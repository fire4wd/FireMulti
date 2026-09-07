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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
      {/* Bento Tile 1: Server & Port Status (col-span-3) */}
      <div className="md:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Server Status</span>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
        </div>
        <div className="my-2">
          <p className="text-3xl font-mono font-bold text-white tracking-tight">{system?.port || 3000}</p>
          <p className="text-xs text-zinc-500 font-mono">Active TCP Port</p>
        </div>
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>PID: <strong className="text-zinc-200">{system?.pid || 12844}</strong></span>
          <span>Up: <strong className="text-zinc-200">{Math.floor((system?.uptimeSeconds || 0) / 60)}m</strong></span>
        </div>
      </div>

      {/* Bento Tile 2: SQLite Filesystem Instance (col-span-6) */}
      <div className="md:col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
              SQLite Filesystem Instance
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
              better-sqlite3
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between my-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-zinc-500 font-mono uppercase">Database Path</p>
              <p className="text-xs bg-zinc-950 p-2 rounded-lg border border-zinc-800 font-mono text-zinc-300 truncate" title={system?.dbPath}>
                {system?.dbPath || './data/app.db'}
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="text-2xl font-semibold font-mono text-white">{system?.dbSizeKB || 0} KB</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Database Size</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800/80 font-mono">
          <div>
            <p className="text-base font-semibold text-white">{system?.totalMasa || masas.length}</p>
            <p className="text-[10px] text-zinc-500 uppercase">Piani Masa</p>
          </div>
          <div>
            <p className="text-base font-semibold text-white">{system?.totalEventi || totalEventi}</p>
            <p className="text-[10px] text-zinc-500 uppercase">Totale Eventi</p>
          </div>
          <div>
            <p className="text-base font-semibold text-emerald-400">Stable</p>
            <p className="text-[10px] text-zinc-500 uppercase">Integrità WAL</p>
          </div>
        </div>
      </div>

      {/* Bento Tile 3: Financial Cassa & Capital Instance (col-span-3) */}
      <div className="md:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Cassa &amp; Capitale</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              utileComplessivo >= 0 ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
            }`}
          >
            ROI {roiComplessivo >= 0 ? `+${roiComplessivo}%` : `${roiComplessivo}%`}
          </span>
        </div>

        <div className="my-2">
          <p className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
            €{totaleCassa.toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500 font-mono">
            su <span className="text-zinc-300">€{totaleCapitale.toFixed(2)}</span> iniziali
          </p>
        </div>

        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500">Resa Netta:</span>
          <span className={`font-bold ${utileComplessivo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {utileComplessivo >= 0 ? `+€${utileComplessivo.toFixed(2)}` : `-€${Math.abs(utileComplessivo).toFixed(2)}`}
          </span>
        </div>
      </div>
    </div>
  );
};
