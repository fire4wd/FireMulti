import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, ShieldAlert, Award, Activity } from 'lucide-react';
import { BBPlayer } from '../../types';
import { BB_SKILL_NAMES, BB_SKILL_LEVELS, BB_POTENTIAL_LEVELS } from './BBConstants';

interface BBPlayerModalProps {
  player: BBPlayer | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<BBPlayer>) => Promise<void>;
}

export const BBPlayerModal: React.FC<BBPlayerModalProps> = ({
  player,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<BBPlayer>>({
    name: '',
    pos: 'PG',
    age: 21,
    height: '190 cm / 6\'3"',
    potential: 8,
    salary: 12000,
    dmi: 150000,
    min: 48,
    js: 10,
    jr: 9,
    od: 10,
    ha: 9,
    dr: 9,
    pa: 9,
    ish: 6,
    ide: 6,
    rb: 5,
    sb: 4,
    st: 7,
    ft: 8,
    ex: 5,
    gs: 8,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (player) {
      setFormData({
        ...player,
      });
    } else {
      setFormData({
        name: '',
        pos: 'PG',
        age: 21,
        height: '190 cm / 6\'3"',
        potential: 8,
        salary: 12000,
        dmi: 150000,
        min: 48,
        js: 10,
        jr: 9,
        od: 10,
        ha: 9,
        dr: 9,
        pa: 9,
        ish: 6,
        ide: 6,
        rb: 5,
        sb: 4,
        st: 7,
        ft: 8,
        ex: 5,
        gs: 8,
      });
    }
    setError(null);
  }, [player, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof BBPlayer, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Inserisci il nome del giocatore');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore salvataggio giocatore');
    } finally {
      setSaving(false);
    }
  };

  // Calcolo skill totals dinamici
  const js = Number(formData.js) || 1;
  const jr = Number(formData.jr) || 1;
  const od = Number(formData.od) || 1;
  const ha = Number(formData.ha) || 1;
  const dr = Number(formData.dr) || 1;
  const pa = Number(formData.pa) || 1;
  const ish = Number(formData.ish) || 1;
  const ide = Number(formData.ide) || 1;
  const rb = Number(formData.rb) || 1;
  const sb = Number(formData.sb) || 1;
  const st = Number(formData.st) || 1;
  const ft = Number(formData.ft) || 1;

  const skillOut = js + jr + od + ha + dr + pa;
  const skillIn = ish + ide + rb + sb;
  const skillTot = skillOut + skillIn + st + ft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 font-sans text-zinc-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-500">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {player ? `Modifica Giocatore: ${player.name}` : 'Aggiungi Giocatore a Roster BuzzerBeater'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Valori skill ufficiali BuzzerBeater (1-20), stipendio e potenziale
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 font-mono">
              {error}
            </div>
          )}

          {/* Anagrafica & Informazioni Primarie */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
            <h4 className="text-zinc-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
              Anagrafica &amp; Dati Contrattuali
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-zinc-400 font-mono">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="es. Marco Bellini"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-mono">Ruolo Primario</label>
                <select
                  value={formData.pos || 'PG'}
                  onChange={(e) => handleChange('pos', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono font-bold focus:outline-none focus:border-red-500"
                >
                  <option value="PG">PG - Playmaker</option>
                  <option value="SG">SG - Guardia Tiratrice</option>
                  <option value="SF">SF - Ala Piccola</option>
                  <option value="PF">PF - Ala Grande</option>
                  <option value="C">C - Centro / Pivot</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-zinc-400 font-mono">Età (Anni)</label>
                <input
                  type="number"
                  min="18"
                  max="45"
                  value={formData.age || 20}
                  onChange={(e) => handleChange('age', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-mono">Altezza (cm)</label>
                <input
                  type="text"
                  value={formData.height || '195 cm / 6\'5"'}
                  onChange={(e) => handleChange('height', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-mono">Stipendio Settimanale ($)</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={formData.salary || 10000}
                  onChange={(e) => handleChange('salary', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-mono">DMI (Indice Valutazione)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={formData.dmi || 100000}
                  onChange={(e) => handleChange('dmi', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-zinc-400 font-mono">Potenziale</label>
                <select
                  value={formData.potential || 8}
                  onChange={(e) => handleChange('potential', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-300 font-mono focus:outline-none focus:border-red-500"
                >
                  {Object.entries(BB_POTENTIAL_LEVELS).map(([lvl, name]) => (
                    <option key={lvl} value={lvl}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-mono">Minuti Settimanali Attuali</label>
                <input
                  type="number"
                  min="0"
                  max="144"
                  value={formData.min || 0}
                  onChange={(e) => handleChange('min', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono font-bold focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Skill Breakdown: Esterne, Interne, Fisiche */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-zinc-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
                Valutazione Skill (Scala BuzzerBeater 1-20)
              </h4>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-zinc-400">Esterne: <strong className="text-cyan-400">{skillOut}</strong></span>
                <span className="text-zinc-400">Interne: <strong className="text-amber-400">{skillIn}</strong></span>
                <span className="text-zinc-400">Totale: <strong className="text-emerald-400">{skillTot}</strong></span>
              </div>
            </div>

            {/* Skill Esterne (Guards / Wings) */}
            <div className="space-y-2">
              <span className="text-[10px] text-cyan-400 uppercase font-mono tracking-widest font-bold">
                Skill Esterne (Perimetro)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'js', label: 'Tiro in sospensione (JS)' },
                  { key: 'jr', label: 'Distanza di tiro (JR)' },
                  { key: 'od', label: 'Difesa perimetrale (OD)' },
                  { key: 'ha', label: 'Controllo palla (HA)' },
                  { key: 'dr', label: 'Penetrazione (DR)' },
                  { key: 'pa', label: 'Passaggio (PA)' },
                ].map(({ key, label }) => {
                  const val = (formData as any)[key] || 1;
                  return (
                    <div key={key} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-mono text-[11px] truncate">{label}</span>
                        <span className="text-cyan-300 font-mono font-bold">{val}</span>
                      </div>
                      <select
                        value={val}
                        onChange={(e) => handleChange(key as keyof BBPlayer, parseInt(e.target.value, 10))}
                        className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                      >
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl} - {BB_SKILL_LEVELS[lvl] || lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skill Interne (Big Men) */}
            <div className="space-y-2 pt-2 border-t border-zinc-850">
              <span className="text-[10px] text-amber-400 uppercase font-mono tracking-widest font-bold">
                Skill Interne (Sotto canestro)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'ish', label: 'Tiro da sotto (IS)' },
                  { key: 'ide', label: 'Difesa in area (ID)' },
                  { key: 'rb', label: 'Rimbalzo (RB)' },
                  { key: 'sb', label: 'Stoppata (SB)' },
                ].map(({ key, label }) => {
                  const val = (formData as any)[key] || 1;
                  return (
                    <div key={key} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-mono text-[11px] truncate">{label}</span>
                        <span className="text-amber-300 font-mono font-bold">{val}</span>
                      </div>
                      <select
                        value={val}
                        onChange={(e) => handleChange(key as keyof BBPlayer, parseInt(e.target.value, 10))}
                        className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                      >
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl} - {BB_SKILL_LEVELS[lvl] || lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fisiche / Secondarie */}
            <div className="space-y-2 pt-2 border-t border-zinc-850">
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest font-bold">
                Fisico, Tiro Libero, Esperienza &amp; Forma
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'st', label: 'Resistenza (ST)' },
                  { key: 'ft', label: 'Tiri Liberi (FT)' },
                  { key: 'ex', label: 'Esperienza (EXP)' },
                  { key: 'gs', label: 'Forma (GS)' },
                ].map(({ key, label }) => {
                  const val = (formData as any)[key] || 1;
                  return (
                    <div key={key} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-mono text-[11px] truncate">{label}</span>
                        <span className="text-white font-mono font-bold">{val}</span>
                      </div>
                      <select
                        value={val}
                        onChange={(e) => handleChange(key as keyof BBPlayer, parseInt(e.target.value, 10))}
                        className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono"
                      >
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl} - {BB_SKILL_LEVELS[lvl] || lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-semibold text-xs shadow-md shadow-red-950/40 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvataggio...' : player ? 'Aggiorna Giocatore' : 'Aggiungi Giocatore'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
