import React, { useState, useEffect } from 'react';
import {
  Dribbble,
  Trophy,
  Users,
  RefreshCw,
  Shield,
  Star,
  Award,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Zap,
  Info
} from 'lucide-react';
import { BBBestLineupsResult, BBLineup, BBLineupPlayer } from '../../types';
import { api } from '../../services/api';

interface BBLineupsViewProps {
  selectedUser: string;
}

const POSITION_LABELS: Record<string, { full: string; role: string; desc: string }> = {
  PG: { full: 'Point Guard', role: 'Playmaker', desc: 'Regia, difesa perimetrale e gestione palla' },
  SG: { full: 'Shooting Guard', role: 'Guardia Tiratrice', desc: 'Tiro da fuori, tiro in sospensione e difesa' },
  SF: { full: 'Small Forward', role: 'Ala Piccola', desc: 'Tuttofare, penetrazione, tiro e difesa mista' },
  PF: { full: 'Power Forward', role: 'Ala Grande', desc: 'Tiro interno, rimbalzo e difesa in area' },
  C: { full: 'Center', role: 'Centro / Pivot', desc: 'Rimbalzi, stoppate e difesa sotto canestro' },
};

export const BBLineupsView: React.FC<BBLineupsViewProps> = ({ selectedUser }) => {
  const [data, setData] = useState<BBBestLineupsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLineupTab, setSelectedLineupTab] = useState<'first' | 'second' | 'third' | 'comparison' | 'timetogo'>('first');
  const [activePlayer, setActivePlayer] = useState<BBLineupPlayer | null>(null);

  const loadLineups = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBBLineups(selectedUser);
      setData(res);
      // Imposta il primo giocatore del miglior quintetto come attivo per la visuale tattica
      if (res.bestLineup?.players?.length > 0) {
        setActivePlayer(res.bestLineup.players[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento dei migliori quintetti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLineups();
  }, [selectedUser]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 font-mono text-xs">
        <Dribbble className="w-8 h-8 animate-spin text-orange-500 mb-3" />
        <span>Calcolo dei 3 migliori quintetti ottimali per {selectedUser}...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center font-mono">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-white font-bold text-sm mb-1">Impossibile calcolare i quintetti</h3>
        <p className="text-xs text-zinc-400 mb-4">{error || 'Nessun dato disponibile.'}</p>
        <button
          onClick={loadLineups}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  const { bestLineup, secondBestLineup, thirdBestLineup, timetogo, period, totalsSummary, totalPlayersAnalyzed } = data;

  const currentLineup: BBLineup =
    selectedLineupTab === 'first'
      ? bestLineup
      : selectedLineupTab === 'second'
      ? secondBestLineup
      : thirdBestLineup;

  const getPositionPlayer = (lineup: BBLineup, pos: 'PG' | 'SG' | 'SF' | 'PF' | 'C') => {
    return lineup.players.find((p) => p.pos === pos);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Period Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-orange-950/30 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-950/80 border border-orange-500/50 flex items-center justify-center text-orange-400 shadow-inner">
              <Dribbble className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>3 Migliori Quintetti</span>
                  <span className="text-orange-400 font-mono text-xs px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/40">
                    BuzzerBeater Optima
                  </span>
                </h2>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Settimana di gioco:</span>
                  <strong className="text-zinc-200">{period.inizio} &rarr; {period.fine}</strong>
                </span>
                <span className="text-zinc-600">&bull;</span>
                <span>Atleti analizzati: <strong className="text-orange-400">{totalPlayersAnalyzed}</strong></span>
                <span className="text-zinc-600">&bull;</span>
                <span>Utente attivo: <strong className="text-zinc-200 uppercase">{selectedUser}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLineups}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-mono text-xs transition-colors"
              title="Ricalcola e sincronizza quintetti"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-400' : ''}`} />
              <span>Ricalcola</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Bento Cards for 3 Quintetti */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1° Quintetto */}
        <div
          onClick={() => setSelectedLineupTab('first')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedLineupTab === 'first'
              ? 'bg-gradient-to-b from-amber-950/30 to-zinc-900 border-amber-500/60 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>1° Quintetto (Titolari)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
              TOP 1
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-white">
              {totalsSummary.first.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-zinc-400">Rating Totale</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 mt-2 truncate">
            {bestLineup.players.length === 5
              ? bestLineup.players.map((p) => p.pos).join(' • ')
              : 'Quintetto incompleto'}
          </p>
        </div>

        {/* 2° Quintetto */}
        <div
          onClick={() => setSelectedLineupTab('second')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedLineupTab === 'second'
              ? 'bg-gradient-to-b from-sky-950/30 to-zinc-900 border-sky-500/60 shadow-lg shadow-sky-950/30 ring-1 ring-sky-500/40'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>2° Quintetto (Panchina)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30 font-bold">
              TOP 2
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-white">
              {totalsSummary.second.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-zinc-400">Rating Totale</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 mt-2 truncate">
            {secondBestLineup.players.length === 5
              ? secondBestLineup.players.map((p) => p.pos).join(' • ')
              : 'Meno di 10 giocatori'}
          </p>
        </div>

        {/* 3° Quintetto */}
        <div
          onClick={() => setSelectedLineupTab('third')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedLineupTab === 'third'
              ? 'bg-gradient-to-b from-orange-950/30 to-zinc-900 border-orange-500/60 shadow-lg shadow-orange-950/30 ring-1 ring-orange-500/40'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>3° Quintetto (Riserve)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-500/30 font-bold">
              TOP 3
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-white">
              {totalsSummary.third.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-zinc-400">Rating Totale</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 mt-2 truncate">
            {thirdBestLineup.players.length === 5
              ? thirdBestLineup.players.map((p) => p.pos).join(' • ')
              : `${thirdBestLineup.players.length}/5 assegnati`}
          </p>
        </div>

        {/* Timetogo / Esclusi */}
        <div
          onClick={() => setSelectedLineupTab('timetogo')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedLineupTab === 'timetogo'
              ? 'bg-gradient-to-b from-red-950/30 to-zinc-900 border-red-500/60 shadow-lg shadow-red-950/30 ring-1 ring-red-500/40'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Timetogo (Esclusi)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold">
              {timetogo.length}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-zinc-300">
              {timetogo.length}
            </span>
            <span className="text-xs font-mono text-zinc-400">Fuori Quintetti</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2">
            Giocatori cedibili o riserve
          </p>
        </div>
      </div>

      {/* 3. Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 overflow-x-auto font-mono text-xs">
        <button
          onClick={() => setSelectedLineupTab('first')}
          className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            selectedLineupTab === 'first'
              ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <span>🥇 1° Quintetto</span>
          <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
            {totalsSummary.first.toFixed(2)}
          </span>
        </button>

        <button
          onClick={() => setSelectedLineupTab('second')}
          className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            selectedLineupTab === 'second'
              ? 'bg-sky-500 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <span>🥈 2° Quintetto</span>
          <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
            {totalsSummary.second.toFixed(2)}
          </span>
        </button>

        <button
          onClick={() => setSelectedLineupTab('third')}
          className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            selectedLineupTab === 'third'
              ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <span>🥉 3° Quintetto</span>
          <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
            {totalsSummary.third.toFixed(2)}
          </span>
        </button>

        <button
          onClick={() => setSelectedLineupTab('comparison')}
          className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            selectedLineupTab === 'comparison'
              ? 'bg-red-600 text-white font-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Confronto Ruoli (1° vs 2° vs 3°)</span>
        </button>

        <button
          onClick={() => setSelectedLineupTab('timetogo')}
          className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            selectedLineupTab === 'timetogo'
              ? 'bg-zinc-700 text-white font-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <span>Timetogo ({timetogo.length})</span>
        </button>
      </div>

      {/* 4. CONTENT DISPLAY */}

      {/* SINGLE LINEUP VIEW WITH TACTICAL COURT */}
      {(selectedLineupTab === 'first' || selectedLineupTab === 'second' || selectedLineupTab === 'third') && (
        <div className="space-y-6">
          {currentLineup.players.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl font-mono">
              <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <h4 className="text-white font-bold text-sm">Nessun giocatore disponibile per questo quintetto</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Servono almeno 5 giocatori per formare il quintetto successivo.
              </p>
            </div>
          ) : (
            <>
              {/* Tactical Half Court + Active Player Detail Bento */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Court Visualization (7 cols on lg) */}
                <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col">
                  <div className="flex items-center justify-between mb-3 font-mono text-xs">
                    <span className="text-zinc-300 font-bold flex items-center gap-2">
                      <Dribbble className="w-4 h-4 text-orange-500" />
                      <span>Schieramento Tattico sul Parquet</span>
                    </span>
                    <span className="text-zinc-500 text-[11px]">
                      Clicca su una posizione per i dettagli
                    </span>
                  </div>

                  {/* Half Court Stage */}
                  <div className="relative w-full aspect-[16/11] max-h-[380px] bg-gradient-to-b from-amber-950/40 via-zinc-950 to-zinc-950 border border-zinc-800 rounded-xl overflow-hidden p-4 shadow-inner flex items-center justify-center">
                    {/* Court lines SVG */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 400 280">
                      {/* Outer boundary */}
                      <rect x="10" y="10" width="380" height="260" fill="none" stroke="#f97316" strokeWidth="2" />
                      {/* 3-Point Arc */}
                      <path d="M 40 270 L 40 220 A 160 160 0 0 1 360 220 L 360 270" fill="none" stroke="#f97316" strokeWidth="2" />
                      {/* Key / Paint */}
                      <rect x="140" y="150" width="120" height="120" fill="rgba(249, 115, 22, 0.05)" stroke="#f97316" strokeWidth="2" />
                      {/* Free Throw Circle */}
                      <circle cx="200" cy="150" r="45" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4 4" />
                      {/* Basket Hoop and Board */}
                      <line x1="180" y1="260" x2="220" y2="260" stroke="#ffffff" strokeWidth="3" />
                      <circle cx="200" cy="245" r="10" fill="none" stroke="#f97316" strokeWidth="2" />
                    </svg>

                    {/* 5 Position Tokens on Court */}
                    {/* PG: Point Guard - Top of the Key */}
                    {(() => {
                      const p = getPositionPlayer(currentLineup, 'PG');
                      if (!p) return null;
                      const isSelected = activePlayer?.playerid === p.playerid;
                      return (
                        <div
                          onClick={() => setActivePlayer(p)}
                          className={`absolute top-[18%] left-1/2 -translate-x-1/2 cursor-pointer group flex flex-col items-center transition-transform ${
                            isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                          }`}
                        >
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-mono font-black text-xs shadow-lg transition-all ${
                              isSelected
                                ? 'bg-orange-500 text-zinc-950 ring-4 ring-orange-500/40 scale-110'
                                : 'bg-zinc-900 border-2 border-orange-500/70 text-white group-hover:border-orange-400'
                            }`}
                          >
                            PG
                          </div>
                          <div className="mt-1 px-2 py-0.5 bg-zinc-950/90 border border-zinc-800 rounded text-[10px] font-mono text-center shadow whitespace-nowrap">
                            <p className="font-bold text-white leading-tight">{p.nome.split(' ').pop()}</p>
                            <p className="text-orange-400 font-bold text-[9px]">{p.value.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* SG: Shooting Guard - Right Perimeter */}
                    {(() => {
                      const p = getPositionPlayer(currentLineup, 'SG');
                      if (!p) return null;
                      const isSelected = activePlayer?.playerid === p.playerid;
                      return (
                        <div
                          onClick={() => setActivePlayer(p)}
                          className={`absolute top-[32%] right-[12%] cursor-pointer group flex flex-col items-center transition-transform ${
                            isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                          }`}
                        >
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-mono font-black text-xs shadow-lg transition-all ${
                              isSelected
                                ? 'bg-orange-500 text-zinc-950 ring-4 ring-orange-500/40 scale-110'
                                : 'bg-zinc-900 border-2 border-orange-500/70 text-white group-hover:border-orange-400'
                            }`}
                          >
                            SG
                          </div>
                          <div className="mt-1 px-2 py-0.5 bg-zinc-950/90 border border-zinc-800 rounded text-[10px] font-mono text-center shadow whitespace-nowrap">
                            <p className="font-bold text-white leading-tight">{p.nome.split(' ').pop()}</p>
                            <p className="text-orange-400 font-bold text-[9px]">{p.value.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* SF: Small Forward - Left Perimeter */}
                    {(() => {
                      const p = getPositionPlayer(currentLineup, 'SF');
                      if (!p) return null;
                      const isSelected = activePlayer?.playerid === p.playerid;
                      return (
                        <div
                          onClick={() => setActivePlayer(p)}
                          className={`absolute top-[32%] left-[12%] cursor-pointer group flex flex-col items-center transition-transform ${
                            isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                          }`}
                        >
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-mono font-black text-xs shadow-lg transition-all ${
                              isSelected
                                ? 'bg-orange-500 text-zinc-950 ring-4 ring-orange-500/40 scale-110'
                                : 'bg-zinc-900 border-2 border-orange-500/70 text-white group-hover:border-orange-400'
                            }`}
                          >
                            SF
                          </div>
                          <div className="mt-1 px-2 py-0.5 bg-zinc-950/90 border border-zinc-800 rounded text-[10px] font-mono text-center shadow whitespace-nowrap">
                            <p className="font-bold text-white leading-tight">{p.nome.split(' ').pop()}</p>
                            <p className="text-orange-400 font-bold text-[9px]">{p.value.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* PF: Power Forward - Right Low/Mid Post */}
                    {(() => {
                      const p = getPositionPlayer(currentLineup, 'PF');
                      if (!p) return null;
                      const isSelected = activePlayer?.playerid === p.playerid;
                      return (
                        <div
                          onClick={() => setActivePlayer(p)}
                          className={`absolute bottom-[24%] right-[28%] cursor-pointer group flex flex-col items-center transition-transform ${
                            isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                          }`}
                        >
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-mono font-black text-xs shadow-lg transition-all ${
                              isSelected
                                ? 'bg-orange-500 text-zinc-950 ring-4 ring-orange-500/40 scale-110'
                                : 'bg-zinc-900 border-2 border-orange-500/70 text-white group-hover:border-orange-400'
                            }`}
                          >
                            PF
                          </div>
                          <div className="mt-1 px-2 py-0.5 bg-zinc-950/90 border border-zinc-800 rounded text-[10px] font-mono text-center shadow whitespace-nowrap">
                            <p className="font-bold text-white leading-tight">{p.nome.split(' ').pop()}</p>
                            <p className="text-orange-400 font-bold text-[9px]">{p.value.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* C: Center - In the Paint / Rim */}
                    {(() => {
                      const p = getPositionPlayer(currentLineup, 'C');
                      if (!p) return null;
                      const isSelected = activePlayer?.playerid === p.playerid;
                      return (
                        <div
                          onClick={() => setActivePlayer(p)}
                          className={`absolute bottom-[24%] left-[28%] cursor-pointer group flex flex-col items-center transition-transform ${
                            isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                          }`}
                        >
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-mono font-black text-xs shadow-lg transition-all ${
                              isSelected
                                ? 'bg-orange-500 text-zinc-950 ring-4 ring-orange-500/40 scale-110'
                                : 'bg-zinc-900 border-2 border-orange-500/70 text-white group-hover:border-orange-400'
                            }`}
                          >
                            C
                          </div>
                          <div className="mt-1 px-2 py-0.5 bg-zinc-950/90 border border-zinc-800 rounded text-[10px] font-mono text-center shadow whitespace-nowrap">
                            <p className="font-bold text-white leading-tight">{p.nome.split(' ').pop()}</p>
                            <p className="text-orange-400 font-bold text-[9px]">{p.value.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Selected Player Detail Card (5 cols on lg) */}
                <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  {activePlayer ? (
                    <div>
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400 block">
                            Ruolo Tattico: {activePlayer.pos}
                          </span>
                          <h3 className="text-base font-bold text-white">
                            {activePlayer.nome}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black font-mono text-orange-400">
                            {activePlayer.value.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 block">Valore Ruolo</span>
                        </div>
                      </div>

                      {/* Basic details */}
                      <div className="grid grid-cols-3 gap-2 my-4 font-mono text-xs">
                        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 block uppercase">Età</span>
                          <span className="font-bold text-zinc-200">{activePlayer.age} anni</span>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 block uppercase">Stipendio</span>
                          <span className="font-bold text-emerald-400">${(activePlayer.salary || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 block uppercase">Potenziale</span>
                          <span className="font-bold text-amber-400">{activePlayer.potential || 5}</span>
                        </div>
                      </div>

                      {/* Position Ratings Bar Breakdown */}
                      <div className="space-y-2 mt-4">
                        <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                          Rating Posizionali Calcolati
                        </span>
                        {(['PG', 'SG', 'SF', 'PF', 'C'] as const).map((posKey) => {
                          const val = activePlayer[posKey];
                          const isCurrentRole = activePlayer.pos === posKey;
                          return (
                            <div
                              key={posKey}
                              className={`p-2 rounded-xl flex items-center justify-between font-mono text-xs transition-colors ${
                                isCurrentRole
                                  ? 'bg-orange-950/60 border border-orange-500/50 text-white font-bold'
                                  : 'bg-zinc-950/60 text-zinc-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-7 text-center rounded px-1 py-0.5 text-[10px] ${
                                  isCurrentRole ? 'bg-orange-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300'
                                }`}>
                                  {posKey}
                                </span>
                                <span className="text-zinc-300 text-xs">
                                  {POSITION_LABELS[posKey]?.role}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-24 bg-zinc-800 h-2 rounded-full overflow-hidden hidden sm:block">
                                  <div
                                    className={`h-full ${isCurrentRole ? 'bg-orange-500' : 'bg-zinc-500'}`}
                                    style={{ width: `${Math.min(100, (val / 16) * 100)}%` }}
                                  />
                                </div>
                                <span className={`font-bold ${isCurrentRole ? 'text-orange-400' : 'text-zinc-300'}`}>
                                  {val.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 font-mono text-xs">
                      <Info className="w-8 h-8 mb-2 opacity-50" />
                      <span>Seleziona un giocatore per i dettagli</span>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
                    <span>Algoritmo di ottimizzazione BB</span>
                    <span className="text-zinc-400">ID Atleta: {activePlayer?.playerid}</span>
                  </div>
                </div>
              </div>

              {/* Roster Table for this Quintetto */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <span>Atleti nel {currentLineup.name}</span>
                    <span className="text-zinc-500">({currentLineup.players.length}/5)</span>
                  </h4>
                  <span className="text-xs font-mono text-orange-400 font-bold">
                    Somma Valori: {currentLineup.total.toFixed(2)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4 text-center">Ruolo</th>
                        <th className="py-3 px-4">Giocatore</th>
                        <th className="py-3 px-3 text-center">Età</th>
                        <th className="py-3 px-3 text-right">Valore Ruolo</th>
                        <th className="py-3 px-3 text-center">PG</th>
                        <th className="py-3 px-3 text-center">SG</th>
                        <th className="py-3 px-3 text-center">SF</th>
                        <th className="py-3 px-3 text-center">PF</th>
                        <th className="py-3 px-3 text-center">C</th>
                        <th className="py-3 px-4 text-right">Stipendio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {currentLineup.players.map((p) => {
                        const isSelected = activePlayer?.playerid === p.playerid;
                        return (
                          <tr
                            key={p.playerid}
                            onClick={() => setActivePlayer(p)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-orange-950/40 text-white font-semibold'
                                : 'hover:bg-zinc-800/50 text-zinc-300'
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-orange-500 text-zinc-950">
                                {p.pos}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-white block">{p.nome}</span>
                              <span className="text-[10px] text-zinc-500">ID #{p.playerid}</span>
                            </td>
                            <td className="py-3 px-3 text-center text-zinc-300">{p.age}</td>
                            <td className="py-3 px-3 text-right font-black text-orange-400 text-sm">
                              {p.value.toFixed(2)}
                            </td>
                            <td className={`py-3 px-3 text-center ${p.pos === 'PG' ? 'font-bold text-orange-400 bg-orange-950/30' : 'text-zinc-400'}`}>
                              {p.PG.toFixed(2)}
                            </td>
                            <td className={`py-3 px-3 text-center ${p.pos === 'SG' ? 'font-bold text-orange-400 bg-orange-950/30' : 'text-zinc-400'}`}>
                              {p.SG.toFixed(2)}
                            </td>
                            <td className={`py-3 px-3 text-center ${p.pos === 'SF' ? 'font-bold text-orange-400 bg-orange-950/30' : 'text-zinc-400'}`}>
                              {p.SF.toFixed(2)}
                            </td>
                            <td className={`py-3 px-3 text-center ${p.pos === 'PF' ? 'font-bold text-orange-400 bg-orange-950/30' : 'text-zinc-400'}`}>
                              {p.PF.toFixed(2)}
                            </td>
                            <td className={`py-3 px-3 text-center ${p.pos === 'C' ? 'font-bold text-orange-400 bg-orange-950/30' : 'text-zinc-400'}`}>
                              {p.C.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-400 font-mono">
                              ${(p.salary || 0).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* COMPARISON VIEW (1° vs 2° vs 3°) */}
      {selectedLineupTab === 'comparison' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span>Confronto Diretto Posizionale dei 3 Quintetti</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Analisi ruolo per ruolo tra titolari (1°), panchina (2°) e riserve (3°)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4 text-center">Ruolo</th>
                    <th className="py-3 px-4 text-amber-400">1° Quintetto (Titolare)</th>
                    <th className="py-3 px-3 text-right text-amber-400">Rating 1°</th>
                    <th className="py-3 px-4 text-sky-400">2° Quintetto (Panchina)</th>
                    <th className="py-3 px-3 text-right text-sky-400">Rating 2°</th>
                    <th className="py-3 px-4 text-orange-400">3° Quintetto (Riserva)</th>
                    <th className="py-3 px-3 text-right text-orange-400">Rating 3°</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {(['PG', 'SG', 'SF', 'PF', 'C'] as const).map((pos) => {
                    const p1 = getPositionPlayer(bestLineup, pos);
                    const p2 = getPositionPlayer(secondBestLineup, pos);
                    const p3 = getPositionPlayer(thirdBestLineup, pos);
                    return (
                      <tr key={pos} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-zinc-800 text-white border border-zinc-700">
                            {pos}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {p1 ? (
                            <div>
                              <span className="font-bold text-white block">{p1.nome}</span>
                              <span className="text-[10px] text-zinc-500">{p1.age} anni &bull; ${(p1.salary || 0).toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-amber-400 text-sm">
                          {p1 ? p1.value.toFixed(2) : '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          {p2 ? (
                            <div>
                              <span className="font-bold text-white block">{p2.nome}</span>
                              <span className="text-[10px] text-zinc-500">{p2.age} anni &bull; ${(p2.salary || 0).toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-sky-400 text-sm">
                          {p2 ? p2.value.toFixed(2) : '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          {p3 ? (
                            <div>
                              <span className="font-bold text-white block">{p3.nome}</span>
                              <span className="text-[10px] text-zinc-500">{p3.age} anni &bull; ${(p3.salary || 0).toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-orange-400 text-sm">
                          {p3 ? p3.value.toFixed(2) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-zinc-950 font-mono font-bold text-xs border-t border-zinc-800">
                  <tr>
                    <td className="py-3 px-4 text-center text-zinc-400 uppercase text-[10px]">Totale</td>
                    <td className="py-3 px-4 text-zinc-400">Somma 1° Quintetto</td>
                    <td className="py-3 px-3 text-right text-amber-400 text-sm">{totalsSummary.first.toFixed(2)}</td>
                    <td className="py-3 px-4 text-zinc-400">Somma 2° Quintetto</td>
                    <td className="py-3 px-3 text-right text-sky-400 text-sm">{totalsSummary.second.toFixed(2)}</td>
                    <td className="py-3 px-4 text-zinc-400">Somma 3° Quintetto</td>
                    <td className="py-3 px-3 text-right text-orange-400 text-sm">{totalsSummary.third.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TIMETOGO VIEW (Esclusi dai primi 3 quintetti) */}
      {selectedLineupTab === 'timetogo' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-400" />
                  <span>Giocatori Esclusi (Timetogo)</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Atleti non inclusi nei 3 migliori quintetti, candidati per cessione o mercato
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-mono font-bold">
                {timetogo.length} giocatori
              </span>
            </div>

            {timetogo.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 font-mono text-xs">
                Nessun giocatore escluso: tutti gli atleti del roster sono impiegati nei 3 quintetti.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Giocatore</th>
                      <th className="py-3 px-3 text-center">Ruolo Naturale</th>
                      <th className="py-3 px-3 text-center">Età</th>
                      <th className="py-3 px-3 text-right">Max Rating</th>
                      <th className="py-3 px-3 text-center">PG</th>
                      <th className="py-3 px-3 text-center">SG</th>
                      <th className="py-3 px-3 text-center">SF</th>
                      <th className="py-3 px-3 text-center">PF</th>
                      <th className="py-3 px-3 text-center">C</th>
                      <th className="py-3 px-4 text-right">Stipendio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {timetogo.map((p) => (
                      <tr key={p.playerid} className="hover:bg-zinc-800/50 text-zinc-300">
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">{p.nome}</span>
                          <span className="text-[10px] text-zinc-500">ID #{p.playerid}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-bold">
                            {p.originalPos || 'G'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-zinc-300">{p.age}</td>
                        <td className="py-3 px-3 text-right font-black text-amber-400 text-sm">
                          {p.value.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center text-zinc-400">{p.PG.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center text-zinc-400">{p.SG.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center text-zinc-400">{p.SF.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center text-zinc-400">{p.PF.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center text-zinc-400">{p.C.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-emerald-400 font-mono">
                          ${(p.salary || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
