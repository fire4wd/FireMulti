import React, { useState } from 'react';
import {
  Database,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Table,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  FolderOpen,
  HardDrive,
  Link2,
  Folder
} from 'lucide-react';

interface HtQueryDiagnosticsProps {
  dbInfo: {
    dbFilePath: string;
    resolvedPath?: string;
    dbExists: boolean;
    fileSizeKB: number;
    fileSizeBytes?: number;
    fileMtime?: string;
    envVarUsed: string;
    sqliteVersion?: string;
    walFile?: {
      exists: boolean;
      path: string;
      sizeKB: number;
    };
    shmFile?: {
      exists: boolean;
      path: string;
    };
    detectedTables: {
      playerTable: string;
      teamTable: string;
      userTable: string;
    };
    totalPlayers: number;
    totalTeams: number;
    totalUsers: number;
    tables: string[];
    tableCounts: Record<string, number>;
    siblings?: {
      dir: string;
      exists: boolean;
      files: Array<{ name: string; isDirectory: boolean; sizeKB: number }>;
    };
    candidates?: Array<{
      path: string;
      sizeKB: number;
      tableCount: number;
      playersCount: number;
      tables: string[];
      isCurrent: boolean;
    }>;
  } | null;
  inspectData: {
    tables: Array<{
      name: string;
      count: number;
      columns: Array<{ cid: number; name: string; type: string; notnull: number; dflt_value: any; pk: number }>;
      sampleRows: any[];
    }>;
    queries: Array<{
      name: string;
      endpoint: string;
      sql: string;
      purpose: string;
      targetTable: string;
    }>;
  } | null;
  onRefresh: () => void;
  onLoadDemo?: () => void;
}

