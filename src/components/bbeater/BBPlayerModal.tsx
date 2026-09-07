import React from 'react';
import { X, Lock, Dribbble, Shield, Trophy, Activity, Award, User } from 'lucide-react';
import { BBPlayer } from '../../types';
import { BB_SKILL_NAMES, BB_SKILL_LEVELS, BB_POTENTIAL_LEVELS, getSkillColor } from './BBConstants';

interface BBPlayerModalProps {
  player: BBPlayer | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: Partial<BBPlayer>) => Promise<void>;
}

export const BBPlayerModal: React.FC<BBPlayerModalProps> = ({
  player,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !player) return null;

  const skillOut = (player.js || 0) + (player.jr || 0) + (player.od || 0) + (player.ha || 0) + (player.dr || 0) + (player.pa || 0);
  const skillIn = (player.ish || 0) + (player.ide || 0) + (player.rb || 0) + (player.sb || 0);
  const skillTot = player.skill_tot || skillOut + skillIn + (player.st || 0) + (player.ft || 0);

  const skillsOutGroup = [
    { key: 'js', label: 'Tiro in sospensione (JS)', val: player.js || 0 },
    { key: 'jr', label: 'Distanza di tiro (JR)', val: player.jr || 0 },
    { key: 'od', label: 'Difesa perimetrale (OD)', val: player.od || 0 },
    { key: 'ha', label: 'Controllo palla (HA)', val: player.ha || 0 },
    { key: 'dr', label: 'Penetrazione (DR)', val: player.dr || 0 },
    { key: 'pa', label: 'Passaggio (PA)', val: player.pa || 0 },
  ];

  const skillsInGroup = [
    { key: 'ish', label: 'Tiro da sotto (IS)', val: player.ish || 0 },
    { key: 'ide', label: 'Difesa interna (ID)', val: player.ide || 0 },
    { key: 'rb', label: 'Rimbalzo (RB)', val: player.rb || 0 },
    { key: 'sb', label: 'Stoppata (SB)', val: player.sb || 0 },
  ];

  const skillsGenGroup = [
    { key: 'st', label: 'Resistenza (ST)', val: player.st || 0 },
    { key: 'ft', label: 'Tiri liberi (FT)', val: player.ft || 0 },
    { key: 'ex', label: 'Esperienza (EX)', val: player.ex || 0 },
    { key: 'gs', label: 'Forma (GS)', val: player.gs || 0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-950/70 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
              <Dribbble className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-orange-500 text-zinc-950">
                  {player.pos}
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight">{player.name}</h2>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                ID Atleta: #{player.id} &bull; {player.age} anni &bull; {player.height || "195 cm"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-Only Status Banner */}
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-400" />
            <span>Alimentato automaticamente da script &amp; API BuzzerBeater (Sola lettura)</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
            Live DB
          </span>
        </div>

        {/* Vital stats bento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">Stipendio</span>
            <span className="text-sm font-bold text-emerald-400">
              ${(player.salary || 0).toLocaleString()}
            </span>
          </div>
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">DMI</span>
            <span className="text-sm font-bold text-cyan-400">
              {(player.dmi || 0).toLocaleString()}
            </span>
          </div>
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">Potenziale</span>
            <span className="text-sm font-bold text-amber-400">
              {player.potential} - {BB_POTENTIAL_LEVELS[player.potential] || 'Valido'}
            </span>
          </div>
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase">Skill Totali</span>
            <span className="text-sm font-bold text-orange-400">
              {skillTot} TSP
            </span>
          </div>
        </div>

        {/* Skills Breakdown */}
        <div className="space-y-4">
          {/* External Skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <span>Skill Perimetrali (Esterne)</span>
              </h3>
              <span className="text-xs font-mono text-zinc-400">Somma: {skillOut}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {skillsOutGroup.map((s) => (
                <div
                  key={s.key}
                  className="bg-zinc-950/80 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between font-mono text-xs"
                >
                  <span className="text-zinc-400 text-[11px] truncate pr-2">{s.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getSkillColor(s.val)}`}>
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <span>Skill Interne (Area / Post)</span>
              </h3>
              <span className="text-xs font-mono text-zinc-400">Somma: {skillIn}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {skillsInGroup.map((s) => (
                <div
                  key={s.key}
                  className="bg-zinc-950/80 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between font-mono text-xs"
                >
                  <span className="text-zinc-400 text-[11px] truncate pr-2">{s.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getSkillColor(s.val)}`}>
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* General & Physical Skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <span>Fisiche &amp; Altre</span>
              </h3>
              <span className="text-xs font-mono text-zinc-400">Minuti: {player.min || 0}m</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {skillsGenGroup.map((s) => (
                <div
                  key={s.key}
                  className="bg-zinc-950/80 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between font-mono text-xs"
                >
                  <span className="text-zinc-400 text-[11px] truncate pr-1">{s.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getSkillColor(s.val)}`}>
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800 font-mono text-xs">
          <span className="text-zinc-500">Database SQLite buzzerbeater.db</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors"
          >
            Chiudi Scheda
          </button>
        </div>
      </div>
    </div>
  );
};
