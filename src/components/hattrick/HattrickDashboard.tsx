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
  AlertCircle,
  FileCode,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { HtPlayer, HtTeamDetails, HtStats, HtBestXI } from '../../types';
import { HtPlayerModal } from './HtPlayerModal';
import { HtPlayerDetailModal } from './HtPlayerDetailModal';
import { HtBestXIPitch } from './HtBestXIPitch';
import { HtQueryDiagnostics } from './HtQueryDiagnostics';
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
  const [dbInfo, setDbInfo] = useState<any | null>(null);
  const [inspectData, setInspectData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab inside Hattrick module
  const [activeTab, setActiveTab] = useState<'squad' | 'tactics' | 'club' | 'diagnostics'>('squad');

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

  // Fetch initial squad and team info, db metadata and queries inspection
  const loadHattrickData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [playersRes, statsRes, dbInfoRes, inspectRes] = await Promise.allSettled([
        fetch('/api/hattrick/players').then(async (r) => {
          if (!r.ok) {
            const errJson = await r.json().catch(() => ({}));
            throw new Error(errJson.error || `Errore HTTP ${r.status} caricamento giocatori`);
          }
          return r.json();
        }),
        fetch('/api/hattrick/stats').then((r) => r.json()),
        fetch('/api/hattrick/db-info').then((r) => r.json()),
        fetch('/api/hattrick/inspect').then((r) => r.json()),
      ]);

      if (dbInfoRes.status === 'fulfilled' && dbInfoRes.value) {
        setDbInfo(dbInfoRes.value);
      }

      if (inspectRes.status === 'fulfilled' && inspectRes.value) {
        setInspectData(inspectRes.value);
      }

      if (playersRes.status === 'fulfilled') {
        const val = playersRes.value;
        if (Array.isArray(val)) {
          setPlayers(val);
        } else if (val?.players && Array.isArray(val.players)) {
          setPlayers(val.players);
        } else {
          setPlayers([]);
        }
      } else {
        const errMsg = (playersRes as PromiseRejectedResult).reason?.message || 'Errore durante la query della rosa';
        setError(errMsg);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const s = statsRes.value.stats || statsRes.value;
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Club Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-black text-3xl shadow-inner shrink-0">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {team?.TeamName || 'FC Firenode United'}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  {team?.LeagueLevelUnitName || 'Serie V.12'}
                </span>
                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className="px-3 py-1 rounded-lg text-xs font-mono bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 flex items-center gap-2 transition-colors cursor-pointer"
                  title="Clicca per visualizzare file DB, tabelle e query SQL"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      dbInfo?.dbExists && (players.length > 0 || (dbInfo?.totalPlayers ?? 0) > 0)
                        ? 'bg-emerald-400 animate-pulse'
                        : dbInfo?.dbExists
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-zinc-200">
                    DB: {dbInfo?.dbFilePath ? dbInfo.dbFilePath.split('/').pop() : 'hattrick.db'}
                  </span>
                  <span className="text-xs text-zinc-400">({dbInfo?.fileSizeKB ?? 0} KB)</span>
                </button>
              </div>
              <p className="text-sm text-zinc-300 font-mono mt-1.5 flex items-center gap-3 flex-wrap">
                <span>Stadio: <strong className="text-zinc-100">{team?.ArenaName || 'Firenode Arena'}</strong></span>
                <span>&bull;</span>
                <span>Tifosi: <strong className="text-zinc-100">{team?.FanclubSize?.toLocaleString() || '1,840'}</strong></span>
                <span>&bull;</span>
                <span>Ranking: <strong className="text-emerald-400 font-bold">#{team?.LeagueRanking || 1}</strong> in lega</span>
                <span>&bull;</span>
                <span className="text-zinc-400">File: <code className="text-zinc-200 font-bold">{dbInfo?.dbFilePath || 'data/hattrick.db'}</code></span>
              </p>
            </div>
          </div>

          {/* Module Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab('diagnostics')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-sm font-mono font-medium transition-colors"
              title="Ispeziona le query SQL e lo stato del database"
            >
              <FileCode className="w-4 h-4 text-purple-400" />
              <span>Query &amp; Diagnostica DB</span>
            </button>

            <button
              onClick={loadHattrickData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white text-sm font-mono font-medium transition-colors shadow-sm"
              title="Aggiorna Dati Hattrick dal database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Sincronizza</span>
            </button>
          </div>
        </div>

        {/* Module Sub-Tabs */}
        <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-zinc-800/80 font-mono text-sm overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('squad')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'squad'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Rosa Completa</span>
            <span className="px-2 py-0.5 rounded text-xs bg-zinc-950 text-zinc-300 font-bold">
              {players.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tactics')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'tactics'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Tattica &amp; Best XI</span>
          </button>

          <button
            onClick={() => setActiveTab('club')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'club'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Dettagli Club &amp; DB</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Database className="w-4 h-4 text-purple-400" />
            <span>🔍 Query &amp; Diagnostica DB</span>
          </button>
        </div>
      </div>

      {/* Prominent Error Banner if Present */}
      {error && (
        <div className="p-5 bg-red-950/60 border border-red-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-red-200 text-sm font-mono">
          <div className="flex items-center gap-3.5">
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <span className="font-bold text-red-300 block text-base">Avviso Connessione / Query Hattrick:</span>
              <span>{error}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('diagnostics')}
              className="px-4 py-2 bg-red-900/60 hover:bg-red-800 text-white rounded-xl transition-colors shrink-0 font-medium"
            >
              Visualizza Diagnostica DB
            </button>
            <button
              onClick={loadHattrickData}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl transition-colors shrink-0 font-medium"
            >
              Riprova
            </button>
          </div>
        </div>
      )}

      {/* 2. Team Bento Metrics Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-xs font-mono text-zinc-400 block font-bold uppercase tracking-wider">Giocatori in Rosa</span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 block">{stats.totalPlayers}</span>
            <span className="text-xs font-mono text-emerald-400 mt-1 block">
              GK:{stats.roleCounts?.GK || 0} DIF:{(stats.roleCounts?.CD || 0) + (stats.roleCounts?.WB || 0)} CEN:{stats.roleCounts?.IM || 0} ATT:{stats.roleCounts?.FW || 0}
            </span>
          </div>

          <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-xs font-mono text-zinc-400 block font-bold uppercase tracking-wider">TSI Totale Squadra</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1 block">
              {Math.round(stats.totalTsi / 1000)}k
            </span>
            <span className="text-xs font-mono text-zinc-400 mt-1 block">Media: {stats.avgTsi.toLocaleString()}</span>
          </div>

          <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-xs font-mono text-zinc-400 block font-bold uppercase tracking-wider">Monte Ingaggi</span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 block">
              €{stats.totalSalary.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-zinc-400 mt-1 block">a settimana</span>
          </div>

          <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-xs font-mono text-zinc-400 block font-bold uppercase tracking-wider">Età Media</span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 block">{stats.avgAge}</span>
            <span className="text-xs font-mono text-zinc-400 mt-1 block">anni</span>
          </div>

          <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-xs font-mono text-zinc-400 block font-bold uppercase tracking-wider">Infortuni / Acciacchi</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-2xl sm:text-3xl font-black font-mono ${stats.injuredCount > 0 ? 'text-red-400' : 'text-zinc-200'}`}>
                {stats.injuredCount}
              </span>
              {stats.bruisedCount > 0 && (
                <span className="text-xs font-mono text-amber-400">({stats.bruisedCount} cerotti)</span>
              )}
            </div>
            <span className="text-xs font-mono text-zinc-400 mt-1 block">
              {stats.transferListedCount} sul mercato
            </span>
          </div>

          <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-xs font-mono text-zinc-400 block font-bold uppercase tracking-wider">Capocannoniere</span>
            <span className="text-base font-bold text-white font-mono mt-1 block truncate">
              {stats.topScorer ? `${stats.topScorer.LastName} (${stats.topScorer.CareerGoals})` : 'Nessuno'}
            </span>
            <span className="text-xs font-mono text-emerald-400 mt-1 block">
              Gol totali: {stats.totalGoals}
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: SQUAD TABLE & CARDS */}
      {activeTab === 'squad' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca giocatore per nome, numero maglia..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Role filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 font-mono text-sm">
              {(['all', 'GK', 'CD', 'WB', 'IM', 'W', 'FW'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap font-medium ${
                    roleFilter === r
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-zinc-300 hover:text-white bg-zinc-950 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {r === 'all' ? 'Tutti i Ruoli' : r}
                </button>
              ))}
            </div>

            {/* Status Filter & Sort */}
            <div className="flex items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-emerald-500 font-medium"
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
            players.length === 0 ? (
              /* Informative Database Diagnostic Empty State */
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400 shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-base">
                      Nessun Giocatore Trovato nel Database Attivo
                    </h3>
                    <p className="text-xs text-zinc-300 font-mono">
                      La connessione al database SQLite è attiva, ma la tabella giocatori non restituisce record.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">File SQLite Attivo:</span>
                    <span className="text-emerald-300 font-bold break-all">
                      {dbInfo?.dbFilePath || 'data/hattrick.db'}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      (Sorgente: {dbInfo?.envVarUsed || 'DEFAULT'})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Dimensione File su Disco:</span>
                    <span className="text-white font-bold">{dbInfo?.fileSizeKB ?? 0} KB</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Stato file: {dbInfo?.dbExists ? 'Trovato' : 'Non Trovato'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Tabelle SQLite Rilevate:</span>
                    <span className="text-white font-bold">
                      {dbInfo?.tables && dbInfo.tables.length > 0 ? dbInfo.tables.join(', ') : 'Nessuna tabella'}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Righe Player: {dbInfo?.tableCounts?.[dbInfo?.detectedTables?.playerTable || 'Player'] ?? 0}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-xs font-mono text-zinc-300 space-y-2">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Cosa sta succedendo e come risolvere:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                    <li>
                      Se stai collegando il bot locale FireHt (es. con <code>FIREHT_DB_PATH=/home/fire/bots/FireHt/fireht.db</code>): verifica che il bot abbia completato il ciclo di download CHPP e che la tabella <code>{dbInfo?.detectedTables?.playerTable || 'Player'}</code> sia stata popolata.
                    </li>
                    <li>
                      Puoi ispezionare le tabelle, visualizzare le query SQL esatte o eseguire comandi SQL nella scheda <strong className="text-purple-300">🔍 Query &amp; Diagnostica DB</strong>.
                    </li>
                    <li>
                      Se vuoi visualizzare l'interfaccia con 18 giocatori completi (statistiche Hattrick, stipendi, stelle Best XI, tattica 3-5-2), puoi caricare la rosa di prova con un click.
                    </li>
                  </ul>
                </div>

                <div className="flex items-center gap-3 flex-wrap pt-2">
                  <button
                    onClick={() => setActiveTab('diagnostics')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs rounded-xl transition-colors shadow"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Ispeziona Query &amp; Tabelle DB</span>
                  </button>

                  <button
                    onClick={handleSeedDemo}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl transition-colors shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Carica 18 Giocatori di Prova (Demo)</span>
                  </button>

                  <button
                    onClick={loadHattrickData}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ricarica dal Database</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Search Filter returned 0 */
              <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl">
                <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="font-bold text-white text-base">Nessun giocatore corrisponde ai filtri</h3>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  Nessun giocatore corrisponde ai criteri di ricerca impostati (ruolo, ricerca testo o disponibilità).
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                  className="mt-4 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded-xl transition-colors"
                >
                  Azzera Tutti i Filtri
                </button>
              </div>
            )
          ) : viewMode === 'table' ? (
            /* Tabular View with All Hattrick Skills */
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-sm">
                  <thead className="bg-zinc-950 text-zinc-300 border-b border-zinc-800 uppercase text-xs">
                    <tr>
                      <th className="py-3.5 px-3.5">#</th>
                      <th className="py-3.5 px-3.5">Nome Giocatore</th>
                      <th className="py-3.5 px-3">Età</th>
                      <th className="py-3.5 px-3">Forma</th>
                      <th className="py-3.5 px-3.5 text-right">TSI</th>
                      <th className="py-3.5 px-3 text-center">Miglior Ruolo</th>
                      <th className="py-3.5 px-2.5 text-center" title="Parate">PAR</th>
                      <th className="py-3.5 px-2.5 text-center" title="Difesa">DIF</th>
                      <th className="py-3.5 px-2.5 text-center" title="Regia">REG</th>
                      <th className="py-3.5 px-2.5 text-center" title="Cross">CRO</th>
                      <th className="py-3.5 px-2.5 text-center" title="Passaggi">PAS</th>
                      <th className="py-3.5 px-2.5 text-center" title="Attacco">ATT</th>
                      <th className="py-3.5 px-2.5 text-center" title="Resistenza">RES</th>
                      <th className="py-3.5 px-3">Spec.</th>
                      <th className="py-3.5 px-3.5 text-right">Stipendio</th>
                      <th className="py-3.5 px-3.5 text-right">Azioni</th>
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
                          className="hover:bg-zinc-850/70 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-3.5 font-bold text-zinc-200">
                            #{p.PlayerNumber}
                          </td>
                          <td className="py-3 px-3.5 font-sans">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-base truncate max-w-[160px] sm:max-w-[220px]">
                                {p.FirstName} {p.LastName}
                              </span>
                              {p.InjuryLevel === -1 && <span title="Acciaccato" className="text-base">🩹</span>}
                              {p.InjuryLevel > 0 && <span title={`Infortunato per ${p.InjuryLevel} settimane`} className="text-base">🚑</span>}
                              {p.Cards > 0 && <span className="text-xs text-amber-400 font-mono">🟨{p.Cards}</span>}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-zinc-300">
                            {p.Age}a {p.AgeDays}g
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-zinc-200 font-bold">{p.PlayerForm}/8</span>
                          </td>
                          <td className="py-3 px-3.5 text-right text-emerald-400 font-extrabold text-base">
                            {p.TSI.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${HT_ROLES[role.code]?.badgeColor || 'bg-zinc-800 text-zinc-300'}`}>
                              {role.code} ⭐ {role.rating}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${getSkillBadgeClass(p.KeeperSkill)}`}>
                              {p.KeeperSkill}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${getSkillBadgeClass(p.DefenderSkill)}`}>
                              {p.DefenderSkill}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${getSkillBadgeClass(p.PlaymakerSkill)}`}>
                              {p.PlaymakerSkill}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${getSkillBadgeClass(p.WingerSkill)}`}>
                              {p.WingerSkill}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${getSkillBadgeClass(p.PassingSkill)}`}>
                              {p.PassingSkill}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${getSkillBadgeClass(p.ScorerSkill)}`}>
                              {p.ScorerSkill}
                            </span>
                          </td>
                          <td className="py-3 px-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${getSkillBadgeClass(p.StaminaSkill)}`}>
                              {p.StaminaSkill}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center" title={spec?.label}>
                            <span className="text-base">{spec?.icon || '—'}</span>
                          </td>
                          <td className="py-3 px-3.5 text-right text-zinc-200 font-semibold">
                            €{p.Salary.toLocaleString()}
                          </td>
                          <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedPlayerForDetail(p)}
                              className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors"
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
                    className="p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-750 rounded-2xl cursor-pointer transition-all shadow-sm space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 font-mono font-bold text-base">
                          #{p.PlayerNumber}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base truncate max-w-[180px]">
                            {p.FirstName} {p.LastName}
                          </h4>
                          <p className="text-xs font-mono text-zinc-400 mt-0.5">
                            {p.Age} anni &bull; TSI {p.TSI.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${HT_ROLES[role.code]?.badgeColor || 'bg-zinc-800 text-zinc-300'}`}>
                        {role.code} ⭐ {role.rating}
                      </span>
                    </div>

                    {/* Key Skills */}
                    <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                      <div className="p-2 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                        <span className="text-zinc-500 block text-[11px]">DIF</span>
                        <span className="font-bold text-blue-400 text-sm">{p.DefenderSkill}</span>
                      </div>
                      <div className="p-2 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                        <span className="text-zinc-500 block text-[11px]">REG</span>
                        <span className="font-bold text-emerald-400 text-sm">{p.PlaymakerSkill}</span>
                      </div>
                      <div className="p-2 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                        <span className="text-zinc-500 block text-[11px]">CRO</span>
                        <span className="font-bold text-cyan-400 text-sm">{p.WingerSkill}</span>
                      </div>
                      <div className="p-2 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                        <span className="text-zinc-500 block text-[11px]">ATT</span>
                        <span className="font-bold text-red-400 text-sm">{p.ScorerSkill}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-zinc-300 pt-2.5 border-t border-zinc-800">
                      <span>Forma: <strong className="text-white">{p.PlayerForm}/8</strong></span>
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
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Database Locale Indipendente (SQLite)</span>
              </h3>
              <button
                onClick={() => setActiveTab('diagnostics')}
                className="text-xs font-mono text-purple-400 hover:text-purple-300 underline"
              >
                Apri Query &amp; Diagnostica &rarr;
              </button>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              In ottemperanza alla specifica <span className="text-emerald-400">"(in locale sono tutti db differenti)"</span>, il modulo Hattrick è isolato nel proprio file SQLite persistente:
            </p>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Percorso File DB:</span>
                <span className="text-emerald-400 font-bold break-all">{dbInfo?.dbFilePath || 'data/hattrick.db'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Variabile d'Ambiente:</span>
                <span className="text-zinc-300 font-bold">{dbInfo?.envVarUsed || 'FIREHT_DB_PATH'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Dimensione File:</span>
                <span className="text-white">{dbInfo?.fileSizeKB ?? 0} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tabelle Rilevate:</span>
                <span className="text-zinc-300">{dbInfo?.tables?.join(', ') || 'Player, TeamDetails, users'}</span>
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

      {/* TAB 4: QUERY & DB DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <HtQueryDiagnostics
          dbInfo={dbInfo}
          inspectData={inspectData}
          onRefresh={loadHattrickData}
          onLoadDemo={handleSeedDemo}
        />
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
