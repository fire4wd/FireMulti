import React, { useState } from 'react';
import { Trophy, Users, Shield, Award, ChevronDown, Check } from 'lucide-react';
import { HtBestXI, HtPlayer } from '../../types';
import { HT_SPECIALTIES, HT_ROLES } from './HtConstants';

interface HtBestXIPitchProps {
  bestXI: HtBestXI | null;
  loading: boolean;
  selectedFormation: string;
  onChangeFormation: (formation: string) => void;
  onSelectPlayer: (player: HtPlayer) => void;
}

const FORMATIONS = ['4-4-2', '3-5-2', '4-3-3', '3-4-3', '4-5-1', '5-3-2'];

export const HtBestXIPitch: React.FC<HtBestXIPitchProps> = ({
  bestXI,
  loading,
  selectedFormation,
  onChangeFormation,
  onSelectPlayer,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-900 border border-zinc-800 rounded-2xl min-h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-zinc-400">Calcolo formazione ottimale e valutazioni ruoli...</p>
      </div>
    );
  }

  if (!bestXI || !bestXI.lineup) {
    return (
      <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl">
        <p className="text-xs font-mono text-zinc-400">Nessun dato formazione disponibile. Assicurati di avere almeno 11 giocatori.</p>
      </div>
    );
  }

  const { GK = [], CD = [], WB = [], IM = [], W = [], FW = [] } = bestXI.lineup;

  // Calculate total star rating of XI
  const allEleven = [...GK, ...CD, ...WB, ...IM, ...W, ...FW];
  const totalStars = allEleven.reduce((sum, item) => sum + (item.roleRating || 0), 0);
  const avgStars = allEleven.length > 0 ? (totalStars / allEleven.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      {/* Formation Selector & Tactical Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Miglior Undici (Best XI)</span>
              <span className="text-xs font-mono font-normal text-emerald-400">
                Modulo {selectedFormation}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Calcolato tramite algoritmo di ponderazione abilità Hattrick su {bestXI.availablePlayers} giocatori disponibili
            </p>
          </div>
        </div>

        {/* Formation Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-zinc-400">Modulo:</span>
          <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs">
            {FORMATIONS.map((f) => (
              <button
                key={f}
                onClick={() => onChangeFormation(f)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedFormation === f
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="px-3 py-1.5 bg-emerald-950/50 border border-emerald-500/30 rounded-xl font-mono text-xs text-emerald-300">
            ⭐ Media: <strong>{avgStars}</strong> stelle ({totalStars.toFixed(1)} tot)
          </div>
        </div>
      </div>

      {/* Realistic Football Pitch Container */}
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-emerald-600/40 shadow-2xl bg-gradient-to-b from-emerald-900 via-emerald-950 to-green-950 p-4 sm:p-8 min-h-[620px] flex flex-col justify-between select-none">
        {/* Pitch Markings */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {/* Halfway line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white -translate-y-1/2" />
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 w-36 h-36 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          {/* Penalty Boxes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 border-b-2 border-x-2 border-white" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-28 border-t-2 border-x-2 border-white" />
          {/* Goal Boxes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-12 border-b-2 border-x-2 border-white" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-12 border-t-2 border-x-2 border-white" />
        </div>

        {/* ROW 1: ATTACK (FW) */}
        <div className="relative z-10 flex items-center justify-around gap-4 py-2">
          {FW.map((slot, idx) => (
            <PlayerPitchBadge
              key={`fw-${idx}-${slot.player.PlayerID}`}
              player={slot.player}
              rating={slot.roleRating}
              roleLabel="FW"
              roleName="Attaccante"
              onClick={() => onSelectPlayer(slot.player)}
            />
          ))}
        </div>

        {/* ROW 2: WINGERS & CENTRAL MIDFIELDERS (W & IM) */}
        <div className="relative z-10 flex items-center justify-around gap-2 py-4">
          {/* Left Winger */}
          {W[0] && (
            <PlayerPitchBadge
              player={W[0].player}
              rating={W[0].roleRating}
              roleLabel="LW"
              roleName="Ala Sinistra"
              onClick={() => onSelectPlayer(W[0].player)}
            />
          )}

          {/* Central Midfielders (IM) */}
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            {IM.map((slot, idx) => (
              <PlayerPitchBadge
                key={`im-${idx}-${slot.player.PlayerID}`}
                player={slot.player}
                rating={slot.roleRating}
                roleLabel="IM"
                roleName="Centrocampista"
                onClick={() => onSelectPlayer(slot.player)}
              />
            ))}
          </div>

          {/* Right Winger */}
          {W[1] && (
            <PlayerPitchBadge
              player={W[1].player}
              rating={W[1].roleRating}
              roleLabel="RW"
              roleName="Ala Destra"
              onClick={() => onSelectPlayer(W[1].player)}
            />
          )}
        </div>

        {/* ROW 3: DEFENSE (WB & CD) */}
        <div className="relative z-10 flex items-center justify-around gap-2 py-4">
          {/* Left Wing Back */}
          {WB[0] && (
            <PlayerPitchBadge
              player={WB[0].player}
              rating={WB[0].roleRating}
              roleLabel="LWB"
              roleName="Terzino Sinistro"
              onClick={() => onSelectPlayer(WB[0].player)}
            />
          )}

          {/* Central Defenders */}
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            {CD.map((slot, idx) => (
              <PlayerPitchBadge
                key={`cd-${idx}-${slot.player.PlayerID}`}
                player={slot.player}
                rating={slot.roleRating}
                roleLabel="CD"
                roleName="Difensore Centrale"
                onClick={() => onSelectPlayer(slot.player)}
              />
            ))}
          </div>

          {/* Right Wing Back */}
          {WB[1] && (
            <PlayerPitchBadge
              player={WB[1].player}
              rating={WB[1].roleRating}
              roleLabel="RWB"
              roleName="Terzino Destro"
              onClick={() => onSelectPlayer(WB[1].player)}
            />
          )}
        </div>

        {/* ROW 4: GOALKEEPER (GK) */}
        <div className="relative z-10 flex items-center justify-center py-2">
          {GK[0] && (
            <PlayerPitchBadge
              player={GK[0].player}
              rating={GK[0].roleRating}
              roleLabel="GK"
              roleName="Portiere"
              isGk
              onClick={() => onSelectPlayer(GK[0].player)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface PlayerPitchBadgeProps {
  player: HtPlayer;
  rating: number;
  roleLabel: string;
  roleName: string;
  isGk?: boolean;
  onClick: () => void;
}

const PlayerPitchBadge: React.FC<PlayerPitchBadgeProps> = ({
  player,
  rating,
  roleLabel,
  roleName,
  isGk = false,
  onClick,
}) => {
  const spec = HT_SPECIALTIES[player.Specialty || 0];

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col items-center transition-transform hover:scale-105 active:scale-95"
      title={`${player.FirstName} ${player.LastName} - ${roleName} (${rating} stelle)`}
    >
      {/* Jersey Icon Container */}
      <div className="relative">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center font-mono font-black text-sm sm:text-base shadow-lg transition-all ${
            isGk
              ? 'bg-amber-600 border-amber-300 text-zinc-950 group-hover:border-white shadow-amber-950/80'
              : 'bg-zinc-900 border-emerald-400 text-emerald-300 group-hover:border-white shadow-black/80'
          }`}
        >
          <span>{player.PlayerNumber}</span>
        </div>

        {/* Specialty or Injury overlay */}
        {spec && spec.label !== 'Nessuna' && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px]" title={spec.label}>
            {spec.icon}
          </div>
        )}

        {/* Rating Stars Badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-zinc-950 border border-amber-400/80 text-[10px] font-mono font-bold text-amber-300 shadow whitespace-nowrap">
          ⭐ {rating}
        </div>
      </div>

      {/* Name and Role Label */}
      <div className="mt-2.5 px-2 py-0.5 rounded-lg bg-zinc-950/90 border border-zinc-800 text-center max-w-[110px] sm:max-w-[130px] shadow-sm">
        <p className="text-[11px] sm:text-xs font-bold text-white truncate leading-tight">
          {player.LastName}
        </p>
        <p className="text-[9px] font-mono text-emerald-400 font-semibold uppercase">
          {roleLabel} &bull; TSI {Math.round(player.TSI / 1000)}k
        </p>
      </div>
    </div>
  );
};
