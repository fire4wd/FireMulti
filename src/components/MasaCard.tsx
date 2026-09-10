import React from 'react';
import { Play, Check, X, RotateCcw, Edit2, Trash2, Archive, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { MasaStats } from '../types';

interface MasaCardProps {
  masa: MasaStats;
  onSelect: (masa: MasaStats) => void;
  onEdit: (masa: MasaStats) => void;
  onDelete: (id: number) => void;
  onReset: (id: number) => void;
  onToggleActive: (id: number, currentActive: number) => void;
  isAdmin: boolean;
}

export const MasaCard: React.FC<MasaCardProps> = ({
  masa,
  onSelect,
  onEdit,
  onDelete,
  onReset,
  onToggleActive,
  isAdmin,
}) => {
  const isVinto = masa.stato === 'VINTO';
  const isPerso = masa.stato === 'PERSO';
  const isArchiviato = !masa.attivo || masa.stato === 'ARCHIVIATO';

  // Trova il prossimo evento in corso o in attesa
  const nextEvent = masa.eventi.find((e) => e.esito === 'IN CORSO') || masa.eventi.find((e) => e.esito === 'ATTESA');

  return (
    <div
      onClick={() => onSelect(masa)}
      className={`group relative bg-zinc-900 border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-zinc-700 flex flex-col justify-between ${
        isVinto
          ? 'border-emerald-600/40 bg-gradient-to-b from-zinc-900 to-emerald-950/20'
          : isPerso
          ? 'border-red-600/40 bg-gradient-to-b from-zinc-900 to-red-950/20'
          : isArchiviato
          ? 'border-zinc-800/80 opacity-75'
          : 'border-zinc-800'
      }`}
    >
      <div>
        {/* Top row: Name & Status Pill */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-lg group-hover:text-red-400 transition-colors">
                {masa.nome}
              </h3>
              {!masa.attivo && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                  ARCHIVIO
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400 font-mono mt-1">
              TARGET: <strong className="text-zinc-100">{masa.eventi_attesi}</strong> /{' '}
              <strong className="text-zinc-100">{masa.n_eventi}</strong> STEP
            </p>
          </div>

          {/* Status Badge */}
          <div>
            {isVinto && (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" /> COMPLETATO
              </span>
            )}
            {isPerso && (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                <X className="w-3.5 h-3.5" /> STOP LOSS
              </span>
            )}
            {!isVinto && !isPerso && (
              <span className="inline-flex items-center gap-2 text-xs font-mono font-bold px-3 py-1 rounded-full bg-zinc-950 text-zinc-300 border border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                ATTIVO
              </span>
            )}
          </div>
        </div>

        {/* Progress bar visual: slots for each event */}
        <div className="my-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-2">
            <span>
              STEP: <strong className="text-white text-sm">{masa.nGiocati}/{masa.n_eventi}</strong>
            </span>
            <span>
              VINTE: <strong className="text-emerald-400 text-sm">{masa.vinti}</strong> &bull; RESIDUI:{' '}
              <strong className="text-zinc-200 text-sm">{masa.kMancanti}</strong>
            </span>
          </div>

          {/* Segmented bar in dark inset */}
          <div className="grid grid-flow-col gap-1.5 h-3.5 w-full bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {Array.from({ length: masa.n_eventi }).map((_, idx) => {
              const ev = masa.eventi.find((e) => e.numero === idx + 1);
              let color = 'bg-zinc-800';
              if (ev) {
                if (ev.esito === 'VINTO') color = 'bg-emerald-500 shadow-sm shadow-emerald-500/40';
                else if (ev.esito === 'PERSO') color = 'bg-red-500 shadow-sm shadow-red-500/40';
                else if (ev.esito === 'IN CORSO') color = 'bg-amber-400 animate-pulse';
              }
              return (
                <div
                  key={idx}
                  className={`h-full rounded-sm transition-colors ${color}`}
                  title={`Evento #${idx + 1}: ${ev ? ev.esito : 'Non giocato'}`}
                />
              );
            })}
          </div>
        </div>

        {/* Metrics Grid Inset */}
        <div className="grid grid-cols-3 gap-2.5 py-3 px-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 my-3.5 text-center font-mono">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Capitale</div>
            <div className="text-sm sm:text-base font-bold text-zinc-200 mt-0.5">
              €{masa.capitale.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Cassa</div>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5">
              €{masa.cassaAttuale.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Resa Netta</div>
            <div
              className={`text-sm sm:text-base font-bold mt-0.5 ${
                masa.utileNetto >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {masa.utileNetto >= 0 ? `+€${masa.utileNetto.toFixed(2)}` : `-€${Math.abs(masa.utileNetto).toFixed(2)}`}
            </div>
          </div>
        </div>

        {/* Next step highlight */}
        {nextEvent && !isVinto && !isPerso && (
          <div className="flex items-center justify-between text-xs sm:text-sm py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 mb-3 font-mono">
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-lg font-bold">
                PROX
              </span>
              <span className="truncate text-zinc-100 font-medium">#{nextEvent.numero} {nextEvent.titolo || 'Evento'}</span>
            </div>
            <div className="shrink-0 pl-2 text-right">
              <span className="text-zinc-400 text-xs">Q:</span>{' '}
              <span className="text-amber-300 font-bold text-sm">{nextEvent.quota.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1 text-zinc-400">
          <button
            onClick={() => onToggleActive(masa.id, masa.attivo)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={masa.attivo ? 'Archivia Masaniello' : 'Riattiva Masaniello'}
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => onReset(masa.id)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
            title="Reset progressione eventi a zero"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(masa)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors"
            title="Modifica parametri Masa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => onDelete(masa.id)}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
              title="Elimina Masaniello e tutti i suoi eventi"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => onSelect(masa)}
          className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-mono text-xs sm:text-sm font-bold py-1.5 px-3 rounded-xl hover:bg-red-950/30 border border-red-500/30 transition-colors"
        >
          <span>APRI</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
