import React, { useState, useEffect } from 'react';
import { X, Save, ShieldAlert, Award, User, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { HtPlayer } from '../../types';
import { HT_DENOMINATIONS, HT_SPECIALTIES, HT_FORM_LEVELS, HT_LEADERSHIP, HT_AGREEABILITY, HT_AGGRESSIVENESS, HT_HONESTY } from './HtConstants';

interface HtPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playerData: Partial<HtPlayer>) => Promise<void>;
  initialData?: HtPlayer | null;
}

export const HtPlayerModal: React.FC<HtPlayerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [activeSection, setActiveSection] = useState<'info' | 'skills' | 'personality' | 'status'>('info');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<HtPlayer>>({
    FirstName: '',
    NickName: '',
    LastName: '',
    PlayerNumber: 10,
    Age: 20,
    AgeDays: 0,
    TSI: 1500,
    PlayerForm: 6,
    Salary: 1200,
    Specialty: 0,
    Experience: 3,
    Loyalty: 10,
    Leadership: 4,
    Agreeability: 3,
    Aggressiveness: 3,
    Honesty: 3,
    InjuryLevel: 0,
    Cards: 0,
    TransferListed: 0,
    StaminaSkill: 6,
    KeeperSkill: 1,
    PlaymakerSkill: 6,
    ScorerSkill: 5,
    PassingSkill: 5,
    WingerSkill: 4,
    DefenderSkill: 5,
    SetPiecesSkill: 3,
    CareerGoals: 0,
    CareerAssists: 0,
    LeagueGoals: 0,
    MatchesCurrentTeam: 0,
    OwnerNotes: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData });
    } else {
      setForm({
        FirstName: '',
        NickName: '',
        LastName: '',
        PlayerNumber: 10,
        Age: 20,
        AgeDays: 0,
        TSI: 1500,
        PlayerForm: 6,
        Salary: 1200,
        Specialty: 0,
        Experience: 3,
        Loyalty: 10,
        Leadership: 4,
        Agreeability: 3,
        Aggressiveness: 3,
        Honesty: 3,
        InjuryLevel: 0,
        Cards: 0,
        TransferListed: 0,
        StaminaSkill: 6,
        KeeperSkill: 1,
        PlaymakerSkill: 6,
        ScorerSkill: 5,
        PassingSkill: 5,
        WingerSkill: 4,
        DefenderSkill: 5,
        SetPiecesSkill: 3,
        CareerGoals: 0,
        CareerAssists: 0,
        LeagueGoals: 0,
        MatchesCurrentTeam: 0,
        OwnerNotes: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof HtPlayer, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.FirstName?.trim() || !form.LastName?.trim()) {
      setError('Nome e Cognome sono obbligatori.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore salvataggio giocatore');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialData ? `Modifica #${initialData.PlayerNumber} ${initialData.FirstName} ${initialData.LastName}` : 'Aggiungi Nuovo Giocatore Hattrick'}
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Tabella SQLite "Player" &bull; Schema Hattrick (50 attributi)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-6 pt-2 font-mono text-xs gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('info')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all ${
              activeSection === 'info'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            1. Anagrafica &amp; Ruolo
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('skills')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all ${
              activeSection === 'skills'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            2. Primarie &amp; Skill (1-20)
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('personality')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all ${
              activeSection === 'personality'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            3. Personalità &amp; Specialità
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('status')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all ${
              activeSection === 'status'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            4. Statistiche &amp; Salute
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Anagrafica */}
          {activeSection === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={form.FirstName || ''}
                    onChange={(e) => handleChange('FirstName', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="es. Marco"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Soprannome</label>
                  <input
                    type="text"
                    value={form.NickName || ''}
                    onChange={(e) => handleChange('NickName', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="es. Il Falco"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Cognome *</label>
                  <input
                    type="text"
                    required
                    value={form.LastName || ''}
                    onChange={(e) => handleChange('LastName', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="es. Rossi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Numero Maglia</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={form.PlayerNumber ?? 10}
                    onChange={(e) => handleChange('PlayerNumber', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Età (Anni)</label>
                  <input
                    type="number"
                    min="17"
                    max="45"
                    value={form.Age ?? 20}
                    onChange={(e) => handleChange('Age', parseInt(e.target.value, 10) || 17)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Giorni Età (0-111)</label>
                  <input
                    type="number"
                    min="0"
                    max="111"
                    value={form.AgeDays ?? 0}
                    onChange={(e) => handleChange('AgeDays', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Forma Partita (1-8)</label>
                  <select
                    value={form.PlayerForm ?? 6}
                    onChange={(e) => handleChange('PlayerForm', parseInt(e.target.value, 10) || 6)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl} - {HT_FORM_LEVELS[lvl]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">TSI (Indice di Abilità)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.TSI ?? 1000}
                    onChange={(e) => handleChange('TSI', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Stipendio Settimanale (€)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.Salary ?? 1000}
                    onChange={(e) => handleChange('Salary', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Note Proprietario / Tattiche</label>
                <textarea
                  rows={2}
                  value={form.OwnerNotes || ''}
                  onChange={(e) => handleChange('OwnerNotes', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="Appunti sull'allenamento, slot o mercato..."
                />
              </div>
            </div>
          )}

          {/* Section 2: Skills (1-20) */}
          {activeSection === 'skills' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 font-mono">
                Valori da 1 (Disastroso) a 20 (Divino) secondo la scala ufficiale Hattrick.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Parate */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-amber-400">🧤 Parate (Keeper)</span>
                    <span className="text-[11px] font-mono text-zinc-400">{HT_DENOMINATIONS[form.KeeperSkill || 1]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={form.KeeperSkill ?? 1}
                    onChange={(e) => handleChange('KeeperSkill', parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Difesa */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-blue-400">🛡️ Difesa (Defending)</span>
                    <span className="text-[11px] font-mono text-zinc-400">{HT_DENOMINATIONS[form.DefenderSkill || 1]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={form.DefenderSkill ?? 1}
                    onChange={(e) => handleChange('DefenderSkill', parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* Regia */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-emerald-400">⚡ Regia (Playmaking)</span>
                    <span className="text-[11px] font-mono text-zinc-400">{HT_DENOMINATIONS[form.PlaymakerSkill || 1]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={form.PlaymakerSkill ?? 1}
                    onChange={(e) => handleChange('PlaymakerSkill', parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Cross */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-cyan-400">🏃 Cross (Winger)</span>
                    <span className="text-[11px] font-mono text-zinc-400">{HT_DENOMINATIONS[form.WingerSkill || 1]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={form.WingerSkill ?? 1}
                    onChange={(e) => handleChange('WingerSkill', parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Passaggi */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-indigo-400">🎯 Passaggi (Passing)</span>
                    <span className="text-[11px] font-mono text-zinc-400">{HT_DENOMINATIONS[form.PassingSkill || 1]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={form.PassingSkill ?? 1}
                    onChange={(e) => handleChange('PassingSkill', parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Attacco */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-red-400">⚽ Attacco (Scoring)</span>
                    <span className="text-[11px] font-mono text-zinc-400">{HT_DENOMINATIONS[form.ScorerSkill || 1]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={form.ScorerSkill ?? 1}
                    onChange={(e) => handleChange('ScorerSkill', parseInt(e.target.value, 10))}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                </div>

                {/* Calci Piazzati */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-purple-400">⛳ Calci Piazzati (Set Pieces)</span>
                    <span className="text-[11px] font-mono text-zinc-400">{HT_DENOMINATIONS[form.SetPiecesSkill || 1]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={form.SetPiecesSkill ?? 1}
                    onChange={(e) => handleChange('SetPiecesSkill', parseInt(e.target.value, 10))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* Resistenza */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold text-teal-400">🫀 Resistenza (Stamina 1-9)</span>
                    <span className="text-[11px] font-mono text-zinc-400">{HT_DENOMINATIONS[form.StaminaSkill || 1]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="9"
                    value={form.StaminaSkill ?? 5}
                    onChange={(e) => handleChange('StaminaSkill', parseInt(e.target.value, 10))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Personality & Specialty */}
          {activeSection === 'personality' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Specialità</label>
                  <select
                    value={form.Specialty ?? 0}
                    onChange={(e) => handleChange('Specialty', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {Object.entries(HT_SPECIALTIES).map(([id, spec]) => (
                      <option key={id} value={id}>
                        {spec.icon} {spec.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Esperienza (1-20)</label>
                  <select
                    value={form.Experience ?? 3}
                    onChange={(e) => handleChange('Experience', parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {[...Array(20)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} - {HT_DENOMINATIONS[i + 1]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Carisma / Leadership (1-8)</label>
                  <select
                    value={form.Leadership ?? 4}
                    onChange={(e) => handleChange('Leadership', parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl} - {HT_LEADERSHIP[lvl]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Fedeltà (1-20)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={form.Loyalty ?? 10}
                    onChange={(e) => handleChange('Loyalty', parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Simpatia (Agreeability)</label>
                  <select
                    value={form.Agreeability ?? 3}
                    onChange={(e) => handleChange('Agreeability', parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {HT_AGREEABILITY[lvl]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Aggressività</label>
                  <select
                    value={form.Aggressiveness ?? 3}
                    onChange={(e) => handleChange('Aggressiveness', parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {HT_AGGRESSIVENESS[lvl]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Onestà</label>
                  <select
                    value={form.Honesty ?? 3}
                    onChange={(e) => handleChange('Honesty', parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {HT_HONESTY[lvl]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={Boolean(form.MotherClubBonus)}
                      onChange={(e) => handleChange('MotherClubBonus', e.target.checked ? 1 : 0)}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <span>Bonus Club di Origine (+0.5 stelle)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Status & Health */}
          {activeSection === 'status' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Stato Salute / Infortunio</label>
                  <select
                    value={form.InjuryLevel ?? 0}
                    onChange={(e) => handleChange('InjuryLevel', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="0">✅ Sano e Arruolabile</option>
                    <option value="-1">🩹 Acciaccato / Cerotto (gioca)</option>
                    <option value="1">🚑 Infortunato (1 settimana)</option>
                    <option value="2">🚑 Infortunato (2 settimane)</option>
                    <option value="3">🚑 Infortunato (3 settimane)</option>
                    <option value="4">🚑 Infortunato (4 settimane)</option>
                    <option value="5">🚑 Infortunato (5+ settimane)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Cartellini Gialli Accumulati</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={form.Cards ?? 0}
                    onChange={(e) => handleChange('Cards', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Gol Campionato</label>
                  <input
                    type="number"
                    min="0"
                    value={form.LeagueGoals ?? 0}
                    onChange={(e) => handleChange('LeagueGoals', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Gol Carriera</label>
                  <input
                    type="number"
                    min="0"
                    value={form.CareerGoals ?? 0}
                    onChange={(e) => handleChange('CareerGoals', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Assist Carriera</label>
                  <input
                    type="number"
                    min="0"
                    value={form.CareerAssists ?? 0}
                    onChange={(e) => handleChange('CareerAssists', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Partite Giocate</label>
                  <input
                    type="number"
                    min="0"
                    value={form.MatchesCurrentTeam ?? 0}
                    onChange={(e) => handleChange('MatchesCurrentTeam', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={Boolean(form.TransferListed)}
                    onChange={(e) => handleChange('TransferListed', e.target.checked ? 1 : 0)}
                    className="rounded accent-emerald-500 w-4 h-4"
                  />
                  <span>Sul Mercato Trasferimenti (Transfer Listed)</span>
                </label>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Salvataggio...' : initialData ? 'Aggiorna Giocatore' : 'Crea Giocatore'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
