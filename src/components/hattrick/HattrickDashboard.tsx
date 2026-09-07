import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Trophy,
  Lock,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Activity,
  Shield,
  DollarSign,
  AlertTriangle,
  Award,
  Grid,
  List,
  Flame,
  UserCheck,
  ChevronDown,
  Database,
  Building,
  HeartPulse,
} from 'lucide-react';
import { HtPlayer, HtTeamDetails, HtStats, HtBestXI } from '../../types';
import { HtPlayerModal } from './HtPlayerModal';
import { HtPlayerDetailModal } from './HtPlayerDetailModal';
import { HtBestXIPitch } from './HtBestXIPitch';
import { HT_ROLES, HT_SPECIALTIES, HT_FORM_LEVELS, HT_DENOMINATIONS, getSkillBadgeClass } from './HtConstants';

interface HattrickDashboardProps {
  isAdmin?: boolean;
  onRefreshSystemStatus?: () => void;
}

export const HattrickDashboard: React.FC<HattrickDashboardProps> = ({
  isAdmin = true,
  onRefreshSystemStatus,
}) => {
  const [players, setPlayers] = useState<HtPlayer[]>([]);
  const [team, setTeam] = useState<HtTeamDetails | null>(null);
  const [stats, setStats] = useState<HtStats | null>(null);
  const [bestXI, setBestXI] = useState<HtBestXI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab inside Hattrick module
  const [activeTab, setActiveTab] = useState<'squad' | 'tactics' | 'club'>('squad');

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'GK' | 'CD' | 'WB' | 'IM' | 'W' | 'FW'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'injured' | 'market'>('all');
  const [sortBy, setSortBy] = useState<'tsi' | 'rating' | 'form' | 'age' | 'salary' | 'goals'>('tsi');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Tactics
  const [selectedFormation, setSelectedFormation] = useState<string>('3-5-2');
  const [loadingBestXI, setLoadingBestXI] = useState(false);

  // Modals
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<HtPlayer | null>(null);
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<HtPlayer | null>(null);

  // Fetch initial squad and team info
  const loadHattrickData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [playersRes, statsRes] = await Promise.all([
        fetch('/api/hattrick/players').then((r) => r.json()),
        fetch('/api/hattrick/stats').then((r) => r.json()),
      ]);

      if (Array.isArray(playersRes)) {
        setPlayers(playersRes);
      } else if (playersRes?.players && Array.isArray(playersRes.players)) {
        setPlayers(playersRes.players);
      }

      if (statsRes) {
        const s = statsRes.stats || statsRes;
        setStats(s);
        setTeam(s.team || null);
      }
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento del modulo Hattrick');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Best XI formation
  const loadBestXI = useCallback(async (formation: string) => {
    try {
      setLoadingBestXI(true);
      const res = await fetch(`/api/hattrick/best-xi?formation=${formation}`).then((r) => r.json());
      if (res.ok) {
        setBestXI(res);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingBestXI(false);
    }
  }, []);

  useEffect(() => {
    loadHattrickData();
  }, [loadHattrickData]);

  useEffect(() => {
    if (activeTab === 'tactics') {
      loadBestXI(selectedFormation);
    }
  }, [activeTab, selectedFormation, loadBestXI]);

  // Seed demo data
  const handleSeedDemo = async () => {
    if (!confirm('Vuoi caricare la rosa completa di esempio (18 giocatori realistici Hattrick)?')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/hattrick/seed', { method: 'POST' }).then((r) => r.json());
      if (res.ok) {
        await loadHattrickData();
        if (onRefreshSystemStatus) onRefreshSystemStatus();
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante il seeding');
    } finally {
      setLoading(false);
    }
  };

  // CRUD Player
  const handleSavePlayer = async (playerData: Partial<HtPlayer>) => {
    const isEdit = Boolean(editingPlayer);
    const url = isEdit ? `/api/hattrick/players/${editingPlayer?.PlayerID}` : '/api/hattrick/players';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData),
    }).then((r) => r.json());

    if (!res.ok) {
      throw new Error(res.error || 'Errore nel salvataggio del giocatore');
    }

    await loadHattrickData();
    if (activeTab === 'tactics') {
      loadBestXI(selectedFormation);
    }
    if (onRefreshSystemStatus) onRefreshSystemStatus();
  };

  const handleDeletePlayer = async (playerId: number) => {
    try {
      const res = await fetch(`/api/hattrick/players/${playerId}`, { method: 'DELETE' }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      setPlayers((prev) => prev.filter((p) => p.PlayerID !== playerId));
      await loadHattrickData();
      if (onRefreshSystemStatus) onRefreshSystemStatus();
    } catch (err: any) {
      alert(err.message || 'Errore eliminazione giocatore');
    }
  };

  // Filtered & Sorted Players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        // Search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = `${p.FirstName} ${p.NickName || ''} ${p.LastName}`.toLowerCase().includes(q);
          const matchNum = String(p.PlayerNumber).includes(q);
          if (!matchName && !matchNum) return false;
        }

        // Role filter
        if (roleFilter !== 'all') {
          if (p.bestRole?.code !== roleFilter) return false;
        }

        // Status filter
        if (statusFilter === 'available') {
          if (p.InjuryLevel > 0) return false;
        } else if (statusFilter === 'injured') {
          if (p.InjuryLevel <= 0) return false;
        } else if (statusFilter === 'market') {
          if (!p.TransferListed) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'tsi') return b.TSI - a.TSI;
        if (sortBy === 'rating') return (b.bestRating || 0) - (a.bestRating || 0);
        if (sortBy === 'form') return b.PlayerForm - a.PlayerForm;
        if (sortBy === 'age') return a.Age - b.Age;
        if (sortBy === 'salary') return b.Salary - a.Salary;
        if (sortBy === 'goals') return b.CareerGoals - a.CareerGoals;
        return 0;
      });
  }, [players, searchQuery, roleFilter, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* 1. Header Club & Dedicated DB Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Club Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-black text-2xl shadow-inner shrink-0">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {team?.TeamName || 'FC Firenode United'}
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  {team?.LeagueLevelUnitName || 'Serie V.12'}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-950 text-zinc-400 border border-zinc-800 flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>SQLite: data/hattrick.db</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-3 flex-wrap">
                <span>Stadio: <strong className="text-zinc-200">{team?.ArenaName || 'Firenode Arena'}</strong></span>
                <span>&bull;</span>
                <span>Tifosi: <strong className="text-zinc-200">{team?.FanclubSize?.toLocaleString() || '1,840'}</strong></span>
                <span>&bull;</span>
                <span>Ranking: <strong className="text-emerald-400">#{team?.LeagueRanking || 1}</strong> in lega</span>
              </p>
            </div>
          </div>

          {/* Module Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Automazioni attive (Sola lettura)</span>
            </div>
            <button
              onClick={loadHattrickData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition-colors"
              title="Aggiorna Dati Hattrick dal database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Sincronizza</span>
            </button>
          </div>
        </div>

        {/* Module Sub-Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-zinc-800/80 font-mono text-xs">
          <button
            onClick={() => setActiveTab('squad')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'squad'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Rosa Completa</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-950 text-zinc-300">
              {players.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tactics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'tactics'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Tattica &amp; Best XI</span>
          </button>

          <button
            onClick={() => setActiveTab('club')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'club'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Dettagli Club &amp; DB</span>
          </button>
        </div>
      </div>

      {/* 2. Team Bento Metrics Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-[11px] font-mono text-zinc-400 block">Giocatori in Rosa</span>
            <span className="text-xl font-bold text-white font-mono mt-0.5 block">{stats.totalPlayers}</span>
            <span className="text-[10px] font-mono text-emerald-400">
              GK:{stats.roleCounts?.GK || 0} DIF:{(stats.roleCounts?.CD || 0) + (stats.roleCounts?.WB || 0)} CEN:{stats.roleCounts?.IM || 0} ATT:{stats.roleCounts?.FW || 0}
            </span>
          </div>

          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-[11px] font-mono text-zinc-400 block">TSI Totale Squadra</span>
            <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
              {Math.round(stats.totalTsi / 1000)}k
            </span>
            <span className="text-[10px] font-mono text-zinc-400">Media: {stats.avgTsi.toLocaleString()}</span>
          </div>

          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-[11px] font-mono text-zinc-400 block">Monte Ingaggi</span>
            <span className="text-xl font-bold text-white font-mono mt-0.5 block">
              €{stats.totalSalary.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">a settimana</span>
          </div>

          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-[11px] font-mono text-zinc-400 block">Età Media</span>
            <span className="text-xl font-bold text-white font-mono mt-0.5 block">{stats.avgAge}</span>
            <span className="text-[10px] font-mono text-zinc-400">anni</span>
          </div>

          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-[11px] font-mono text-zinc-400 block">Infortuni / Acciacchi</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xl font-bold font-mono ${stats.injuredCount > 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                {stats.injuredCount}
              </span>
              {stats.bruisedCount > 0 && (
                <span className="text-xs font-mono text-amber-400">({stats.bruisedCount} cerotti)</span>
              )}
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {stats.transferListedCount} sul mercato
            </span>
          </div>

          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-[11px] font-mono text-zinc-400 block">Capocannoniere</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block truncate">
              {stats.topScorer ? `${stats.topScorer.LastName} (${stats.topScorer.CareerGoals})` : 'Nessuno'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              Gol totali: {stats.totalGoals}
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: SQUAD TABLE & CARDS */}
      {activeTab === 'squad' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca giocatore per nome, numero maglia..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Role filter */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 font-mono text-xs">
              {(['all', 'GK', 'CD', 'WB', 'IM', 'W', 'FW'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    roleFilter === r
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {r === 'all' ? 'Tutti i Ruoli' : r}
                </button>
              ))}
            </div>

            {/* Status Filter & Sort */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tutti gli stati</option>
                <option value="available">Solo disponibili</option>
                <option value="injured">Solo infortunati</option>
                <option value="market">Sul mercato</option>
              </select>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="tsi">Ordina: TSI</option>
                <option value="rating">Ordina: Stelle Ruolo</option>
                <option value="form">Ordina: Forma</option>
                <option value="age">Ordina: Più giovani</option>
                <option value="salary">Ordina: Stipendio</option>
                <option value="goals">Ordina: Gol Carriera</option>
              </select>

              {/* View Switch */}
              <div className="hidden sm:flex items-center p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded-lg ${viewMode === 'table' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                  title="Vista Tabellare"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1 rounded-lg ${viewMode === 'cards' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                  title="Vista Card"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Player Roster Grid / Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 font-mono text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
              <span>Caricamento rosa Hattrick dal database SQLite...</span>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl">
              <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="font-bold text-white text-base">Nessun giocatore trovato</h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Nessun giocatore corrisponde ai filtri selezionati, oppure il database è in attesa del primo popolamento automatico.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            /* Tabular View with All Hattrick Skills */
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">Nome Giocatore</th>
                      <th className="py-3 px-3">Età</th>
                      <th className="py-3 px-3">Forma</th>
                      <th className="py-3 px-3 text-right">TSI</th>
                      <th className="py-3 px-3 text-center">Miglior Ruolo</th>
                      <th className="py-3 px-2 text-center" title="Parate">PAR</th>
                      <th className="py-3 px-2 text-center" title="Difesa">DIF</th>
                      <th className="py-3 px-2 text-center" title="Regia">REG</th>
                      <th className="py-3 px-2 text-center" title="Cross">CRO</th>
                      <th className="py-3 px-2 text-center" title="Passaggi">PAS</th>
                      <th className="py-3 px-2 text-center" title="Attacco">ATT</th>
                      <th className="py-3 px-2 text-center" title="Resistenza">RES</th>
                      <th className="py-3 px-3">Spec.</th>
                      <th className="py-3 px-3 text-right">Stipendio</th>
                      <th className="py-3 px-3 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredPlayers.map((p) => {
                      const spec = HT_SPECIALTIES[p.Specialty || 0];
                      const role = p.bestRole || { code: 'IM', label: 'Centrocampista', rating: 5 };

                      return (
                        <tr
                          key={p.PlayerID}
                          onClick={() => setSelectedPlayerForDetail(p)}
                          className="hover:bg-zinc-850/60 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 font-bold text-zinc-300">
                            #{p.PlayerNumber}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[180px]">
                                {p.FirstName} {p.LastName}
                              </span>
                              {p.InjuryLevel === -1 && <span title="Acciaccato">🩹</span>}
                              {p.InjuryLevel > 0 && <span title={`Infortunato per ${p.InjuryLevel} settimane`}>🚑</span>}
                              {p.Cards > 0 && <span className="text-[10px] text-amber-400">🟨{p.Cards}</span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            {p.Age}a {p.AgeDays}g
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-zinc-300 font-semibold">{p.PlayerForm}/8</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                            {p.TSI.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${HT_ROLES[role.code]?.badgeColor || 'bg-zinc-800 text-zinc-300'}`}>
                              {role.code} ⭐ {role.rating}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-1.5 py-0.2 rounded border text-[11px] ${getSkillBadgeClass(p.KeeperSkill)}`}>
                              {p.KeeperSkill}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-1.5 py-0.2 rounded border text-[11px] ${getSkillBadgeClass(p.DefenderSkill)}`}>
                              {p.DefenderSkill}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-1.5 py-0.2 rounded border text-[11px] ${getSkillBadgeClass(p.PlaymakerSkill)}`}>
                              {p.PlaymakerSkill}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-1.5 py-0.2 rounded border text-[11px] ${getSkillBadgeClass(p.WingerSkill)}`}>
                              {p.WingerSkill}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-1.5 py-0.2 rounded border text-[11px] ${getSkillBadgeClass(p.PassingSkill)}`}>
                              {p.PassingSkill}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-1.5 py-0.2 rounded border text-[11px] ${getSkillBadgeClass(p.ScorerSkill)}`}>
                              {p.ScorerSkill}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-1.5 py-0.2 rounded border text-[11px] ${getSkillBadgeClass(p.StaminaSkill)}`}>
                              {p.StaminaSkill}
                            </span>
                          </td>
                          <td className="py-2.5 px-3" title={spec?.label}>
                            <span className="text-sm">{spec?.icon}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-zinc-300">
                            €{p.Salary.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedPlayerForDetail(p)}
                              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors"
                              title="Visualizza Scheda"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPlayers.map((p) => {
                const role = p.bestRole || { code: 'IM', label: 'Centrocampista', rating: 5 };
                const spec = HT_SPECIALTIES[p.Specialty || 0];

                return (
                  <div
                    key={p.PlayerID}
                    onClick={() => setSelectedPlayerForDetail(p)}
                    className="p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl cursor-pointer transition-all shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
                          #{p.PlayerNumber}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm truncate max-w-[160px]">
                            {p.FirstName} {p.LastName}
                          </h4>
                          <p className="text-[11px] font-mono text-zinc-400">
                            {p.Age} anni &bull; TSI {p.TSI.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${HT_ROLES[role.code]?.badgeColor || 'bg-zinc-800 text-zinc-300'}`}>
                        {role.code} ⭐ {role.rating}
                      </span>
                    </div>

                    {/* Key Skills */}
                    <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
                      <div className="p-1.5 bg-zinc-950 border border-zinc-800/80 rounded-lg">
                        <span className="text-zinc-500 block">DIF</span>
                        <span className="font-bold text-blue-400">{p.DefenderSkill}</span>
                      </div>
                      <div className="p-1.5 bg-zinc-950 border border-zinc-800/80 rounded-lg">
                        <span className="text-zinc-500 block">REG</span>
                        <span className="font-bold text-emerald-400">{p.PlaymakerSkill}</span>
                      </div>
                      <div className="p-1.5 bg-zinc-950 border border-zinc-800/80 rounded-lg">
                        <span className="text-zinc-500 block">CRO</span>
                        <span className="font-bold text-cyan-400">{p.WingerSkill}</span>
                      </div>
                      <div className="p-1.5 bg-zinc-950 border border-zinc-800/80 rounded-lg">
                        <span className="text-zinc-500 block">ATT</span>
                        <span className="font-bold text-red-400">{p.ScorerSkill}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-2 border-t border-zinc-850">
                      <span>Forma: {p.PlayerForm}/8</span>
                      <span>Spec: {spec?.icon} {spec?.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TACTICS & BEST XI PITCH */}
      {activeTab === 'tactics' && (
        <HtBestXIPitch
          bestXI={bestXI}
          loading={loadingBestXI}
          selectedFormation={selectedFormation}
          onChangeFormation={(f) => setSelectedFormation(f)}
          onSelectPlayer={(p) => setSelectedPlayerForDetail(p)}
        />
      )}

      {/* TAB 3: CLUB & DB DETAILS */}
      {activeTab === 'club' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Dati Societari Hattrick (TeamDetails)</span>
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-zinc-800">
                <span className="text-zinc-400">Nome Club:</span>
                <span className="text-white font-bold">{team?.TeamName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800">
                <span className="text-zinc-400">Nome Breve:</span>
                <span className="text-white">{team?.ShortTeamName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800">
                <span className="text-zinc-400">Nome Stadio (Arena):</span>
                <span className="text-white">{team?.ArenaName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800">
                <span className="text-zinc-400">Serie / Lega:</span>
                <span className="text-emerald-400 font-bold">{team?.LeagueLevelUnitName} (Livello {team?.LeagueLevel})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800">
                <span className="text-zinc-400">Paese &amp; Regione:</span>
                <span className="text-white">{team?.CountryName} - {team?.RegionName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800">
                <span className="text-zinc-400">Club dei Tifosi:</span>
                <span className="text-white">{team?.FanclubName} ({team?.FanclubSize?.toLocaleString()} membri)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800">
                <span className="text-zinc-400">Squadra Giovanile:</span>
                <span className="text-zinc-300">{team?.YouthTeamName || 'Firenode Primavera'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-400">Data Fondazione:</span>
                <span className="text-zinc-400">{team?.FoundedDate}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Database Locale Indipendente (SQLite)</span>
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              In ottemperanza alla specifica <span className="text-emerald-400">"(in locale sono tutti db differenti)"</span>, il modulo Hattrick è isolato nel proprio file SQLite persistente:
            </p>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Percorso File DB:</span>
                <span className="text-emerald-400 font-bold">data/hattrick.db</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Variabile d'Ambiente:</span>
                <span className="text-zinc-300">HATTRICK_DB_PATH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tabelle Native:</span>
                <span className="text-zinc-300">Player, TeamDetails, users</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Modalità WAL:</span>
                <span className="text-emerald-400">Abilitata (Journal WAL)</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300">
              💡 Tutti i backup e restore JSON della suite includono automaticamente i giocatori e le squadre Hattrick.
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <HtPlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => {
          setIsPlayerModalOpen(false);
          setEditingPlayer(null);
        }}
        onSubmit={handleSavePlayer}
        initialData={editingPlayer}
      />

      <HtPlayerDetailModal
        isOpen={Boolean(selectedPlayerForDetail)}
        player={selectedPlayerForDetail}
        onClose={() => setSelectedPlayerForDetail(null)}
        onEdit={(p) => {
          setSelectedPlayerForDetail(null);
          setEditingPlayer(p);
          setIsPlayerModalOpen(true);
        }}
        onDelete={(id) => {
          handleDeletePlayer(id);
          setSelectedPlayerForDetail(null);
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
};