export const HtQueryDiagnostics: React.FC<HtQueryDiagnosticsProps> = ({
  dbInfo,
  inspectData,
  onRefresh,
  onLoadDemo
}) => {
  const [copiedQueryIndex, setCopiedQueryIndex] = useState<number | null>(null);
  const [copiedPath, setCopiedPath] = useState(false);

  // Switch Database in Real-Time
  const [customPathInput, setCustomPathInput] = useState(dbInfo?.dbFilePath || '/home/fire/bots/FireHt/fireht.db');
  const [switchingPath, setSwitchingPath] = useState(false);
  const [switchFeedback, setSwitchFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // WAL Checkpoint State
  const [checkpointing, setCheckpointing] = useState(false);
  const [checkpointFeedback, setCheckpointFeedback] = useState<string | null>(null);

  // Interactive Query Runner State
  const defaultQuery = dbInfo?.detectedTables?.playerTable
    ? `SELECT * FROM "${dbInfo.detectedTables.playerTable}" LIMIT 5;`
    : `SELECT name FROM sqlite_master WHERE type='table';`;

  const [sqlInput, setSqlInput] = useState(defaultQuery);
  const [runningQuery, setRunningQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    ok: boolean;
    sql?: string;
    count?: number;
    durationMs?: number;
    columns?: string[];
    rows?: any[];
    error?: string;
    activeDbPath?: string;
    sqliteFileAttached?: string;
  } | null>(null);

  const handleCopy = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (typeof index === 'number') {
      setCopiedQueryIndex(index);
      setTimeout(() => setCopiedQueryIndex(null), 2000);
    } else {
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    }
  };

  const executeSql = async (sqlToRun?: string) => {
    const queryToExecute = sqlToRun || sqlInput;
    if (!queryToExecute.trim()) return;

    try {
      setRunningQuery(true);
      setQueryResult(null);

      const res = await fetch('/api/hattrick/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: queryToExecute.trim() }),
      });

      const data = await res.json();
      setQueryResult(data);
    } catch (err: any) {
      setQueryResult({
        ok: false,
        error: err.message || 'Errore durante la chiamata API di query',
      });
    } finally {
      setRunningQuery(false);
    }
  };

  const handleSwitchDb = async (targetPath?: string) => {
    const pathToUse = targetPath || customPathInput;
    if (!pathToUse.trim()) return;

    try {
      setSwitchingPath(true);
      setSwitchFeedback(null);

      const res = await fetch('/api/hattrick/switch-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPath: pathToUse.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSwitchFeedback({
          ok: true,
          message: `${data.message} (Trovati ${data.playersCount} giocatori, tabella: "${data.playerTable}")`
        });
        setCustomPathInput(data.activeDbPath);
        onRefresh();
      } else {
        setSwitchFeedback({
          ok: false,
          message: data.error || 'Impossibile connettere il percorso specificato'
        });
      }
    } catch (err: any) {
      setSwitchFeedback({
        ok: false,
        message: err.message || 'Errore di connessione API'
      });
    } finally {
      setSwitchingPath(false);
    }
  };

  const handleRunCheckpoint = async () => {
    try {
      setCheckpointing(true);
      setCheckpointFeedback(null);

      const res = await fetch('/api/hattrick/checkpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setCheckpointFeedback(`Checkpoint WAL completato: ${data.playersCount} giocatori rilevati nella tabella "${data.playerTable}"`);
        onRefresh();
      } else {
        setCheckpointFeedback(`Errore checkpoint: ${data.error || 'Impossibile completare il checkpoint'}`);
      }
    } catch (err: any) {
      setCheckpointFeedback(`Errore di rete: ${err.message}`);
    } finally {
      setCheckpointing(false);
    }
  };

  const quickQueries = [
    {
      label: 'Tabelle nel DB',
      sql: `SELECT name, type FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`,
    },
    {
      label: 'File SQLite e PRAGMA database_list',
      sql: `PRAGMA database_list;`,
    },
    {
      label: `Struttura Tabella "${dbInfo?.detectedTables?.playerTable || 'Player'}"`,
      sql: `PRAGMA table_info("${dbInfo?.detectedTables?.playerTable || 'Player'}");`,
    },
    {
      label: `Primi 5 Giocatori`,
      sql: `SELECT * FROM "${dbInfo?.detectedTables?.playerTable || 'Player'}" LIMIT 5;`,
    },
    {
      label: `Dati Club Hattrick`,
      sql: `SELECT * FROM "${dbInfo?.detectedTables?.teamTable || 'TeamDetails'}" LIMIT 1;`,
    },
    {
      label: `Dati Account Utente`,
      sql: `SELECT * FROM "${dbInfo?.detectedTables?.userTable || 'users'}" LIMIT 1;`,
    },
    {
      label: `Conteggio Righe per Tabella`,
      sql: `SELECT 'Player' as tab, COUNT(*) as c FROM "${dbInfo?.detectedTables?.playerTable || 'Player'}" UNION ALL SELECT 'TeamDetails', COUNT(*) FROM "${dbInfo?.detectedTables?.teamTable || 'TeamDetails'}" UNION ALL SELECT 'users', COUNT(*) FROM "${dbInfo?.detectedTables?.userTable || 'users'}";`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. SEZIONE DATABASE ATTIVO & CONTROLLI */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>Database SQLite Attivo &amp; Diagnostica File</span>
                {dbInfo?.dbExists ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    File Presente
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-red-950 text-red-300 border border-red-500/30">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    File Non Trovato
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Configurazione e ispezione in tempo reale per FireHt / Hattrick
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRunCheckpoint}
              disabled={checkpointing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-amber-300 text-xs font-mono transition-colors disabled:opacity-50"
              title="Forza checkpoint passivo WAL per sincronizzare modifiche del bot"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${checkpointing ? 'animate-spin' : ''}`} />
              <span>{checkpointing ? 'Sincronizzazione...' : 'Sincronizza WAL Checkpoint'}</span>
            </button>

            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ricarica</span>
            </button>
          </div>
        </div>

        {checkpointFeedback && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-center justify-between">
            <span>{checkpointFeedback}</span>
            <button onClick={() => setCheckpointFeedback(null)} className="text-zinc-400 hover:text-white text-xs">Chiudi</button>
          </div>
        )}

        {/* Detailed DB Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 block">Percorso File SQLite</span>
            <div className="flex items-center justify-between gap-1 text-emerald-300 font-bold break-all">
              <span>{dbInfo?.dbFilePath || 'N/A'}</span>
              <button
                onClick={() => handleCopy(dbInfo?.dbFilePath || '')}
                className="p-1 rounded text-zinc-400 hover:text-white shrink-0"
                title="Copia percorso file"
              >
                {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 block">Sorgente Percorso / Env Var</span>
            <span className="text-white font-bold block">{dbInfo?.envVarUsed || 'FIREHT_DB_PATH'}</span>
            <span className="text-[10px] text-zinc-400">Rilevata da .env o env di sistema</span>
          </div>

          <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 block">Dimensione su Disco</span>
            <span className="text-white font-bold text-sm block">
              {dbInfo?.fileSizeKB !== undefined ? `${dbInfo.fileSizeKB} KB` : '0 KB'}
              {dbInfo?.fileSizeBytes !== undefined ? ` (${dbInfo.fileSizeBytes} byte)` : ''}
            </span>
            <span className="text-[10px] text-zinc-400">
              {dbInfo?.walFile?.exists ? `File WAL attivo: ${dbInfo.walFile.sizeKB} KB` : 'Nessun file WAL separato'}
            </span>
          </div>

          <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 block">Record Totali Rilevati</span>
            <div className="text-white font-bold text-sm flex items-center gap-2">
              <span className="text-emerald-400">{dbInfo?.totalPlayers ?? 0} Giocatori</span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-amber-400">{dbInfo?.totalTeams ?? 0} Club</span>
            </div>
            <span className="text-[10px] text-zinc-400">Utenti: {dbInfo?.totalUsers ?? 0}</span>
          </div>
        </div>

        {/* Diagnostic advice banner if empty */}
        {dbInfo && dbInfo.totalPlayers === 0 && (
          <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-2.5 text-xs font-mono text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Perché la query dice che il database è vuoto? (Cause tipiche &amp; Soluzione)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-amber-200/90 pl-1">
              <li>
                <strong>Percorso Attivo:</strong> Il backend sta interrogando il file <code>{dbInfo.dbFilePath}</code> ({dbInfo.fileSizeKB} KB).
              </li>
              <li>
                <strong>Dati nel WAL non ancora flushati:</strong> Se il bot Python scrive in WAL senza fare checkpoint, SQLite memorizza le modifiche nel file <code>.db-wal</code>. Clicca sul pulsante in alto <strong className="text-amber-300">"Sincronizza WAL Checkpoint"</strong>.
              </li>
              <li>
                <strong>Nome o Cartella Differente:</strong> Verifica se il bot ha creato il DB in una sottocartella (es. <code>/data/fireht.db</code>) o con maiuscole/minuscole diverse (es. <code>FireHt.db</code>). Puoi usare il selettore istantaneo qui sotto per collegarti a qualsiasi altro percorso.
              </li>
            </ul>

            {onLoadDemo && (
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={onLoadDemo}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Carica 18 Giocatori Dimostrativi (Demo)</span>
                </button>
                <span className="text-[11px] text-amber-300/80">
                  (Utile se desideri testare subito la grafica della rosa e del Best-XI)
                </span>
              </div>
            )}
          </div>
        )}

        {/* 1.1 STRUMENTO DI COLLEGAMENTO DB IN TEMPO REALE */}
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-300 font-bold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-400" />
              <span>Collega un Percorso File SQLite Alternativo in Tempo Reale:</span>
            </span>
            <span className="text-[10px] text-zinc-500">Non richiede riavvio del server</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={customPathInput}
              onChange={(e) => setCustomPathInput(e.target.value)}
              placeholder="/home/fire/bots/FireHt/fireht.db"
              className="flex-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleSwitchDb()}
              disabled={switchingPath}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
            >
              {switchingPath ? 'Connessione...' : 'Collega & Verifica'}
            </button>
          </div>

          {switchFeedback && (
            <div className={`p-2.5 rounded-lg border text-xs ${
              switchFeedback.ok
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/60 border-red-500/50 text-red-200'
            }`}>
              {switchFeedback.message}
            </div>
          )}

          {/* Database candidati rilevati sul server */}
          {dbInfo?.candidates && dbInfo.candidates.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-zinc-400 block">Database rilevati nelle posizioni tipiche del server:</span>
              <div className="flex flex-wrap gap-2">
                {dbInfo.candidates.map((cand, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCustomPathInput(cand.path);
                      handleSwitchDb(cand.path);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors flex items-center gap-1.5 ${
                      cand.isCurrent
                        ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <HardDrive className="w-3 h-3 text-zinc-400" />
                    <span>{cand.path}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">({cand.sizeKB} KB &bull; {cand.playersCount} giocatori)</span>
                    {cand.isCurrent && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File presenti nella cartella genitrice (siblings) */}
          {dbInfo?.siblings && dbInfo.siblings.exists && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>Contenuto della cartella genitrice: <strong>{dbInfo.siblings.dir}</strong></span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dbInfo.siblings.files.map((file, fIdx) => (
                  <button
                    key={fIdx}
                    onClick={() => {
                      if (!file.isDirectory && file.name.endsWith('.db')) {
                        const full = `${dbInfo.siblings?.dir}/${file.name}`;
                        setCustomPathInput(full);
                        handleSwitchDb(full);
                      }
                    }}
                    disabled={file.isDirectory || !file.name.endsWith('.db')}
                    className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 ${
                      file.name.endsWith('.db')
                        ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-emerald-300 cursor-pointer'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 cursor-default'
                    }`}
                  >
                    <span>{file.name}</span>
                    {!file.isDirectory && <span>({file.sizeKB} KB)</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. TABELLE SQLITE NEL FILE */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-950 border border-blue-500/40 text-blue-400">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Tabelle SQLite Presenti nel File ({inspectData?.tables?.length || 0})
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Schema e conteggio record in tempo reale per ciascuna tabella
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(inspectData?.tables || []).map((tbl) => (
            <div
              key={tbl.name}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-blue-400" />
                  <span>{tbl.name}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    tbl.count > 0
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  {tbl.count} {tbl.count === 1 ? 'riga' : 'righe'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">
                  Colonne ({tbl.columns?.length || 0})
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {(tbl.columns || []).map((col) => (
                    <div key={col.name} className="flex items-center justify-between text-[11px] py-0.5">
                      <span className={`font-mono ${col.pk ? 'text-amber-400 font-bold' : 'text-zinc-300'}`}>
                        {col.name} {col.pk ? '🔑' : ''}
                      </span>
                      <span className="text-zinc-500 text-[10px]">{col.type || 'TEXT'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  const sql = `SELECT * FROM "${tbl.name}" LIMIT 5;`;
                  setSqlInput(sql);
                  executeSql(sql);
                }}
                className="w-full py-1 text-center rounded bg-zinc-900 hover:bg-zinc-800 text-blue-400 hover:text-blue-300 transition-colors text-[11px]"
              >
                Esplora prime 5 righe &rarr;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. LE QUERY SQL UFFICIALI ESEGUITE DALLA TAB HATTRICK */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-400">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              Tutte le Query SQL Eseguite dalla Tab Hattrick
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Mappatura completa e trasparente di ogni interrogazione inviata al database SQLite
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {(inspectData?.queries || []).map((q, idx) => (
            <div
              key={idx}
              className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 font-mono text-xs space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">{q.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                    {q.endpoint}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Tabella: <strong className="text-zinc-200">{q.targetTable}</strong>
                  </span>
                </div>

                <button
                  onClick={() => handleCopy(q.sql, idx)}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  {copiedQueryIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiata</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copia SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-2.5 bg-black/60 rounded-lg border border-zinc-800/60 overflow-x-auto text-emerald-300 font-mono text-[11px]">
                <code>{q.sql}</code>
              </div>

              <p className="text-[11px] text-zinc-400">
                <strong className="text-zinc-300">Finalità:</strong> {q.purpose}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. LIVE INTERACTIVE QUERY RUNNER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>Query Runner Interattivo SQLite (Sola Lettura)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 text-zinc-400 border border-zinc-800">
                  SELECT / PRAGMA / EXPLAIN
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Esegui query direttamente sul database SQLite Hattrick per verificare e debuggare i dati in tempo reale
              </p>
            </div>
          </div>
        </div>

        {/* Quick buttons */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-zinc-400 block">Query Rapide di Diagnostica:</span>
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            {quickQueries.map((qq, i) => (
              <button
                key={i}
                onClick={() => {
                  setSqlInput(qq.sql);
                  executeSql(qq.sql);
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
              >
                {qq.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea & Run */}
        <div className="space-y-2">
          <textarea
            value={sqlInput}
            onChange={(e) => setSqlInput(e.target.value)}
            rows={3}
            placeholder="Scrivi qui la tua query SQL SELECT..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500/60"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">
              Solo query di lettura per la sicurezza del database bot.
            </span>
            <button
              onClick={() => executeSql()}
              disabled={runningQuery}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-xl transition-colors shadow"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{runningQuery ? 'Esecuzione...' : 'Esegui Query SQL'}</span>
            </button>
          </div>
        </div>

        {/* Results output */}
        {queryResult && (
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
              <span className="text-zinc-400">
                {queryResult.ok ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Query completata: {queryResult.count} righe restituite in {queryResult.durationMs}ms
                  </span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Errore SQL
                  </span>
                )}
              </span>

              {queryResult.activeDbPath && (
                <span className="text-[11px] text-zinc-500">
                  DB interrogato: <strong className="text-zinc-300">{queryResult.activeDbPath}</strong>
                </span>
              )}
            </div>

            {queryResult.ok ? (
              queryResult.rows && queryResult.rows.length > 0 ? (
                <div className="max-h-72 overflow-auto border border-zinc-800 rounded-xl scrollbar-thin">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 sticky top-0">
                      <tr>
                        {(queryResult.columns || []).map((col) => (
                          <th key={col} className="p-2 font-bold whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                      {queryResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-zinc-900/50">
                          {(queryResult.columns || []).map((col) => (
                            <td key={col} className="p-2 whitespace-nowrap">
                              {row[col] !== null && row[col] !== undefined
                                ? typeof row[col] === 'boolean'
                                  ? row[col]
                                    ? 'true'
                                    : 'false'
                                  : String(row[col])
                                : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 text-xs font-mono text-center">
                  Nessun record restituito (tabella vuota o nessun elemento corrispondente alla condizione WHERE).
                </div>
              )
            ) : (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 font-mono text-xs">
                {queryResult.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
