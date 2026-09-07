import React, { useState } from 'react';
import { X, Calendar, Plus, Trophy, DollarSign } from 'lucide-react';
import { BBMatch } from '../../types';

interface BBMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<BBMatch>) => Promise<void>;
}

export const BBMatchModal: React.FC<BBMatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<BBMatch>>({
    teamHome: 'UTC',
    teamAway: '',
    risHome: 95,
    risAway: 88,
    type: 'league',
    stagione: 65,
    date: new Date().toISOString().split('T')[0],
    bleachers: 4200,
    lower_tier: 1100,
    courtside: 250,
    luxury: 12,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamAway?.trim()) {
      setError('Inserisci il nome della squadra avversaria');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const total_attendance =
        (Number(formData.bleachers) || 0) +
        (Number(formData.lower_tier) || 0) +
        (Number(formData.courtside) || 0) +
        (Number(formData.luxury) || 0);

      await onSubmit({
        ...formData,
        total_attendance,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore nella registrazione della partita');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col font-sans text-zinc-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-500">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Registra Nuova Partita</h3>
              <p className="text-xs text-zinc-400 font-mono">Campionato, Coppa o Amichevole BuzzerBeater</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-zinc-400 font-mono">Squadra Casa</label>
              <input
                type="text"
                required
                value={formData.teamHome || ''}
                onChange={(e) => setFormData({ ...formData, teamHome: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-mono">Squadra Trasferta</label>
              <input
                type="text"
                required
                value={formData.teamAway || ''}
                placeholder="es. Bologna Sharpshooters"
                onChange={(e) => setFormData({ ...formData, teamAway: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-zinc-400 font-mono">Punteggio Casa</label>
              <input
                type="number"
                min="0"
                value={formData.risHome ?? 0}
                onChange={(e) => setFormData({ ...formData, risHome: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-center font-bold text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-mono">Punteggio Ospiti</label>
              <input
                type="number"
                min="0"
                value={formData.risAway ?? 0}
                onChange={(e) => setFormData({ ...formData, risAway: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-center font-bold text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-zinc-400 font-mono">Tipo Incontro</label>
              <select
                value={formData.type || 'league'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
              >
                <option value="league">Campionato (League)</option>
                <option value="cup">Coppa Nazionale (Cup)</option>
                <option value="friendly">Amichevole (Scrimmage)</option>
                <option value="playoff">Playoff / Playout</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 font-mono">Data Incontro</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] font-semibold">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Affluenza Palazzetto (Se partita in casa)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono">In Piedi</span>
                <input
                  type="number"
                  value={formData.bleachers ?? 0}
                  onChange={(e) => setFormData({ ...formData, bleachers: parseInt(e.target.value, 10) })}
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 text-white font-mono rounded-lg"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-mono">A Sedere</span>
                <input
                  type="number"
                  value={formData.lower_tier ?? 0}
                  onChange={(e) => setFormData({ ...formData, lower_tier: parseInt(e.target.value, 10) })}
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 text-white font-mono rounded-lg"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-mono">Bordocampo</span>
                <input
                  type="number"
                  value={formData.courtside ?? 0}
                  onChange={(e) => setFormData({ ...formData, courtside: parseInt(e.target.value, 10) })}
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 text-white font-mono rounded-lg"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-mono">Tribune VIP</span>
                <input
                  type="number"
                  value={formData.luxury ?? 0}
                  onChange={(e) => setFormData({ ...formData, luxury: parseInt(e.target.value, 10) })}
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 text-white font-mono rounded-lg"
                />
              </div>
            </div>
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
              {saving ? 'Registrazione...' : 'Salva Partita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
