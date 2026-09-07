import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Users,
  Clock,
  Building2,
  DollarSign,
  BarChart3,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Shield,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Sliders,
  Calendar,
  Layers,
  Award,
  User,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import {
  BBPlayer,
  BBArena,
  BBEconomy,
  BBMatch,
  BBMinute,
  BBPlayerStat,
  BBDashboardData,
  BBUser,
} from '../../types';
import { api } from '../../services/api';
import {
  BB_SKILL_NAMES,
  BB_SKILL_LEVELS,
  BB_POTENTIAL_LEVELS,
  getSkillColor,
  getGameShapeStatus,
} from './BBConstants';
import { BBPlayerModal } from './BBPlayerModal';
import { BBMatchModal } from './BBMatchModal';
import { BBMinutesModal } from './BBMinutesModal';

interface BBeaterDashboardProps {
  isAdmin?: boolean;
  onRefreshSystemStatus?: () => void;
}

export const BBeaterDashboard: React.FC<BBeaterDashboardProps> = ({
  isAdmin = true,
  onRefreshSystemStatus,
}) => {
  const [subTab, setSubTab] = useState<'roster' | 'minutes' | 'matches' | 'arena' | 'economy' | 'stats'>('roster');
  const [rosterViewMode, setRosterViewMode] = useState<'table' | 'cards'>('table');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scelta Utente (tabella utenti campo user)
  const [usersList, setUsersList] = useState<BBUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('fire');

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<BBDashboardData | null>(null);

  // Modals state
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<BBPlayer | null>(null);

  const [matchModalOpen, setMatchModalOpen] = useState(false);

  const [minutesModalOpen, setMinutesModalOpen] = useState(false);
  const [selectedMinutePlayer, setSelectedMinutePlayer] = useState<BBPlayer | BBMinute | null>(null);

  // Arena interactive pricing state
  const [arenaPrices, setArenaPrices] = useState({
    price_bleachers: 15,
    price_lower_tier: 40,
    price_courtside: 120,
    price_luxury: 700,
  });
  const [savingArena, setSavingArena] = useState(false);
  const [arenaSaveSuccess, setArenaSaveSuccess] = useState(false);

  // Recupera l'elenco degli utenti dalla tabella utenti (campo user)
  const loadUsers = async () => {
    try {
      const users = await api.getBBUsers();
      setUsersList(users);
      if (users.length > 0) {
        if (!users.some((u) => u.user.toLowerCase() === selectedUser.toLowerCase())) {
          setSelectedUser(users[0].user);
        }
      }
    } catch (err) {
      console.warn('Errore nel recupero lista utenti:', err);
    }
  };

  // Load all BuzzerBeater data per l'utente scelto
  const fetchData = async (userToFetch?: string) => {
    const targetUser = userToFetch !== undefined ? userToFetch : selectedUser;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBBDashboard(targetUser);
      setDashboardData(data);
      if (data.arena) {
        setArenaPrices({
          price_bleachers: data.arena.price_bleachers ?? data.arena.bleachers_price ?? 0,
          price_lower_tier: data.arena.price_lower_tier ?? data.arena.lower_tier_price ?? 0,
          price_courtside: data.arena.price_courtside ?? data.arena.courtside_price ?? 0,
          price_luxury: data.arena.price_luxury ?? data.arena.luxury_price ?? 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante il caricamento dei dati di BuzzerBeater');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    fetchData(selectedUser);
  }, [selectedUser]);

  // Utente attualmente scelto (per sincronizzazione)
  const currentUserObj = usersList.find((u) => u.user.toLowerCase() === selectedUser.toLowerCase()) || dashboardData?.team;
  const targetUserId = currentUserObj?.id;
  const targetTeamId = currentUserObj?.teamid;

  // CRUD Handlers
  const handleSavePlayer = async (formData: Partial<BBPlayer>) => {
    const payload = {
      ...formData,
      user_id: targetUserId ?? (formData.user_id || 1),
      owner: targetTeamId ?? (formData.owner || 102934),
    };
    if (selectedPlayer && selectedPlayer.id) {
      await api.updateBBPlayer(selectedPlayer.id, payload);
    } else {
      await api.createBBPlayer(payload, selectedUser);
    }
    await fetchData(selectedUser);
    if (onRefreshSystemStatus) onRefreshSystemStatus();
  };

  const handleDeletePlayer = async (id: number, name: string) => {
    if (!window.confirm(`Sei sicuro di voler svincolare/eliminare il giocatore ${name}?`)) {
      return;
    }
    try {
      await api.deleteBBPlayer(id);
      await fetchData(selectedUser);
      if (onRefreshSystemStatus) onRefreshSystemStatus();
    } catch (err: any) {
      alert(err.message || 'Errore nella rimozione');
    }
  };

  const handleSaveMatch = async (formData: Partial<BBMatch>) => {
    await api.createBBMatch(formData);
    await fetchData(selectedUser);
    if (onRefreshSystemStatus) onRefreshSystemStatus();
  };

  const handleSaveMinutes = async (
    playerid: string,
    minutes: number,
    name?: string,
    pos?: string
  ) => {
    await api.updateBBMinutes({
      playerid,
      minuti_giocati: minutes,
      player_name: name,
      position: pos,
    });
    await fetchData(selectedUser);
  };

  const handleSaveArenaPrices = async () => {
    try {
      setSavingArena(true);
      await api.updateBBArena(arenaPrices);
      setArenaSaveSuccess(true);
      setTimeout(() => setArenaSaveSuccess(false), 3000);
      await fetchData(selectedUser);
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio prezzi arena');
    } finally {
      setSavingArena(false);
    }
  };

  // Filtered roster (SOLO giocatori dove owner E user_id = user scelto, e owner <> 0)
  const players = (dashboardData?.roster || []).filter((p) => {
    // 1. owner non nullo e diverso da 0
    const validOwner = p.owner != null && p.owner !== 0 && String(p.owner).trim() !== '0' && String(p.owner).trim() !== '';
    if (!validOwner) return false;

    // 2. user_id = user scelto
    const matchUserId = targetUserId != null
      ? (p.user_id === targetUserId || String(p.user_id) === String(selectedUser))
      : true;

    // 3. owner = user scelto (teamid o user_id o username)
    const matchOwner = (targetTeamId != null && p.owner === targetTeamId) ||
                       (targetUserId != null && p.owner === targetUserId) ||
                       String(p.owner).toLowerCase() === selectedUser.toLowerCase();

    return matchUserId && matchOwner;
  });

  const filteredPlayers = players.filter((p) => {
    const matchPos = positionFilter === 'ALL' || p.pos === positionFilter;
    const matchQuery =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pos.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPos && matchQuery;
  });

  const arena = dashboardData?.arena;
  const economy = dashboardData?.economy;
  const team = dashboardData?.team;
  const matches = dashboardData?.matches || [];
  const minutesList = dashboardData?.minutes || [];
  const statsList = dashboardData?.stats || [];

  // Calcolo totale stipendi roster
  const totalSalaries = players.reduce((sum, p) => sum + (p.salary || 0), 0);

  // Calcolo incasso previsto palazzetto
  const projectedArenaRevenue = arena
    ? arena.bleachers * arenaPrices.price_bleachers +
      arena.lower_tier * arenaPrices.price_lower_tier +
      arena.courtside * arenaPrices.price_courtside +
      arena.luxury * arenaPrices.price_luxury
    : 0;

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      {/* 0. Scelta Utente in Testa (tabella utenti campo user) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-950/70 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                  Scelta Utente
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  tabella utenti.user
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                  owner &amp; user_id = {selectedUser}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Squadra: <strong className="text-white">{currentUserObj?.nomesquadra || team?.nomesquadra || 'UTC'}</strong>
                <span className="text-zinc-500 mx-1.5">•</span>
                Team ID: <strong className="text-zinc-300">{currentUserObj?.teamid || team?.teamid || 102934}</strong>
                <span className="text-zinc-500 mx-1.5">•</span>
                Serie: <strong className="text-amber-400">{currentUserObj?.serie || team?.serie || 'Serie II.2'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <label htmlFor="bb-user-select" className="text-xs font-mono text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
              <User className="w-3.5 h-3.5 text-red-400" />
              <span>Utente:</span>
            </label>
            <div className="relative">
              <select
                id="bb-user-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="appearance-none bg-zinc-950 border border-zinc-700 hover:border-zinc-500 focus:border-red-500 text-white font-mono text-xs font-bold rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors cursor-pointer min-w-[180px]"
              >
                {usersList.length > 0 ? (
                  usersList.map((u) => (
                    <option key={u.id} value={u.user} className="bg-zinc-900 text-white">
                      {u.user} {u.nomesquadra ? `— ${u.nomesquadra}` : ''}
                    </option>
                  ))
                ) : (
                  <option value="fire">fire — UTC</option>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Header Team Bento Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-red-500">
          <Trophy className="w-64 h-64" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-950 border border-red-500/40 flex items-center justify-center text-white shadow-lg shadow-red-950/50">
              <Flame className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {currentUserObj?.nomesquadra || team?.nomesquadra || team?.nome || '§UTC'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950/60 border border-red-500/30 text-red-400">
                  {currentUserObj?.serie || team?.serie || team?.lega || 'Serie II.2'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Manager: <strong className="text-zinc-200">{selectedUser}</strong></span>
                <span>•</span>
                <span>Record: <strong className="text-emerald-400">18 - 4 (1° Posto)</strong></span>
                <span>•</span>
                <span>Stagione: <strong className="text-amber-400">65</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="bg-zinc-950/80 border border-zinc-800/80 px-3 py-2 rounded-xl">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Roster</span>
              <span className="text-sm font-bold text-white">{players.length} Atleti</span>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-800/80 px-3 py-2 rounded-xl">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Stipendi/Sett</span>
              <span className="text-sm font-bold text-red-400">${totalSalaries.toLocaleString()}</span>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-800/80 px-3 py-2 rounded-xl">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Capienza</span>
              <span className="text-sm font-bold text-cyan-400">
                {arena ? ((arena.bleachers || 0) + (arena.lower_tier || 0) + (arena.courtside || 0) + (arena.luxury || 0)).toLocaleString() : '10.365'}
              </span>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-800/80 px-3 py-2 rounded-xl">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Cassa</span>
              <span className="text-sm font-bold text-emerald-400">
                ${(economy?.saldo_attuale ?? economy?.current ?? economy?.Initial ?? 966800).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs (Bento Sub-Navigation) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-xs">
          <button
            onClick={() => setSubTab('roster')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors ${
              subTab === 'roster'
                ? 'bg-red-600 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Roster &amp; Skill ({players.length})</span>
          </button>

          <button
            onClick={() => setSubTab('minutes')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors ${
              subTab === 'minutes'
                ? 'bg-red-600 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Minuti &amp; Forma (48m)</span>
          </button>

          <button
            onClick={() => setSubTab('matches')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors ${
              subTab === 'matches'
                ? 'bg-red-600 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Partite &amp; Calendario ({matches.length})</span>
          </button>

          <button
            onClick={() => setSubTab('arena')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors ${
              subTab === 'arena'
                ? 'bg-red-600 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Palazzetto (Arena)</span>
          </button>

          <button
            onClick={() => setSubTab('economy')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors ${
              subTab === 'economy'
                ? 'bg-red-600 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Bilancio &amp; Economia</span>
          </button>

          <button
            onClick={() => setSubTab('stats')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors ${
              subTab === 'stats'
                ? 'bg-red-600 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistiche</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="Ricarica dati"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {subTab === 'roster' && (
            <button
              onClick={() => {
                setSelectedPlayer(null);
                setPlayerModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-semibold text-xs shadow-md shadow-red-950/40 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Giocatore</span>
            </button>
          )}

          {subTab === 'matches' && (
            <button
              onClick={() => setMatchModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-semibold text-xs shadow-md shadow-red-950/40 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Registra Partita</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 font-mono text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. TAB CONTENT */}

      {/* TAB: ROSTER & SKILLS */}
      {subTab === 'roster' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Pos Filters, View Switch */}
          <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cerca atleta per nome o ruolo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono w-56 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Position filters */}
              <div className="flex items-center gap-1 font-mono text-xs">
                {['ALL', 'PG', 'SG', 'SF', 'PF', 'C'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPositionFilter(pos)}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      positionFilter === pos
                        ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Owner ≠ 0 &amp; user_id = {selectedUser} ({players.length} in rosa)
              </span>

              <div className="flex items-center p-0.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono">
                <button
                  onClick={() => setRosterViewMode('table')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    rosterViewMode === 'table' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tabella Skill
                </button>
                <button
                  onClick={() => setRosterViewMode('cards')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    rosterViewMode === 'cards' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Schede Schede
                </button>
              </div>
            </div>
          </div>

          {/* TABLE VIEW */}
          {rosterViewMode === 'table' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] whitespace-nowrap">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-3">Giocatore</th>
                      <th className="py-3 px-2 text-center">Ruolo</th>
                      <th className="py-3 px-2 text-center">Età</th>
                      <th className="py-3 px-2 text-right">Stipendio</th>
                      <th className="py-3 px-2 text-right">DMI</th>
                      <th className="py-3 px-2 text-center">Min</th>
                      {/* Skill headers */}
                      <th className="py-3 px-1.5 text-center text-cyan-400" title="Tiro in sospensione">JS</th>
                      <th className="py-3 px-1.5 text-center text-cyan-400" title="Distanza tiro">JR</th>
                      <th className="py-3 px-1.5 text-center text-cyan-400" title="Difesa perimetrale">OD</th>
                      <th className="py-3 px-1.5 text-center text-cyan-400" title="Controllo palla">HA</th>
                      <th className="py-3 px-1.5 text-center text-cyan-400" title="Penetrazione">DR</th>
                      <th className="py-3 px-1.5 text-center text-cyan-400" title="Passaggio">PA</th>
                      <th className="py-3 px-1.5 text-center text-amber-400" title="Tiro da sotto">IS</th>
                      <th className="py-3 px-1.5 text-center text-amber-400" title="Difesa in area">ID</th>
                      <th className="py-3 px-1.5 text-center text-amber-400" title="Rimbalzo">RB</th>
                      <th className="py-3 px-1.5 text-center text-amber-400" title="Stoppata">SB</th>
                      <th className="py-3 px-1.5 text-center text-zinc-300" title="Resistenza">ST</th>
                      <th className="py-3 px-1.5 text-center text-zinc-300" title="Tiri liberi">FT</th>
                      <th className="py-3 px-1.5 text-center text-zinc-300" title="Esperienza">EX</th>
                      <th className="py-3 px-1.5 text-center text-emerald-400" title="Forma partita">GS</th>
                      <th className="py-3 px-2 text-center text-emerald-300">Tot</th>
                      <th className="py-3 px-3 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={22} className="text-center py-8 text-zinc-500">
                          Nessun giocatore trovato nel roster con i filtri selezionati.
                        </td>
                      </tr>
                    ) : (
                      filteredPlayers.map((player) => {
                        const skillOut = player.js + player.jr + player.od + player.ha + player.dr + player.pa;
                        const skillIn = player.ish + player.ide + player.rb + player.sb;
                        const skillTot = player.skill_tot || skillOut + skillIn + player.st + player.ft;
                        const shape = getGameShapeStatus(player.min);

                        return (
                          <tr key={player.id} className="hover:bg-zinc-850/50 transition-colors">
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-white text-xs">{player.name}</div>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                Pot: <span className="text-amber-400">{BB_POTENTIAL_LEVELS[player.potential] || player.potential}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className="px-2 py-0.5 rounded-md font-bold bg-zinc-800 text-zinc-200">
                                {player.pos}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center text-zinc-400">{player.age}</td>
                            <td className="py-2.5 px-2 text-right font-bold text-emerald-400">
                              ${(player.salary || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-2 text-right text-zinc-400">
                              {(player.dmi || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => {
                                  setSelectedMinutePlayer(player);
                                  setMinutesModalOpen(true);
                                }}
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${shape.badgeClass} hover:opacity-80 transition-opacity`}
                                title={shape.tip}
                              >
                                {player.min}m
                              </button>
                            </td>

                            {/* Skill columns */}
                            {[
                              { val: player.js, tip: 'JS' },
                              { val: player.jr, tip: 'JR' },
                              { val: player.od, tip: 'OD' },
                              { val: player.ha, tip: 'HA' },
                              { val: player.dr, tip: 'DR' },
                              { val: player.pa, tip: 'PA' },
                              { val: player.ish, tip: 'IS' },
                              { val: player.ide, tip: 'ID' },
                              { val: player.rb, tip: 'RB' },
                              { val: player.sb, tip: 'SB' },
                              { val: player.st, tip: 'ST' },
                              { val: player.ft, tip: 'FT' },
                              { val: player.ex, tip: 'EXP' },
                              { val: player.gs, tip: 'GS' },
                            ].map((s, idx) => (
                              <td key={idx} className="py-2.5 px-1 text-center">
                                <span
                                  className={`inline-block w-6 py-0.5 rounded text-[11px] font-bold border ${getSkillColor(s.val)}`}
                                  title={`${s.tip}: ${s.val} (${BB_SKILL_LEVELS[s.val] || s.val})`}
                                >
                                  {s.val}
                                </span>
                              </td>
                            ))}

                            <td className="py-2.5 px-2 text-center font-bold text-emerald-400">
                              {skillTot}
                            </td>

                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedPlayer(player);
                                    setPlayerModalOpen(true);
                                  }}
                                  className="p-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                                  title="Modifica scheda e skill"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePlayer(player.id, player.name)}
                                  className="p-1 rounded-lg bg-zinc-800 text-red-400 hover:text-red-300 hover:bg-red-950/50 transition-colors"
                                  title="Svincola o elimina"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CARDS VIEW */}
          {rosterViewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlayers.map((player) => {
                const shape = getGameShapeStatus(player.min);
                const skillOut = player.js + player.jr + player.od + player.ha + player.dr + player.pa;
                const skillIn = player.ish + player.ide + player.rb + player.sb;
                const skillTot = player.skill_tot || skillOut + skillIn + player.st + player.ft;

                return (
                  <div
                    key={player.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-md space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-red-950/60 border border-red-500/30 text-red-400">
                              {player.pos}
                            </span>
                            <h3 className="font-bold text-white text-sm">{player.name}</h3>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono mt-1">
                            {player.age} anni • {player.height}
                          </p>
                        </div>

                        <div className="text-right font-mono">
                          <div className="text-xs font-bold text-emerald-400">
                            ${(player.salary || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-zinc-500">DMI: {(player.dmi || 0).toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Potenziale & Minuti */}
                      <div className="mt-3 p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Potenziale</span>
                          <span className="text-amber-300 font-bold text-[11px]">
                            {BB_POTENTIAL_LEVELS[player.potential] || player.potential}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 block">Minuti Settimanali</span>
                          <button
                            onClick={() => {
                              setSelectedMinutePlayer(player);
                              setMinutesModalOpen(true);
                            }}
                            className={`px-2 py-0.5 rounded font-bold text-[11px] border ${shape.badgeClass}`}
                          >
                            {player.min}m
                          </button>
                        </div>
                      </div>

                      {/* Skill Pills Grid */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>Skill Esterne ({skillOut})</span>
                          <span>Skill Interne ({skillIn})</span>
                          <span>Tot: <strong className="text-emerald-400">{skillTot}</strong></span>
                        </div>

                        <div className="grid grid-cols-6 gap-1 text-center font-mono text-[10px]">
                          <div className={`p-1 rounded border ${getSkillColor(player.js)}`}>
                            <span className="text-[9px] block text-zinc-400">JS</span>
                            <strong>{player.js}</strong>
                          </div>
                          <div className={`p-1 rounded border ${getSkillColor(player.jr)}`}>
                            <span className="text-[9px] block text-zinc-400">JR</span>
                            <strong>{player.jr}</strong>
                          </div>
                          <div className={`p-1 rounded border ${getSkillColor(player.od)}`}>
                            <span className="text-[9px] block text-zinc-400">OD</span>
                            <strong>{player.od}</strong>
                          </div>
                          <div className={`p-1 rounded border ${getSkillColor(player.ha)}`}>
                            <span className="text-[9px] block text-zinc-400">HA</span>
                            <strong>{player.ha}</strong>
                          </div>
                          <div className={`p-1 rounded border ${getSkillColor(player.dr)}`}>
                            <span className="text-[9px] block text-zinc-400">DR</span>
                            <strong>{player.dr}</strong>
                          </div>
                          <div className={`p-1 rounded border ${getSkillColor(player.pa)}`}>
                            <span className="text-[9px] block text-zinc-400">PA</span>
                            <strong>{player.pa}</strong>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                          <div className={`p-1 rounded border ${getSkillColor(player.ish)}`}>
                            <span className="text-[9px] block text-zinc-400">IS</span>
                            <strong>{player.ish}</strong>
                          </div>
                          <div className={`p-1 rounded border ${getSkillColor(player.ide)}`}>
                            <span className="text-[9px] block text-zinc-400">ID</span>
                            <strong>{player.ide}</strong>
                          </div>
                          <div className={`p-1 rounded border ${getSkillColor(player.rb)}`}>
                            <span className="text-[9px] block text-zinc-400">RB</span>
                            <strong>{player.rb}</strong>
                          </div>
                          <div className={`p-1 rounded border ${getSkillColor(player.sb)}`}>
                            <span className="text-[9px] block text-zinc-400">SB</span>
                            <strong>{player.sb}</strong>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                          <div className={`p-1 rounded border ${getSkillColor(player.st)}`}>
                            <span className="text-[9px] block text-zinc-400">ST</span>
                            <strong>{player.st}</strong>
                          </div>
                          <div className={`p-1 rounded border ${getSkillColor(player.ft)}`}>
                            <span className="text-[9px] block text-zinc-400">FT</span>
                            <strong>{player.ft}</strong>
                          </div>
                          <div className={`p-1 rounded border ${getSkillColor(player.ex)}`}>
                            <span className="text-[9px] block text-zinc-400">EXP</span>
                            <strong>{player.ex}</strong>
                          </div>
                          <div className={`p-1 rounded border ${getSkillColor(player.gs)}`}>
                            <span className="text-[9px] block text-emerald-400">GS</span>
                            <strong className="text-emerald-300">{player.gs}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
                      <button
                        onClick={() => {
                          setSelectedMinutePlayer(player);
                          setMinutesModalOpen(true);
                        }}
                        className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Gestisci Minuti</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedPlayer(player);
                            setPlayerModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id, player.name)}
                          className="p-1.5 rounded-lg bg-zinc-800 text-red-400 hover:text-red-300 hover:bg-red-950/50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: MINUTI & FORMA */}
      {subTab === 'minutes' && (
        <div className="space-y-6">
          {/* Bento Rule Explanation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Regola d'Oro dei Minuti BuzzerBeater (48-75 min)</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Per massimizzare l'allenamento del giovedì ed evitare crolli di Forma (Game Shape) il venerdì
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-2">
              <div className="p-3 rounded-xl bg-zinc-950 border border-emerald-900/40 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>48 - 75 MINUTI (ZONA OTTIMALE)</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans">
                  Il giocatore riceve il 100% dell'allenamento settimanale e la Forma si stabilizza su Forte (8) o Valido (9).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-amber-900/40 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>&lt; 48 MINUTI (INSUFFICIENTE)</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans">
                  Allenamento solo parziale proporzionale ai minuti. La forma tenderà a scendere a Rispettabile o Medio.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-rose-900/40 space-y-1">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <Flame className="w-4 h-4" />
                  <span>&gt; 75 MINUTI (SOVRACCARICO)</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans">
                  Troppi minuti producono affaticamento severo. Rischio calo drastico della forma verso Debole o Scarso.
                </p>
              </div>
            </div>
          </div>

          {/* Minutes Roster Progress Bars */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
              Tracciamento Settimanale Minuti per Giocatore
            </h4>

            <div className="space-y-3">
              {players.map((player) => {
                const min = player.min || 0;
                const pct = Math.min(100, Math.round((min / 48) * 100));
                const status = getGameShapeStatus(min);

                let barColor = 'bg-amber-500';
                if (min >= 48 && min <= 75) barColor = 'bg-emerald-500';
                if (min > 75) barColor = 'bg-rose-500';

                return (
                  <div
                    key={player.id}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:w-1/3">
                      <span className="w-8 py-0.5 rounded font-mono font-bold text-center text-xs bg-zinc-800 text-zinc-300">
                        {player.pos}
                      </span>
                      <div>
                        <div className="font-bold text-white text-xs">{player.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Forma attuale: <strong className="text-zinc-300">{BB_SKILL_LEVELS[player.gs] || player.gs}</strong> ({player.gs})
                        </div>
                      </div>
                    </div>

                    {/* Progress Visualizer */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className={`font-bold ${status.color}`}>
                          {min} min {min >= 48 ? '✓' : `(mancano ${48 - min}m)`}
                        </span>
                        <span className="text-[10px] text-zinc-500">{pct}% di 48m</span>
                      </div>

                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                        {/* 48m ideal mark */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10"
                          style={{ left: '60%' }} // 48 is roughly 60% of 80 scale
                          title="Obiettivo 48 minuti"
                        />
                        <div
                          className={`h-full ${barColor} transition-all duration-300`}
                          style={{ width: `${Math.min(100, (min / 80) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="sm:w-44 flex items-center justify-end gap-2 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${status.badgeClass}`}>
                        {status.label}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedMinutePlayer(player);
                          setMinutesModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-xs transition-colors"
                      >
                        Aggiorna
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CALENDARIO & PARTITE */}
      {subTab === 'matches' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Ultime Partite &amp; Calendario</h3>
                <p className="text-xs text-zinc-400 font-mono">Campionato Serie II.2 e Coppa Italia</p>
              </div>
              <button
                onClick={() => setMatchModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-semibold text-xs shadow-md shadow-red-950/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi Risultato</span>
              </button>
            </div>

            <div className="divide-y divide-zinc-800">
              {matches.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 font-mono text-xs">
                  Nessuna partita registrata. Clicca su "Registra Partita" per aggiungere il primo match.
                </div>
              ) : (
                matches.map((match) => {
                  const isHome = match.teamHome.toLowerCase().includes('firenze');
                  const homeScore = match.risHome;
                  const awayScore = match.risAway;
                  const isWin = isHome ? homeScore > awayScore : awayScore > homeScore;

                  return (
                    <div
                      key={match.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-850/50 transition-colors font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isWin
                              ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-950/60 border border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {isWin ? 'W' : 'L'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm font-sans">{match.teamHome}</span>
                            <span className="text-zinc-500">vs</span>
                            <span className="font-bold text-white text-sm font-sans">{match.teamAway}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                            <span>{match.date}</span>
                            <span>•</span>
                            <span className="uppercase text-amber-400">{match.type}</span>
                            <span>•</span>
                            <span>Stagione {match.stagione}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Score */}
                        <div className="text-center">
                          <div className="text-lg font-black text-white">
                            {match.risHome} - {match.risAway}
                          </div>
                          <div className="text-[10px] text-zinc-500">Risultato Finale</div>
                        </div>

                        {/* Attendance */}
                        <div className="text-right border-l border-zinc-800 pl-6">
                          <div className="text-xs font-bold text-cyan-400">
                            {match.total_attendance?.toLocaleString() || 'N/D'} spettatori
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {isHome ? 'Partita in Casa (Incasso pieno)' : 'Partita in Trasferta'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: PALAZZETTO (ARENA) */}
      {subTab === 'arena' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-red-500" />
                  <span>{arena?.nome_arena || 'Palasport Campo di Marte'}</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Capienza complessiva attuale: <strong className="text-white">{arena ? ((arena.bleachers || 0) + (arena.lower_tier || 0) + (arena.courtside || 0) + (arena.luxury || 0)).toLocaleString() : '10.365'} posti</strong>
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-xl font-mono text-right">
                <span className="text-[10px] text-zinc-500 uppercase block">Incasso Previsto a Partita Sold-Out</span>
                <span className="text-base font-bold text-emerald-400">
                  ${projectedArenaRevenue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Interactive Ticket Price Adjustment Simulator */}
            <div className="pt-3 border-t border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                  Configurazione Biglietti &amp; Simulatore Incassi
                </span>
                {arenaSaveSuccess && (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Prezzi aggiornati nel database!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Bleachers */}
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">Gradinate (In Piedi)</span>
                    <span className="text-[10px] text-cyan-400 font-bold">{arena?.bleachers?.toLocaleString() || 7500} posti</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500">Prezzo Biglietto ($)</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={arenaPrices.price_bleachers}
                      onChange={(e) => setArenaPrices({ ...arenaPrices, price_bleachers: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-red-500 font-bold"
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-850">
                    Incasso max: <strong className="text-white">${((arena?.bleachers || 7500) * arenaPrices.price_bleachers).toLocaleString()}</strong>
                  </div>
                </div>

                {/* 2. Lower Tier */}
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">Posti a Sedere</span>
                    <span className="text-[10px] text-cyan-400 font-bold">{arena?.lower_tier?.toLocaleString() || 2200} posti</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500">Prezzo Biglietto ($)</label>
                    <input
                      type="number"
                      min="15"
                      max="250"
                      value={arenaPrices.price_lower_tier}
                      onChange={(e) => setArenaPrices({ ...arenaPrices, price_lower_tier: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-red-500 font-bold"
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-850">
                    Incasso max: <strong className="text-white">${((arena?.lower_tier || 2200) * arenaPrices.price_lower_tier).toLocaleString()}</strong>
                  </div>
                </div>

                {/* 3. Courtside */}
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">Bordocampo</span>
                    <span className="text-[10px] text-cyan-400 font-bold">{arena?.courtside?.toLocaleString() || 500} posti</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500">Prezzo Biglietto ($)</label>
                    <input
                      type="number"
                      min="50"
                      max="800"
                      value={arenaPrices.price_courtside}
                      onChange={(e) => setArenaPrices({ ...arenaPrices, price_courtside: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-red-500 font-bold"
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-850">
                    Incasso max: <strong className="text-white">${((arena?.courtside || 500) * arenaPrices.price_courtside).toLocaleString()}</strong>
                  </div>
                </div>

                {/* 4. Luxury Boxes */}
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">Tribune VIP (Luxury)</span>
                    <span className="text-[10px] text-cyan-400 font-bold">{arena?.luxury?.toLocaleString() || 25} box</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500">Prezzo Biglietto ($)</label>
                    <input
                      type="number"
                      min="200"
                      max="3000"
                      value={arenaPrices.price_luxury}
                      onChange={(e) => setArenaPrices({ ...arenaPrices, price_luxury: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-red-500 font-bold"
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-850">
                    Incasso max: <strong className="text-white">${((arena?.luxury || 25) * arenaPrices.price_luxury).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveArenaPrices}
                  disabled={savingArena}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {savingArena ? 'Salvataggio...' : 'Salva Nuovi Prezzi Biglietti'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ECONOMIA */}
      {subTab === 'economy' && (
        <div className="space-y-6">
          {(() => {
            const incassiPalazzetto = economy?.incassi_palazzetto ?? economy?.matchRevenue ?? 172600;
            const dirittiTv = economy?.diritti_tv ?? economy?.tvMoney ?? 85000;
            const merchandising = economy?.merchandising ?? 28400;
            const sponsor = economy?.sponsor ?? 42000;
            const stipendiStaff = economy?.stipendi_staff ?? economy?.staffSalaries ?? 34200;
            const manutenzioneArena = economy?.manutenzione_arena ?? economy?.arenaExpansion ?? 12000;
            const entrate = incassiPalazzetto + dirittiTv + merchandising + sponsor;
            const uscite = totalSalaries + stipendiStaff + manutenzioneArena;
            const net = entrate - uscite;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entrate Settimanali */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4 font-mono">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>Entrate Settimanali Stimate</span>
                    </h3>
                    <span className="text-xs font-bold text-emerald-400">
                      +${entrate.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-zinc-800">
                    <div className="flex justify-between py-2">
                      <span className="text-zinc-400">Incassi Palazzetto (Media Partite Casa)</span>
                      <span className="font-bold text-white">${incassiPalazzetto.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-zinc-400">Diritti Televisivi Nazionali</span>
                      <span className="font-bold text-white">${dirittiTv.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-zinc-400">Merchandising &amp; Store Ufficiale</span>
                      <span className="font-bold text-white">${merchandising.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-zinc-400">Contratti di Sponsorizzazione</span>
                      <span className="font-bold text-white">${sponsor.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Uscite Settimanali */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4 font-mono">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-400" />
                      <span>Uscite Settimanali Fisse</span>
                    </h3>
                    <span className="text-xs font-bold text-red-400">
                      -${uscite.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-zinc-800">
                    <div className="flex justify-between py-2">
                      <span className="text-zinc-400">Stipendi Roster Giocatori</span>
                      <span className="font-bold text-red-400">-${totalSalaries.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-zinc-400">Stipendi Staff Tecnico &amp; Medico</span>
                      <span className="font-bold text-white">-${stipendiStaff.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-zinc-400">Costi Struttura &amp; Manutenzione Arena</span>
                      <span className="font-bold text-white">-${manutenzioneArena.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-300">Utile / Perdita Netta a Settimana</span>
                    <span className={`text-sm font-black ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {net >= 0 ? `+$${net.toLocaleString()}` : `-$${Math.abs(net).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB: STATISTICHE */}
      {subTab === 'stats' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h3 className="font-bold text-white text-sm">Leader Statistici Individuali (Stagione 65)</h3>
              <p className="text-xs text-zinc-400 font-mono">Punti, Rimbalzi, Assist, Percentuali dal campo</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Giocatore</th>
                    <th className="py-3 px-2 text-center">Partite</th>
                    <th className="py-3 px-2 text-center">Min/G</th>
                    <th className="py-3 px-2 text-center text-emerald-400">PPG</th>
                    <th className="py-3 px-2 text-center text-amber-400">RPG</th>
                    <th className="py-3 px-2 text-center text-cyan-400">APG</th>
                    <th className="py-3 px-2 text-center">SPG</th>
                    <th className="py-3 px-2 text-center">BPG</th>
                    <th className="py-3 px-2 text-center">FG%</th>
                    <th className="py-3 px-2 text-center">3P%</th>
                    <th className="py-3 px-3 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {statsList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-6 text-zinc-500">
                        Nessun dato statistico presente.
                      </td>
                    </tr>
                  ) : (
                    statsList.map((st) => (
                      <tr key={st.id} className="hover:bg-zinc-850/50 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-white font-sans">{st.player_name}</td>
                        <td className="py-2.5 px-2 text-center text-zinc-400">{st.games_played}</td>
                        <td className="py-2.5 px-2 text-center text-zinc-300">{st.min_per_game}m</td>
                        <td className="py-2.5 px-2 text-center font-bold text-emerald-400">{st.pts_per_game}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-amber-400">{st.reb_per_game}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-cyan-400">{st.ast_per_game}</td>
                        <td className="py-2.5 px-2 text-center text-zinc-400">{st.stl_per_game}</td>
                        <td className="py-2.5 px-2 text-center text-zinc-400">{st.blk_per_game}</td>
                        <td className="py-2.5 px-2 text-center text-zinc-300">{st.fg_pct}%</td>
                        <td className="py-2.5 px-2 text-center text-zinc-300">{st.three_pct}%</td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-300">{st.rating} ★</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <BBPlayerModal
        isOpen={playerModalOpen}
        player={selectedPlayer}
        onClose={() => {
          setPlayerModalOpen(false);
          setSelectedPlayer(null);
        }}
        onSubmit={handleSavePlayer}
      />

      <BBMatchModal
        isOpen={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        onSubmit={handleSaveMatch}
      />

      <BBMinutesModal
        isOpen={minutesModalOpen}
        player={selectedMinutePlayer}
        onClose={() => {
          setMinutesModalOpen(false);
          setSelectedMinutePlayer(null);
        }}
        onSubmit={handleSaveMinutes}
      />
    </div>
  );
};
