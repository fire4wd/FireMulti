import React from 'react';
import { X, Edit2, Trash2, Shield, Award, Activity, HeartPulse, User, Star } from 'lucide-react';
import { HtPlayer } from '../../types';
import { HT_DENOMINATIONS, HT_SPECIALTIES, HT_FORM_LEVELS, HT_ROLES, HT_LEADERSHIP, HT_AGREEABILITY, HT_AGGRESSIVENESS, HT_HONESTY, getSkillBadgeClass } from './HtConstants';

interface HtPlayerDetailModalProps {
  player: HtPlayer | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (player: HtPlayer) => void;
  onDelete: (playerId: number) => void;
  isAdmin?: boolean;
}

export const HtPlayerDetailModal: React.FC<HtPlayerDetailModalProps> = ({
  player,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isAdmin = true,
}) => {
  if (!isOpen || !player) return null;

  const spec = HT_SPECIALTIES[player.Specialty || 0] || { label: 'Nessuna', icon: '—' };
  const bestRole = player.bestRole || { code: 'IM', label: 'Centrocampista', rating: 5 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header with Player Banner */}
        <div className="relative p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 text-2xl font-black font-mono shadow-inner shrink-0">
              #{player.PlayerNumber}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight truncate">
                  {player.FirstName} {player.NickName ? `"${player.NickName}" ` : ''}{player.LastName}
                </h2>
                {player.TransferListed ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-500/40">
                    SUL MERCATO
                  </span>
                ) : null}
                {player.MotherClubBonus ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    CLUB ORIGINARIO
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-1 flex-wrap">
                <span>{player.Age} anni e {player.AgeDays} giorni</span>
                <span>&bull;</span>
                <span className="text-emerald-400 font-bold">TSI {player.TSI.toLocaleString()}</span>
                <span>&bull;</span>
                <span>Stipendio: €{player.Salary.toLocaleString()}/settimana</span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${HT_ROLES[bestRole.code]?.badgeColor || 'bg-zinc-800 text-zinc-300'}`}>
                  ⭐ Miglior Ruolo: {bestRole.label} ({bestRole.rating} stelle)
                </span>
                {player.InjuryLevel === -1 && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-amber-950 text-amber-400 border border-amber-700">
                    🩹 Acciaccato
                  </span>
                )}
                {player.InjuryLevel > 0 && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-red-950 text-red-400 border border-red-700">
                    🚑 Infortunato ({player.InjuryLevel} sett.)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Primary Skills Grid (Hattrick 8 Skills) */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
              <span>Abilità Primarie (Scala 1-20)</span>
              <span className="text-zinc-500 font-normal">Forma: {HT_FORM_LEVELS[player.PlayerForm] || player.PlayerForm}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: 'Parate (Keeper)', val: player.KeeperSkill, color: 'accent-amber-500', icon: '🧤' },
                { label: 'Difesa (Defending)', val: player.DefenderSkill, color: 'accent-blue-500', icon: '🛡️' },
                { label: 'Regia (Playmaking)', val: player.PlaymakerSkill, color: 'accent-emerald-500', icon: '⚡' },
                { label: 'Cross (Winger)', val: player.WingerSkill, color: 'accent-cyan-500', icon: '🏃' },
                { label: 'Passaggi (Passing)', val: player.PassingSkill, color: 'accent-indigo-500', icon: '🎯' },
                { label: 'Attacco (Scoring)', val: player.ScorerSkill, color: 'accent-red-500', icon: '⚽' },
                { label: 'Calci Piazzati (SP)', val: player.SetPiecesSkill, color: 'accent-purple-500', icon: '⛳' },
                { label: 'Resistenza (Stamina)', val: player.StaminaSkill, max: 9, color: 'accent-teal-500', icon: '🫀' },
              ].map((s) => {
                const max = s.max || 20;
                const percent = Math.min(100, Math.round((s.val / max) * 100));
                return (
                  <div key={s.label} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div className="flex justify-between items-center mb-1 text-xs font-mono">
                      <span className="text-zinc-300 font-medium">{s.icon} {s.label}</span>
                      <span className={`px-1.5 py-0.2 rounded border text-[11px] ${getSkillBadgeClass(s.val)}`}>
                        {HT_DENOMINATIONS[s.val] || s.val}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-850 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Evaluation Ratings */}
          {player.roleRatings && player.roleRatings.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Valutazione Rendimento per Posizione
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono text-center">
                {player.roleRatings.map((r) => (
                  <div
                    key={r.code}
                    className={`p-2 rounded-xl border ${
                      r.code === bestRole.code
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="text-xs font-bold text-zinc-400">{r.code}</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">{r.rating}</div>
                    <div className="text-[9px] text-zinc-500 uppercase">{r.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personality & Background */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs font-mono">
              <h4 className="font-bold text-zinc-200 border-b border-zinc-800 pb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Personalità &amp; Carattere</span>
              </h4>
              <div className="flex justify-between text-zinc-400">
                <span>Specialità:</span>
                <span className="text-zinc-200 font-semibold">{spec.icon} {spec.label}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Simpatia:</span>
                <span className="text-zinc-200">{HT_AGREEABILITY[player.Agreeability] || 'Gradevole'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Aggressività:</span>
                <span className="text-zinc-200">{HT_AGGRESSIVENESS[player.Aggressiveness] || 'Calmo'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Onestà:</span>
                <span className="text-zinc-200">{HT_HONESTY[player.Honesty] || 'Onesto'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Carisma (Leadership):</span>
                <span className="text-zinc-200">{HT_LEADERSHIP[player.Leadership] || 'Debole'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Esperienza:</span>
                <span className="text-zinc-200">{HT_DENOMINATIONS[player.Experience] || player.Experience}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Fedeltà:</span>
                <span className="text-zinc-200">{HT_DENOMINATIONS[player.Loyalty] || player.Loyalty}</span>
              </div>
            </div>

            {/* Career & Match Stats */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs font-mono">
              <h4 className="font-bold text-zinc-200 border-b border-zinc-800 pb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Statistiche in Campo</span>
              </h4>
              <div className="flex justify-between text-zinc-400">
                <span>Gol in Campionato:</span>
                <span className="text-emerald-400 font-bold">{player.LeagueGoals}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Gol Totali Carriera:</span>
                <span className="text-white font-bold">{player.CareerGoals}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Assist Carriera:</span>
                <span className="text-white">{player.CareerAssists}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Partite con questa squadra:</span>
                <span className="text-zinc-200">{player.MatchesCurrentTeam}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Cartellini Gialli:</span>
                <span className="text-amber-400">{player.Cards}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Presenze Nazionale:</span>
                <span className="text-zinc-200">{player.Caps} (U20: {player.CapsU20})</span>
              </div>
            </div>
          </div>

          {/* Owner Notes */}
          {player.OwnerNotes && (
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs font-mono">
              <span className="text-zinc-500 font-bold block mb-1">Note Proprietario:</span>
              <p className="text-zinc-300 whitespace-pre-wrap">{player.OwnerNotes}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => {
                  if (confirm(`Sei sicuro di voler eliminare ${player.FirstName} ${player.LastName}?`)) {
                    onDelete(player.PlayerID);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-mono transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Elimina</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(player);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-md shadow-emerald-950/40 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Modifica Giocatore</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
