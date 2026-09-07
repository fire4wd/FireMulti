import React, { useState } from 'react';
import { X, Clock, Check, AlertTriangle } from 'lucide-react';
import { BBMinute, BBPlayer } from '../../types';
import { getGameShapeStatus } from './BBConstants';

interface BBMinutesModalProps {
  player: BBPlayer | BBMinute | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playerid: string, minutes: number, name?: string, pos?: string) => Promise<void>;
}

export const BBMinutesModal: React.FC<BBMinutesModalProps> = ({
  player,
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !player) return null;

  const initialMin = (player as any).minuti_giocati ?? (player as any).min ?? 0;
  const [minutes, setMinutes] = useState<number>(initialMin);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = getGameShapeStatus(minutes);
  const playerId = (player as any).playerid || String((player as any).id);
  const playerName = (player as any).name || (player as any).player_name;
  const playerPos = (player as any).pos || (player as any).position;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await onSubmit(playerId, minutes, playerName, playerPos);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore aggiornamento minuti');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col font-sans text-zinc-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Aggiorna Minuti Settimanali</h3>
              <p className="text-xs text-zinc-400 font-mono">{playerName} ({playerPos})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 font-mono">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-400 font-mono font-medium">Minuti Giocati nella Settimana</label>
              <span className="text-xl font-bold font-mono text-white">{minutes} / 48m</span>
            </div>

            <input
              type="range"
              min="0"
              max="120"
              step="1"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />

            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0m</span>
              <span className="text-emerald-400 font-bold">48m (Allenamento Pieno)</span>
              <span className="text-amber-400">75m (Soglia Forma)</span>
              <span>120m</span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[0, 24, 48, 55, 65, 75, 90].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setMinutes(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  minutes === preset
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {preset}m
              </button>
            ))}
          </div>

          {/* Status feedback */}
          <div className={`p-3 rounded-xl border ${status.badgeClass} space-y-1`}>
            <div className="flex items-center gap-2 font-mono font-bold text-xs">
              <span className={status.color}>{status.label}</span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed font-sans">{status.tip}</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Conferma Minuti'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
