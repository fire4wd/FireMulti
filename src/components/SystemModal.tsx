import React, { useState, useRef } from 'react';
import {
  X,
  Server,
  Database,
  Terminal,
  Download,
  Upload,
  Check,
  Copy,
  AlertTriangle,
  Cpu,
  Clock,
  HardDrive
} from 'lucide-react';
import { SystemStatus, AuthMe } from '../types';
import { api } from '../services/api';

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: SystemStatus | null;
  auth: AuthMe | null;
  onDataImported: () => Promise<void>;
}

export const SystemModal: React.FC<SystemModalProps> = ({
  isOpen,
  onClose,
  system,
  auth,
  onDataImported,
}) => {
  const [copiedService, setCopiedService] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const systemdSnippet = `[Unit]
Description=Masa Manager (Node.js Express + SQLite)
After=network.target

[Service]
Type=simple
User=fire
WorkingDirectory=/home/fire/bots/masa
# Porta dinamica assegnata tra 4000 e 4010 da systemd
Environment="PORT=4002"
Environment="DATABASE_PATH=/home/fire/bots/masa/data/app.db"
Environment="DEFAULT_USER=fire"
ExecStart=/usr/bin/node dist/server.cjs
Restart=on-failure
KillSignal=SIGTERM
TimeoutStopSec=10

[Install]
WantedBy=multi-user.target`;

  const copyService = () => {
    navigator.clipboard.writeText(systemdSnippet);
    setCopiedService(true);
    setTimeout(() => setCopiedService(false), 2000);
  };

  const handleExportBackup = async () => {
    try {
      const data = await api.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `masa_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Errore export');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportStatus(null);
      const text = await file.text();
      const json = JSON.parse(text);

      if (!json.masas) {
        throw new Error('Formato backup non valido (manca array "masas")');
      }

      await api.importBackup({
        masas: json.masas,
        eventi: json.eventi || [],
        overwrite: false,
      });

      setImportStatus('Backup importato con successo!');
      await onDataImported();
    } catch (err: any) {
      setImportStatus(`Errore importazione: ${err.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-900/30 border border-red-500/40 text-red-500">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-sans">
                Stato Sistema VPS &amp; Database SQLite
              </h3>
              <p className="text-xs text-zinc-400 font-mono">Deploy Systemd, Porta Dinamica &amp; Graceful Shutdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-zinc-300 text-xs">
          {/* SQLite Filesystem Status (Multi-DB Architecture) */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-white font-mono">
                <Database className="w-4 h-4 text-amber-400" />
                <span>DATABASE SQLITE LOCALI INDIPENDENTI (better-sqlite3)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-emerald-400 font-mono">
                WAL Mode &amp; 4 DB Separati
              </span>
            </div>

            {/* Individual DB Cards */}
            {system?.databases ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
                    <span className="text-red-400 font-bold">1. Masaniello (Core)</span>
                    <span>{system.databases.masaniello.sizeKB} KB</span>
                  </div>
                  <div className="text-white font-mono text-xs mt-1 truncate">
                    {system.databases.masaniello.path}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {system.databases.masaniello.totalMasa} Masa &bull; {system.databases.masaniello.totalEventi} Eventi
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
                    <span className="text-amber-400 font-bold">2. BuzzerBeater</span>
                    <span>{system.databases.bbeater.sizeKB} KB</span>
                  </div>
                  <div className="text-white font-mono text-xs mt-1 truncate">
                    {system.databases.bbeater.path}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {system.databases.bbeater.totalGiocatori} Giocatori &bull; {system.databases.bbeater.totalPartite} Partite
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
                    <span className="text-orange-400 font-bold">3. AnDa Culinary</span>
                    <span>{system.databases.anda.sizeKB} KB</span>
                  </div>
                  <div className="text-white font-mono text-xs mt-1 truncate">
                    {system.databases.anda.path}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {system.databases.anda.totalRecipes} Ricette Parametriche
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
                    <span className="text-emerald-400 font-bold">4. Hattrick Manager</span>
                    <span>{system.databases.hattrick?.sizeKB || 0} KB</span>
                  </div>
                  <div className="text-white font-mono text-xs mt-1 truncate">
                    {system.databases.hattrick?.path || 'data/hattrick.db'}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {system.databases.hattrick?.totalPlayers || system.totalHtPlayers || 0} Giocatori &bull; {system.databases.hattrick?.totalTeams || 1} Squadra
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-mono">
                    Percorso Filesystem Linux
                  </span>
                  <span className="text-amber-300 font-mono text-xs break-all">
                    {system?.dbPath}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-mono">
                    Dimensione su Disco
                  </span>
                  <span className="text-white font-mono text-xs font-bold">
                    {system?.dbSizeKB || 0} KB ({system?.dbSizeBytes || 0} bytes)
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center pt-2 border-t border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-500 block font-mono">MASANIELLO</span>
                <strong className="text-white font-mono text-sm">{system?.totalMasa || 0}</strong>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block font-mono">MASA ATTIVI</span>
                <strong className="text-red-400 font-mono text-sm">{system?.activeMasa || 0}</strong>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block font-mono">EVENTI</span>
                <strong className="text-zinc-300 font-mono text-sm">{system?.totalEventi || 0}</strong>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block font-mono">GIOCATORI BB</span>
                <strong className="text-cyan-400 font-mono text-sm">{system?.totalGiocatori || 0}</strong>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block font-mono">GIOCATORI HT</span>
                <strong className="text-emerald-400 font-mono text-sm">{system?.totalHtPlayers || 0}</strong>
              </div>
            </div>
          </div>

          {/* Node.js Runtime & Dynamic Port Card */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-semibold text-white font-mono">
                <Cpu className="w-4 h-4 text-red-400" />
                <span>PORTA DINAMICA &amp; RUNTIME EXPRESS</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                PID: {system?.pid} &bull; Node {system?.nodeVersion}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-zinc-500 block text-[10px] font-mono">PORTA ATTIVA:</span>
                <strong className="text-white font-mono text-sm">{system?.port}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] font-mono">VARIABILE PORT:</span>
                <span className="text-red-400 font-mono text-xs font-bold">{system?.envPortVar}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] font-mono">UPTIME:</span>
                <span className="text-zinc-200 font-mono text-xs">
                  {Math.floor((system?.uptimeSeconds || 0) / 60)} min
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] font-mono">RAM RSS:</span>
                <span className="text-zinc-200 font-mono text-xs">{system?.memoryUsageMB} MB</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-red-950/20 border border-red-900/40 text-[11px] text-red-300 font-mono flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-red-400" />
              <span>
                <strong>Graceful Shutdown attivo:</strong> ascolta i segnali SIGTERM e SIGINT con <code className="text-white">server.close()</code> per rilasciare immediatamente il socket TCP ad ogni riavvio di systemd.
              </span>
            </div>
          </div>

          {/* Backup & Restore Tools */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 font-mono">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-zinc-400" />
              <span>Backup &amp; Ripristino Dati</span>
            </div>
            <p className="text-zinc-400 text-xs font-sans">
              Esporta lo stato completo di tutte le tabelle SQLite in formato JSON o importa un backup precedente.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Scarica Backup JSON</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium shadow-md shadow-red-950/40 transition-colors disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{importing ? 'Importazione...' : 'Ripristina da File JSON'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {importStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs font-mono ${
                  importStatus.startsWith('Errore')
                    ? 'bg-red-950/50 text-red-300 border border-red-800'
                    : 'bg-zinc-900 text-emerald-400 border border-zinc-800'
                }`}
              >
                {importStatus}
              </div>
            )}
          </div>

          {/* Systemd Service Unit Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white flex items-center gap-1.5 font-mono">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span>File Unit Systemd (/etc/systemd/system/masa.service)</span>
              </div>
              <button
                onClick={copyService}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white font-mono"
              >
                {copiedService ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedService ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>
            <pre className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
              {systemdSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-semibold transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
