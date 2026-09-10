import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { MasaCard } from './components/MasaCard';
import { MasaDetail } from './components/MasaDetail';
import { MasaModal } from './components/MasaModal';
import { EventoModal } from './components/EventoModal';
import { AuthModal } from './components/AuthModal';
import { SystemModal } from './components/SystemModal';
import { MasaStats, AuthMe, SystemStatus, Evento } from './types';
import { api } from './services/api';
import { BBeaterDashboard } from './components/bbeater/BBeaterDashboard';
import { AndaDashboard } from './components/anda/AndaDashboard';
import { HattrickDashboard } from './components/hattrick/HattrickDashboard';
import { Plus, Search, Filter, Layers, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeAppTab, setActiveAppTab] = useState<'masa' | 'bbeater' | 'anda' | 'hattrick'>('masa');
  const [masas, setMasas] = useState<MasaStats[]>([]);
  const [selectedMasaId, setSelectedMasaId] = useState<number | null>(null);
  const [auth, setAuth] = useState<AuthMe | null>(null);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtri & ricerca
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'closed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isMasaModalOpen, setIsMasaModalOpen] = useState(false);
  const [editingMasa, setEditingMasa] = useState<MasaStats | null>(null);

  const [isEventoModalOpen, setIsEventoModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [targetMasaIdForEvento, setTargetMasaIdForEvento] = useState<number | null>(null);
  const [nextNumeroForEvento, setNextNumeroForEvento] = useState<number>(1);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);

  // Caricamento dati iniziale
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [authRes, systemRes, masasRes] = await Promise.all([
        api.getAuthMe(),
        api.getSystemStatus(),
        api.getMasas(),
      ]);
      setAuth(authRes);
      setSystem(systemRes);
      setMasas(masasRes);
    } catch (err: any) {
      console.error('Errore nel caricamento dei dati:', err);
      setError(err.message || 'Errore di connessione al backend Express');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  // Seleziona o ricarica il Masa correntemente aperto
  const selectedMasa = selectedMasaId !== null ? masas.find((m) => m.id === selectedMasaId) || null : null;

  const handleRefreshCurrentMasa = async () => {
    if (!selectedMasaId) return;
    try {
      const updated = await api.getMasa(selectedMasaId);
      setMasas((prev) => prev.map((m) => (m.id === selectedMasaId ? updated : m)));
    } catch (err: any) {
      console.error(err);
    }
  };

  // CRUD Masa handlers
  const handleOpenNewMasa = () => {
    setEditingMasa(null);
    setIsMasaModalOpen(true);
  };

  const handleOpenEditMasa = (masa: MasaStats) => {
    setEditingMasa(masa);
    setIsMasaModalOpen(true);
  };

  const handleMasaSubmit = async (formData: any) => {
    if (editingMasa) {
      const updated = await api.updateMasa(editingMasa.id, formData);
      setMasas((prev) => prev.map((m) => (m.id === editingMasa.id ? updated : m)));
    } else {
      const created = await api.createMasa(formData);
      setMasas((prev) => [created, ...prev]);
      setSelectedMasaId(created.id);
    }
    await loadData();
  };

  const handleDeleteMasa = async (id: number) => {
    if (!confirm('Sei sicuro di voler cancellare questo Masaniello e tutti i suoi eventi associati?')) {
      return;
    }
    try {
      await api.deleteMasa(id);
      if (selectedMasaId === id) {
        setSelectedMasaId(null);
      }
      setMasas((prev) => prev.filter((m) => m.id !== id));
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetMasa = async (id: number) => {
    if (!confirm('Confermi il reset a zero della progressione per questo Masaniello?')) {
      return;
    }
    try {
      const res = await api.resetMasa(id);
      setMasas((prev) => prev.map((m) => (m.id === id ? res : m)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (id: number, currentActive: number) => {
    try {
      const nextActive = currentActive === 1 ? 0 : 1;
      const updated = await api.updateMasa(id, { attivo: nextActive });
      setMasas((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Eventi handlers
  const handleOpenAddEvento = (masaId: number, nextNumber: number) => {
    setTargetMasaIdForEvento(masaId);
    setNextNumeroForEvento(nextNumber);
    setEditingEvento(null);
    setIsEventoModalOpen(true);
  };

  const handleOpenEditEvento = (evento: Evento) => {
    setEditingEvento(evento);
    setTargetMasaIdForEvento(evento.masa_id);
    setIsEventoModalOpen(true);
  };

  const handleEventoSubmit = async (data: Partial<Evento>) => {
    if (editingEvento) {
      const res = await api.updateEvento(editingEvento.id, data);
      setMasas((prev) => prev.map((m) => (m.id === res.masa.id ? res.masa : m)));
    } else if (targetMasaIdForEvento) {
      await api.addEvento(targetMasaIdForEvento, data);
      const updatedMasa = await api.getMasa(targetMasaIdForEvento);
      setMasas((prev) => prev.map((m) => (m.id === targetMasaIdForEvento ? updatedMasa : m)));
    }
  };

  // Filtraggio della lista
  const filteredMasas = masas.filter((m) => {
    if (filterTab === 'active' && m.attivo !== 1) return false;
    if (filterTab === 'closed' && m.attivo === 1) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.nome.toLowerCase().includes(q) ||
        m.eventi.some((e) => (e.titolo || '').toLowerCase().includes(q))
      );
    }
    return true;
  });

  const isAdmin = auth?.isAdmin ?? false;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* App Header */}
      <Header
        auth={auth}
        system={system}
        activeAppTab={activeAppTab}
        onChangeAppTab={(tab) => {
          setActiveAppTab(tab);
          if (tab === 'bbeater') {
            setSelectedMasaId(null);
          }
        }}
        onOpenNewMasa={handleOpenNewMasa}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSystemModal={() => setIsSystemModalOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Container - Expanded Full-Width Responsive Canvas */}
      <main className="flex-1 max-w-[1850px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[420px] text-zinc-400 gap-3 font-mono">
            <RefreshCw className="w-9 h-9 animate-spin text-red-500" />
            <span className="text-sm font-medium">Connessione a Express e apertura SQLite filesystem locale...</span>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-950/40 border border-red-800 rounded-2xl text-red-300 max-w-xl mx-auto my-12 text-center space-y-4 font-mono">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="font-bold text-xl text-white font-sans">Impossibile comunicare con il backend</h3>
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={loadData}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow"
            >
              Riprova connessione
            </button>
          </div>
        ) : activeAppTab === 'bbeater' ? (
          /* View: BuzzerBeater Basketball Manager Tab */
          <BBeaterDashboard isAdmin={isAdmin} onRefreshSystemStatus={loadData} />
        ) : activeAppTab === 'anda' ? (
          /* View: AnDa Culinary & Parametric Recipes Tab */
          <AndaDashboard isAdmin={isAdmin} onRefreshSystemStatus={loadData} />
        ) : activeAppTab === 'hattrick' ? (
          /* View: Hattrick Football Manager Tab (Dedicated SQLite DB) */
          <HattrickDashboard isAdmin={isAdmin} onRefreshSystemStatus={loadData} />
        ) : selectedMasa ? (
          /* View: Singolo Masaniello Dettaglio */
          <MasaDetail
            masa={selectedMasa}
            onBack={() => setSelectedMasaId(null)}
            onRefreshMasa={handleRefreshCurrentMasa}
            onEditMasa={handleOpenEditMasa}
            onOpenAddEvento={handleOpenAddEvento}
            onOpenEditEvento={handleOpenEditEvento}
            isAdmin={isAdmin}
          />
        ) : (
          /* View: Dashboard Globale & Griglia Masaniello */
          <div className="space-y-6">
            {/* Global Bento Stats Banner */}
            <StatsBanner masas={masas} system={system} />

            {/* Filter and Search Bar in Bento container */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-sm">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 text-sm font-mono font-medium">
                <button
                  onClick={() => setFilterTab('active')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filterTab === 'active'
                      ? 'bg-red-600 text-white font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ATTIVI ({masas.filter((m) => m.attivo === 1).length})
                </button>
                <button
                  onClick={() => setFilterTab('closed')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filterTab === 'closed'
                      ? 'bg-zinc-800 text-white font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ARCHIVIATI ({masas.filter((m) => m.attivo !== 1).length})
                </button>
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filterTab === 'all'
                      ? 'bg-zinc-800 text-white font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  TUTTI ({masas.length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtra per nome o pronostico..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {/* Masaniello Grid - Expanded 4 Columns on widescreen */}
            {filteredMasas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredMasas.map((m) => (
                  <MasaCard
                    key={m.id}
                    masa={m}
                    onSelect={(selected) => setSelectedMasaId(selected.id)}
                    onEdit={handleOpenEditMasa}
                    onDelete={handleDeleteMasa}
                    onReset={handleResetMasa}
                    onToggleActive={handleToggleActive}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            ) : (
              <div className="p-16 text-center bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                  <Layers className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Nessun Masaniello trovato</h3>
                  <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1.5 font-mono">
                    {searchQuery
                      ? 'Nessun piano corrisponde ai criteri di ricerca.'
                      : 'Non hai ancora creato nessun piano Masaniello per questo filtro.'}
                  </p>
                </div>
                <button
                  onClick={handleOpenNewMasa}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs font-mono transition-colors shadow-md shadow-red-950/40"
                >
                  <Plus className="w-4 h-4" /> Crea Nuovo Piano Masaniello
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/90 text-zinc-500 text-xs font-mono py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            FireMulti &bull; Node.js Express + SQLite (better-sqlite3) &bull; PID {system?.pid || 12844}
          </div>
          <div className="flex items-center gap-3">
            <span>PORT: <strong className="text-zinc-300 font-mono">{system?.port}</strong></span>
            <span>&bull;</span>
            <span>USER: <strong className="text-red-400 font-mono">{auth?.username || 'fire'}</strong></span>
            <span>&bull;</span>
            <button
              onClick={() => setIsSystemModalOpen(true)}
              className="hover:text-zinc-300 transition-colors underline"
            >
              Systemd &amp; Nginx Config
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MasaModal
        isOpen={isMasaModalOpen}
        onClose={() => setIsMasaModalOpen(false)}
        onSubmit={handleMasaSubmit}
        initialData={editingMasa}
      />

      <EventoModal
        isOpen={isEventoModalOpen}
        onClose={() => setIsEventoModalOpen(false)}
        onSubmit={handleEventoSubmit}
        initialData={editingEvento}
        defaultNumero={nextNumeroForEvento}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        auth={auth}
        onRefreshAuth={loadData}
      />

      <SystemModal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        system={system}
        auth={auth}
        onDataImported={loadData}
      />
    </div>
  );
}
