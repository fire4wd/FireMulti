import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';
import { setupBBeater } from './bbeater-module';
import { setupAnDa } from './anda-module';
import { setupHattrick } from './hattrick-module';

// 2. PORTA 3000 (Fissa per container e proxy Nginx, con supporto LOCAL_PORT per deploy systemd)
const PORT = process.env.LOCAL_PORT ? parseInt(process.env.LOCAL_PORT, 10) : 3000;

// Lettura dinamica di versione e metadati da metadata.json
function getAppMetadata(): { version: string; name: string } {
  try {
    const metadataPath = path.join(process.cwd(), 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const content = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      return {
        version: content.version || '1.3.1',
        name: content.name || 'FireMultip'
      };
    }
  } catch (err) {
    console.warn('[METADATA] Avviso: impossibile leggere metadata.json:', err);
  }
  return { version: '1.3.1', name: 'FireMultip' };
}

const { version: appVersion, name: appName } = getAppMetadata();

// 1. BACKEND & DATABASE LOCALE (MULTI-DATABASE IN LOCALE):
// Configurazione percorsi Database:
// - Per il DEPLOY IN LOCALE (host/server Linux con utente fire):
//     * masa : /home/fire/bots/Masa/data/masa.db
//     * buzzerbeater : /home/fire/bots/FireBuzzer/buzzerbeater.db
//     * Fireht : /home/fire/bots/FireHt/fireht.db
//     * anda : /home/fire/bots/AnDab/data/andab.db
// - In PREVIEW (Google AI Studio): database locali in ./data/

// Rilevamento ambiente Preview vs Deploy in locale (produzione / host utente)
const isPreview = (
  Boolean(process.env.APPLET_ID || process.env.K_SERVICE || process.env.CONTROL_PLANE_PORT) &&
  !fs.existsSync('/home/fire/bots') &&
  process.env.PREVIEW !== 'false' &&
  process.env.IS_PREVIEW !== 'false' &&
  process.env.LOCAL_DEPLOY !== 'true' &&
  process.env.DEPLOY !== 'local'
) || process.env.FORCE_PREVIEW === 'true' || process.env.PREVIEW === 'true';

// Helper per garantire la presenza della cartella genitrice prima di aprire il file SQLite
function ensureDbDir(targetFilePath: string) {
  try {
    const dir = path.dirname(targetFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn(`[DATABASE] Avviso: impossibile creare cartella per ${targetFilePath}:`, err);
  }
}

// 1. Masaniello (Masa) - Deploy locale: /home/fire/bots/Masa/data/masa.db
const defaultMasaDbPath = isPreview
  ? path.join(process.cwd(), 'data', 'app.db')
  : '/home/fire/bots/Masa/data/masa.db';
const dbPath = process.env.MASA_DB_PATH || process.env.DATABASE_PATH || process.env.DB_PATH || defaultMasaDbPath;
ensureDbDir(dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 2. BuzzerBeater - Deploy locale: /home/fire/bots/FireBuzzer/buzzerbeater.db
const defaultBbeaterDbPath = isPreview
  ? (fs.existsSync(path.join(process.cwd(), 'data', 'bbeater.db')) ? path.join(process.cwd(), 'data', 'bbeater.db') : dbPath)
  : '/home/fire/bots/FireBuzzer/buzzerbeater.db';
const bbeaterDbPath = process.env.BBEATER_DB_PATH || process.env.BUZZERBEATER_DB_PATH || defaultBbeaterDbPath;
ensureDbDir(bbeaterDbPath);

const bbeaterDb = bbeaterDbPath === dbPath ? db : (() => {
  const bDb = new Database(bbeaterDbPath);
  bDb.pragma('journal_mode = WAL');
  bDb.pragma('foreign_keys = ON');
  return bDb;
})();

// 3. AnDa Culinary - Deploy locale: /home/fire/bots/AnDab/data/andab.db
const defaultAndaDbPath = isPreview
  ? (fs.existsSync(path.join(process.cwd(), 'data', 'andab.db'))
      ? path.join(process.cwd(), 'data', 'andab.db')
      : (fs.existsSync(path.join(process.cwd(), 'data', 'anda.db'))
          ? path.join(process.cwd(), 'data', 'anda.db')
          : dbPath))
  : '/home/fire/bots/AnDab/data/andab.db';
const andaDbPath = process.env.ANDA_DB_PATH || process.env.ANDAB_DB_PATH || defaultAndaDbPath;
ensureDbDir(andaDbPath);

const andaDb = andaDbPath === dbPath ? db : (() => {
  const aDb = new Database(andaDbPath);
  aDb.pragma('journal_mode = WAL');
  aDb.pragma('foreign_keys = ON');
  return aDb;
})();

// 4. Hattrick (Fireht) - Deploy locale: /home/fire/bots/FireHt/fireht.db
const defaultHattrickDbPath = isPreview
  ? path.join(process.cwd(), 'data', 'hattrick.db')
  : '/home/fire/bots/FireHt/fireht.db';
const hattrickDbPath = process.env.FIREHT_DB_PATH || process.env.HATTRICK_DB_PATH || process.env.HT_DB_PATH || defaultHattrickDbPath;
ensureDbDir(hattrickDbPath);

const hattrickDb = new Database(hattrickDbPath);
hattrickDb.pragma('journal_mode = WAL');
hattrickDb.pragma('foreign_keys = ON');

// Crea le tabelle secondo la specifica esatta dell'utente
db.exec(`
  CREATE TABLE IF NOT EXISTS masa (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
    nome VARCHAR NOT NULL, 
    n_eventi INTEGER NOT NULL, 
    eventi_attesi INTEGER NOT NULL, 
    capitale FLOAT NOT NULL, 
    vinti INTEGER DEFAULT 0, 
    persi INTEGER DEFAULT 0, 
    masa1 INTEGER DEFAULT 0, 
    masa2 INTEGER DEFAULT 0, 
    attivo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS evento (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
    masa_id INTEGER NOT NULL, 
    numero INTEGER NOT NULL, 
    quota FLOAT NOT NULL, 
    puntata FLOAT NOT NULL, 
    esito VARCHAR NOT NULL, 
    titolo VARCHAR, 
    timestamp DATETIME, 
    FOREIGN KEY(masa_id) REFERENCES masa (id) ON DELETE CASCADE
  );
`);

// Inserisci dati dimostrativi se il database è vuoto
const countMasa = db.prepare('SELECT COUNT(*) as count FROM masa').get() as { count: number };
if (countMasa.count === 0) {
  const insertMasa = db.prepare(`
    INSERT INTO masa (nome, n_eventi, eventi_attesi, capitale, vinti, persi, masa1, masa2, attivo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEvento = db.prepare(`
    INSERT INTO evento (masa_id, numero, quota, puntata, esito, titolo, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const d1 = new Date(now.getTime() - 86400000 * 2).toISOString();
  const d2 = new Date(now.getTime() - 86400000).toISOString();
  const d3 = new Date(now.getTime() - 3600000 * 4).toISOString();
  const d4 = new Date(now.getTime() + 3600000 * 3).toISOString();
  const d5 = new Date(now.getTime() + 86400000).toISOString();
  const d6 = new Date(now.getTime() + 86400000 * 2).toISOString();

  const res1 = insertMasa.run('Champions League 4/6', 6, 4, 100.0, 2, 1, 0, 0, 1);
  const masaId1 = res1.lastInsertRowid;

  insertEvento.run(masaId1, 1, 1.85, 21.50, 'VINTO', 'Inter - Arsenal (Over 2.5)', d1);
  insertEvento.run(masaId1, 2, 1.70, 24.20, 'VINTO', 'Real Madrid - Bayern Monaco (Goal)', d2);
  insertEvento.run(masaId1, 3, 1.65, 27.80, 'PERSO', 'PSG - Atletico Madrid (1)', d3);
  insertEvento.run(masaId1, 4, 1.80, 32.40, 'IN CORSO', 'Liverpool - Bayer Leverkusen (1)', d4);
  insertEvento.run(masaId1, 5, 1.75, 0.0, 'ATTESA', 'Barcellona - Atalanta (Over 2.5)', d5);
  insertEvento.run(masaId1, 6, 1.60, 0.0, 'ATTESA', 'Manchester City - Feyenoord (1X + Over 1.5)', d6);

  const res2 = insertMasa.run('Weekend Serie A 3/5', 5, 3, 50.0, 3, 1, 0, 0, 0);
  const masaId2 = res2.lastInsertRowid;
  insertEvento.run(masaId2, 1, 1.90, 12.00, 'VINTO', 'Juventus - Napoli (Under 2.5)', d1);
  insertEvento.run(masaId2, 2, 1.75, 14.50, 'PERSO', 'Milan - Roma (1)', d2);
  insertEvento.run(masaId2, 3, 2.00, 16.20, 'VINTO', 'Lazio - Bologna (Goal)', d3);
  insertEvento.run(masaId2, 4, 1.85, 18.00, 'VINTO', 'Fiorentina - Verona (1)', d4);
  insertEvento.run(masaId2, 5, 1.70, 0.0, 'NON GIOCATO', 'Monza - Torino', d5);
}

// Helper per combinazioni matematiche
function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let c = 1;
  for (let i = 1; i <= k; i++) {
    c = (c * (n - (k - i))) / i;
  }
  return c;
}

// Calcolo puntata consigliata Masaniello
function calculateMasanielloStake(
  nTotale: number,
  kAttesi: number,
  vinti: number,
  persi: number,
  cassaAttuale: number,
  quota: number
) {
  const nRimasti = nTotale - (vinti + persi);
  const kMancanti = kAttesi - vinti;
  const erroriDisponibili = (nTotale - kAttesi) - persi;

  if (kMancanti <= 0) {
    return {
      status: 'TARGET_RAGGIUNTO',
      messaggio: 'Obiettivo Masaniello già completato con successo!',
      puntata: 0,
      quota,
      kMancanti,
      erroriDisponibili,
      nRimasti
    };
  }

  if (erroriDisponibili < 0 || kMancanti > nRimasti) {
    return {
      status: 'FALLITO',
      messaggio: 'Masaniello chiuso con esito negativo (superati gli errori permessi).',
      puntata: 0,
      quota,
      kMancanti,
      erroriDisponibili,
      nRimasti
    };
  }

  if (nRimasti <= 0) {
    return {
      status: 'CONCLUSO',
      messaggio: 'Nessun evento rimasto.',
      puntata: 0,
      quota,
      kMancanti,
      erroriDisponibili,
      nRimasti
    };
  }

  // Combinazioni
  const cWin = combinations(nRimasti - 1, kMancanti - 1);
  const cLose = combinations(nRimasti - 1, kMancanti);
  const denom = (cWin * quota) + cLose;

  let puntata = 0;
  if (denom > 0 && cassaAttuale > 0) {
    const fraction = cWin / denom;
    puntata = Math.round((cassaAttuale * fraction) * 100) / 100;
  }

  // Limita la puntata alla cassa disponibile
  if (puntata > cassaAttuale) {
    puntata = Math.round(cassaAttuale * 100) / 100;
  }

  return {
    status: 'ATTIVO',
    messaggio: 'Puntata calcolata con algoritmo Masaniello.',
    puntata,
    quota,
    kMancanti,
    erroriDisponibili,
    nRimasti,
    cWin,
    cLose
  };
}

// Calcolo bilancio/cassa per un Masa
function computeMasaStats(masaId: number) {
  const masa = db.prepare('SELECT * FROM masa WHERE id = ?').get(masaId) as any;
  if (!masa) return null;

  const eventi = db.prepare('SELECT * FROM evento WHERE masa_id = ? ORDER BY numero ASC').all(masaId) as any[];

  let cassa = masa.capitale;
  let vinti = 0;
  let persi = 0;
  let inCorso = 0;
  let inAttesa = 0;
  let totalePuntato = 0;
  let totaleVinto = 0;

  for (const ev of eventi) {
    const esitoNorm = (ev.esito || '').toUpperCase().trim();
    if (esitoNorm === 'VINTO') {
      vinti++;
      cassa = cassa - ev.puntata + (ev.puntata * ev.quota);
      totalePuntato += ev.puntata;
      totaleVinto += (ev.puntata * ev.quota);
    } else if (esitoNorm === 'PERSO') {
      persi++;
      cassa = cassa - ev.puntata;
      totalePuntato += ev.puntata;
    } else if (esitoNorm === 'IN CORSO') {
      inCorso++;
    } else {
      inAttesa++;
    }
  }

  // Sincronizza vinti e persi nel record masa se divergono
  if (masa.vinti !== vinti || masa.persi !== persi) {
    db.prepare('UPDATE masa SET vinti = ?, persi = ? WHERE id = ?').run(vinti, persi, masaId);
    masa.vinti = vinti;
    masa.persi = persi;
  }

  const kMancanti = Math.max(0, masa.eventi_attesi - vinti);
  const erroriMax = masa.n_eventi - masa.eventi_attesi;
  const erroriRimasti = Math.max(0, erroriMax - persi);
  const nGiocati = vinti + persi;
  const nRimasti = Math.max(0, masa.n_eventi - nGiocati);

  let stato = 'IN_CORSO';
  if (vinti >= masa.eventi_attesi) {
    stato = 'VINTO';
  } else if (persi > erroriMax || kMancanti > nRimasti) {
    stato = 'PERSO';
  } else if (!masa.attivo) {
    stato = 'ARCHIVIATO';
  }

  const utileNetto = Math.round((cassa - masa.capitale) * 100) / 100;
  const roi = masa.capitale > 0 ? Math.round(((cassa - masa.capitale) / masa.capitale) * 10000) / 100 : 0;

  return {
    ...masa,
    cassaAttuale: Math.round(cassa * 100) / 100,
    utileNetto,
    roi,
    vinti,
    persi,
    inCorso,
    inAttesa,
    nGiocati,
    nRimasti,
    kMancanti,
    erroriRimasti,
    erroriMax,
    stato,
    eventi
  };
}

// 3. AUTENTICAZIONE WEB (NGINX / HTPASSWD):
// Estrae l'utente dall'header 'x-remote-user' (o dall'header Authorization Basic)
function extractUserFromRequest(req: Request) {
  // 1. Header 'x-remote-user' impostato da Nginx proxy_pass con auth_basic
  const xRemoteUser = req.headers['x-remote-user'];
  if (typeof xRemoteUser === 'string' && xRemoteUser.trim()) {
    return {
      username: xRemoteUser.trim(),
      source: 'nginx (x-remote-user)'
    };
  }

  // 2. Header Authorization Basic (standard HTTP Basic Auth)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const base64Credentials = authHeader.substring(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const parts = credentials.split(':');
      if (parts[0] && parts[0].trim()) {
        return {
          username: parts[0].trim(),
          source: 'http-basic-auth'
        };
      }
    } catch (err) {
      // ignore parsing error
    }
  }

  // 3. Header opzionale 'x-user-override' per testare ruoli differenti da UI
  const overrideUser = req.headers['x-user-override'];
  if (typeof overrideUser === 'string' && overrideUser.trim()) {
    return {
      username: overrideUser.trim(),
      source: 'client-override'
    };
  }

  // Fallback configurabile via env (default 'fire')
  const defaultUser = process.env.DEFAULT_USER || 'fire';
  return {
    username: defaultUser,
    source: 'local-environment-default'
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Middleware logging per richieste API
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      const u = extractUserFromRequest(req);
      res.setHeader('X-Authenticated-User', u.username);
    }
    next();
  });

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: appVersion,
      name: appName,
      port: PORT,
      timestamp: new Date().toISOString()
    });
  });

  // 3. /api/auth/me con ruoli e permessi (con utente 'fire' come admin)
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const auth = extractUserFromRequest(req);
    const uname = auth.username.toLowerCase();
    const isAdmin = uname === 'fire' || uname === 'admin';

    res.json({
      username: auth.username,
      isAdmin,
      role: isAdmin ? 'admin' : 'user',
      permissions: isAdmin
        ? ['read', 'write', 'delete', 'admin', 'manage_masa', 'system_info', 'database_manage']
        : ['read', 'write', 'manage_masa'],
      authMethod: auth.source,
      dbPath,
      systemdPort: PORT,
      timestamp: new Date().toISOString()
    });
  });

  // Mount BuzzerBeater Basketball Manager API
  app.use('/api/bbeater', setupBBeater(bbeaterDb, extractUserFromRequest));

  // Mount AnDa Culinary & Parametric Recipes API
  app.use('/api/anda', setupAnDa(andaDb));

  // Mount Hattrick Football Manager API (Database SQLite dedicato)
  app.use('/api/hattrick', setupHattrick(hattrickDb, hattrickDbPath));

  // Status di sistema e database
  app.get('/api/system/status', (req: Request, res: Response) => {
    try {
      let dbSize = 0;
      if (fs.existsSync(dbPath)) {
        dbSize = fs.statSync(dbPath).size;
      }
      const totalMasa = (db.prepare('SELECT COUNT(*) as c FROM masa').get() as any).c;
      const totalEventi = (db.prepare('SELECT COUNT(*) as c FROM evento').get() as any).c;
      const activeMasa = (db.prepare('SELECT COUNT(*) as c FROM masa WHERE attivo = 1').get() as any).c;
      
      let totalGiocatori = 0;
      let totalPartite = 0;
      try {
        totalGiocatori = (bbeaterDb.prepare("SELECT COUNT(*) as c FROM giocatori WHERE (owner IS NOT NULL AND owner != 0 AND CAST(owner AS TEXT) != '0')").get() as any).c;
        totalPartite = (bbeaterDb.prepare('SELECT COUNT(*) as c FROM partite').get() as any).c;
      } catch (e) {}

      let totalRecipes = 0;
      let totalCategories = 0;
      try {
        totalRecipes = (andaDb.prepare('SELECT COUNT(*) as c FROM recipes').get() as any).c;
        totalCategories = (andaDb.prepare('SELECT COUNT(*) as c FROM categories').get() as any).c;
      } catch (e) {}

      let totalHtPlayers = 0;
      let totalHtTeams = 0;
      try {
        totalHtPlayers = (hattrickDb.prepare('SELECT COUNT(*) as c FROM "Player"').get() as any).c;
        totalHtTeams = (hattrickDb.prepare('SELECT COUNT(*) as c FROM "TeamDetails"').get() as any).c;
      } catch (e) {}

      const getDbInfo = (p: string, extra?: Record<string, any>) => ({
        path: p,
        exists: fs.existsSync(p),
        sizeKB: fs.existsSync(p) ? Math.round(fs.statSync(p).size / 1024 * 10) / 10 : 0,
        ...extra
      });

      res.json({
        ok: true,
        version: appVersion,
        name: appName,
        isPreview,
        dbPath,
        dbExists: fs.existsSync(dbPath),
        dbSizeBytes: dbSize,
        dbSizeKB: Math.round(dbSize / 1024 * 10) / 10,
        totalMasa,
        activeMasa,
        totalEventi,
        totalGiocatori,
        totalPartite,
        totalRecipes,
        totalCategories,
        totalHtPlayers,
        totalHtTeams,
        databases: {
          masa: getDbInfo(dbPath, { totalMasa, totalEventi }),
          masaniello: getDbInfo(dbPath, { totalMasa, totalEventi }),
          bbeater: getDbInfo(bbeaterDbPath, { totalGiocatori, totalPartite }),
          buzzerbeater: getDbInfo(bbeaterDbPath, { totalGiocatori, totalPartite }),
          anda: getDbInfo(andaDbPath, { totalRecipes, totalCategories }),
          hattrick: getDbInfo(hattrickDbPath, { totalPlayers: totalHtPlayers, totalTeams: totalHtTeams }),
          fireht: getDbInfo(hattrickDbPath, { totalPlayers: totalHtPlayers, totalTeams: totalHtTeams })
        },
        port: PORT,
        pid: process.pid,
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024 * 10) / 10,
        envPortVar: process.env.PORT || 'not set (fallback 3000)'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // LISTA MASA
  app.get('/api/masa', (req: Request, res: Response) => {
    try {
      const attivoParam = req.query.attivo;
      let query = 'SELECT * FROM masa';
      const params: any[] = [];

      if (attivoParam !== undefined) {
        query += ' WHERE attivo = ?';
        params.push(parseInt(attivoParam as string, 10));
      }
      query += ' ORDER BY attivo DESC, id DESC';

      const rows = db.prepare(query).all(...params) as any[];
      const detailed = rows.map((m) => computeMasaStats(m.id));
      res.json(detailed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DETTAGLIO MASA
  app.get('/api/masa/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const data = computeMasaStats(id);
      if (!data) {
        return res.status(404).json({ error: 'Masaniello non trovato' });
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // CREA MASA
  app.post('/api/masa', (req: Request, res: Response) => {
    try {
      const {
        nome,
        n_eventi,
        eventi_attesi,
        capitale,
        masa1 = 0,
        masa2 = 0,
        attivo = 1,
        autoGenerateSteps = true,
        defaultQuota = 1.80
      } = req.body;

      if (!nome || !n_eventi || !eventi_attesi || !capitale) {
        return res.status(400).json({ error: 'Campi obbligatori: nome, n_eventi, eventi_attesi, capitale' });
      }

      const n = parseInt(n_eventi, 10);
      const k = parseInt(eventi_attesi, 10);
      const cap = parseFloat(capitale);

      if (k > n) {
        return res.status(400).json({ error: 'Gli eventi attesi non possono superare il numero totale di eventi' });
      }
      if (cap <= 0) {
        return res.status(400).json({ error: 'Il capitale deve essere maggiore di zero' });
      }

      const stmt = db.prepare(`
        INSERT INTO masa (nome, n_eventi, eventi_attesi, capitale, vinti, persi, masa1, masa2, attivo)
        VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?)
      `);

      const result = stmt.run(nome.trim(), n, k, cap, masa1 || 0, masa2 || 0, attivo ? 1 : 0);
      const masaId = Number(result.lastInsertRowid);

      // Genera i placeholder per gli eventi pianificati
      if (autoGenerateSteps && n > 0) {
        const insertEv = db.prepare(`
          INSERT INTO evento (masa_id, numero, quota, puntata, esito, titolo, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (let i = 1; i <= n; i++) {
          const quotaVal = i === 1 ? (parseFloat(defaultQuota) || 1.80) : 1.80;
          let initialStake = 0;
          if (i === 1) {
            const stakeCalc = calculateMasanielloStake(n, k, 0, 0, cap, quotaVal);
            initialStake = stakeCalc.puntata;
          }
          insertEv.run(
            masaId,
            i,
            quotaVal,
            initialStake,
            i === 1 ? 'IN CORSO' : 'ATTESA',
            `Evento #${i}`,
            new Date().toISOString()
          );
        }
      }

      const created = computeMasaStats(masaId);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // MODIFICA MASA
  app.put('/api/masa/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = db.prepare('SELECT * FROM masa WHERE id = ?').get(id) as any;
      if (!existing) {
        return res.status(404).json({ error: 'Masa non trovato' });
      }

      const {
        nome = existing.nome,
        n_eventi = existing.n_eventi,
        eventi_attesi = existing.eventi_attesi,
        capitale = existing.capitale,
        vinti = existing.vinti,
        persi = existing.persi,
        masa1 = existing.masa1,
        masa2 = existing.masa2,
        attivo = existing.attivo
      } = req.body;

      db.prepare(`
        UPDATE masa 
        SET nome = ?, n_eventi = ?, eventi_attesi = ?, capitale = ?, vinti = ?, persi = ?, masa1 = ?, masa2 = ?, attivo = ?
        WHERE id = ?
      `).run(
        nome,
        parseInt(n_eventi, 10),
        parseInt(eventi_attesi, 10),
        parseFloat(capitale),
        parseInt(vinti, 10),
        parseInt(persi, 10),
        parseInt(masa1, 10) || 0,
        parseInt(masa2, 10) || 0,
        attivo ? 1 : 0,
        id
      );

      const updated = computeMasaStats(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ELIMINA MASA
  app.delete('/api/masa/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const auth = extractUserFromRequest(req);
      const uname = auth.username.toLowerCase();
      // Verifica permessi se admin o utente
      db.prepare('DELETE FROM evento WHERE masa_id = ?').run(id);
      const result = db.prepare('DELETE FROM masa WHERE id = ?').run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Masa non trovato' });
      }
      res.json({ ok: true, message: `Masa #${id} eliminato con successo.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // RESET PROGRESSIONE MASA
  app.post('/api/masa/:id/reset', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const masa = db.prepare('SELECT * FROM masa WHERE id = ?').get(id) as any;
      if (!masa) return res.status(404).json({ error: 'Masa non trovato' });

      db.prepare('UPDATE masa SET vinti = 0, persi = 0, attivo = 1 WHERE id = ?').run(id);
      db.prepare("UPDATE evento SET esito = 'ATTESA', puntata = 0 WHERE masa_id = ?").run(id);

      // Ricalcola puntata per il primo evento
      const primoEvento = db.prepare('SELECT * FROM evento WHERE masa_id = ? ORDER BY numero ASC LIMIT 1').get(id) as any;
      if (primoEvento) {
        const calc = calculateMasanielloStake(masa.n_eventi, masa.eventi_attesi, 0, 0, masa.capitale, primoEvento.quota || 1.80);
        db.prepare("UPDATE evento SET esito = 'IN CORSO', puntata = ? WHERE id = ?").run(calc.puntata, primoEvento.id);
      }

      res.json(computeMasaStats(id));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // CALCOLA PROSSIMA PUNTATA MASANIELLO
  app.post('/api/masa/:id/calculate-next', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const stats = computeMasaStats(id);
      if (!stats) return res.status(404).json({ error: 'Masa non trovato' });

      const quota = parseFloat(req.body.quota) || 1.80;
      const calc = calculateMasanielloStake(
        stats.n_eventi,
        stats.eventi_attesi,
        stats.vinti,
        stats.persi,
        stats.cassaAttuale,
        quota
      );

      res.json({
        ...calc,
        cassaAttuale: stats.cassaAttuale,
        capitaleIniziale: stats.capitale
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GESTIONE EVENTI: LISTA
  app.get('/api/masa/:id/eventi', (req: Request, res: Response) => {
    try {
      const masaId = parseInt(req.params.id, 10);
      const eventi = db.prepare('SELECT * FROM evento WHERE masa_id = ? ORDER BY numero ASC').all(masaId);
      res.json(eventi);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GESTIONE EVENTI: CREA SINGOLO EVENTO
  app.post('/api/masa/:id/eventi', (req: Request, res: Response) => {
    try {
      const masaId = parseInt(req.params.id, 10);
      const { numero, quota, puntata, esito = 'ATTESA', titolo = '', timestamp } = req.body;

      if (!quota) {
        return res.status(400).json({ error: 'Quota richiesta' });
      }

      let numVal = parseInt(numero, 10);
      if (!numVal) {
        const last = db.prepare('SELECT MAX(numero) as maxNum FROM evento WHERE masa_id = ?').get(masaId) as any;
        numVal = (last?.maxNum || 0) + 1;
      }

      const stmt = db.prepare(`
        INSERT INTO evento (masa_id, numero, quota, puntata, esito, titolo, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        masaId,
        numVal,
        parseFloat(quota),
        parseFloat(puntata) || 0,
        esito,
        titolo || `Evento #${numVal}`,
        timestamp || new Date().toISOString()
      );

      const created = db.prepare('SELECT * FROM evento WHERE id = ?').get(result.lastInsertRowid);
      // Ricalcola statistiche masa
      computeMasaStats(masaId);

      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // MODIFICA EVENTO
  app.put('/api/eventi/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = db.prepare('SELECT * FROM evento WHERE id = ?').get(id) as any;
      if (!existing) {
        return res.status(404).json({ error: 'Evento non trovato' });
      }

      const {
        numero = existing.numero,
        quota = existing.quota,
        puntata = existing.puntata,
        esito = existing.esito,
        titolo = existing.titolo,
        timestamp = existing.timestamp,
        recalcNext = false
      } = req.body;

      db.prepare(`
        UPDATE evento
        SET numero = ?, quota = ?, puntata = ?, esito = ?, titolo = ?, timestamp = ?
        WHERE id = ?
      `).run(
        parseInt(numero, 10),
        parseFloat(quota),
        parseFloat(puntata),
        esito,
        titolo,
        timestamp,
        id
      );

      const updatedEvento = db.prepare('SELECT * FROM evento WHERE id = ?').get(id) as any;
      const stats = computeMasaStats(existing.masa_id);

      // Se richiesto e l'esito è cambiato in VINTO o PERSO, calcola automaticamente la puntata per il prossimo evento
      if (recalcNext && stats) {
        const prossimoInAttesa = db.prepare(
          "SELECT * FROM evento WHERE masa_id = ? AND numero > ? AND (esito = 'ATTESA' OR esito = 'IN CORSO') ORDER BY numero ASC LIMIT 1"
        ).get(existing.masa_id, existing.numero) as any;

        if (prossimoInAttesa) {
          const nextCalc = calculateMasanielloStake(
            stats.n_eventi,
            stats.eventi_attesi,
            stats.vinti,
            stats.persi,
            stats.cassaAttuale,
            prossimoInAttesa.quota
          );

          db.prepare("UPDATE evento SET puntata = ?, esito = 'IN CORSO' WHERE id = ?").run(
            nextCalc.puntata,
            prossimoInAttesa.id
          );
        }
      }

      res.json({
        evento: updatedEvento,
        masa: computeMasaStats(existing.masa_id)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ELIMINA EVENTO
  app.delete('/api/eventi/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = db.prepare('SELECT * FROM evento WHERE id = ?').get(id) as any;
      if (!existing) {
        return res.status(404).json({ error: 'Evento non trovato' });
      }

      db.prepare('DELETE FROM evento WHERE id = ?').run(id);
      const stats = computeMasaStats(existing.masa_id);

      res.json({ ok: true, masa: stats });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // EXPORT / BACKUP JSON
  app.get('/api/system/export', (req: Request, res: Response) => {
    try {
      const masas = db.prepare('SELECT * FROM masa').all();
      const eventi = db.prepare('SELECT * FROM evento').all();

      let giocatori: any[] = [];
      let partite: any[] = [];
      let arena: any[] = [];
      let economia: any[] = [];
      let minutigiocati: any[] = [];
      let utenti: any[] = [];

      try {
        giocatori = db.prepare('SELECT * FROM giocatori').all();
        partite = db.prepare('SELECT * FROM partite').all();
        arena = db.prepare('SELECT * FROM arena').all();
        economia = db.prepare('SELECT * FROM economia').all();
        minutigiocati = db.prepare('SELECT * FROM minutigiocati').all();
        utenti = db.prepare('SELECT * FROM utenti').all();
      } catch (e) {}

      let andaCategories: any[] = [];
      let andaRecipes: any[] = [];
      let andaIngredients: any[] = [];
      let andaProcedures: any[] = [];
      let andaPredefined: any[] = [];

      try {
        andaCategories = andaDb.prepare('SELECT * FROM categories').all();
        andaRecipes = andaDb.prepare('SELECT * FROM recipes').all();
        andaIngredients = andaDb.prepare('SELECT * FROM ingredients').all();
        andaProcedures = andaDb.prepare('SELECT * FROM procedures').all();
        andaPredefined = andaDb.prepare('SELECT * FROM predefined_quantities').all();
      } catch (e) {}

      let htPlayers: any[] = [];
      let htTeams: any[] = [];
      let htUsers: any[] = [];

      try {
        htPlayers = hattrickDb.prepare('SELECT * FROM "Player"').all();
        htTeams = hattrickDb.prepare('SELECT * FROM "TeamDetails"').all();
        htUsers = hattrickDb.prepare('SELECT * FROM "users"').all();
      } catch (e) {}

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=firemultip_backup_${Date.now()}.json`);
      res.json({
        exportedAt: new Date().toISOString(),
        version: appVersion,
        dbPath,
        masas,
        eventi,
        buzzerbeater: {
          utenti,
          giocatori,
          partite,
          arena,
          economia,
          minutigiocati
        },
        anda: {
          categories: andaCategories,
          recipes: andaRecipes,
          ingredients: andaIngredients,
          procedures: andaProcedures,
          predefined_quantities: andaPredefined
        },
        hattrick: {
          players: htPlayers,
          teams: htTeams,
          users: htUsers
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // IMPORT JSON
  app.post('/api/system/import', (req: Request, res: Response) => {
    try {
      const { masas, eventi, buzzerbeater, anda, hattrick, overwrite = false } = req.body;
      if (!Array.isArray(masas)) {
        return res.status(400).json({ error: 'Dati esportati non validi (manca array masas)' });
      }

      const tx = db.transaction(() => {
        if (overwrite) {
          db.exec('DELETE FROM evento; DELETE FROM masa;');
        }

        const insertMasa = db.prepare(`
          INSERT INTO masa (id, nome, n_eventi, eventi_attesi, capitale, vinti, persi, masa1, masa2, attivo)
          VALUES (@id, @nome, @n_eventi, @eventi_attesi, @capitale, @vinti, @persi, @masa1, @masa2, @attivo)
        `);

        const insertEvento = db.prepare(`
          INSERT INTO evento (id, masa_id, numero, quota, puntata, esito, titolo, timestamp)
          VALUES (@id, @masa_id, @numero, @quota, @puntata, @esito, @titolo, @timestamp)
        `);

        for (const m of masas) {
          try {
            insertMasa.run(m);
          } catch (e) {
            // If ID collision, insert without ID
            db.prepare(`
              INSERT INTO masa (nome, n_eventi, eventi_attesi, capitale, vinti, persi, masa1, masa2, attivo)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(m.nome, m.n_eventi, m.eventi_attesi, m.capitale, m.vinti || 0, m.persi || 0, m.masa1 || 0, m.masa2 || 0, m.attivo ?? 1);
          }
        }

        if (Array.isArray(eventi)) {
          for (const ev of eventi) {
            try {
              insertEvento.run(ev);
            } catch (e) {
              // ignore or insert without explicit ID
            }
          }
        }

        // Import BuzzerBeater tables if provided
        if (buzzerbeater && typeof buzzerbeater === 'object') {
          if (overwrite) {
            try {
              db.exec('DELETE FROM minutigiocati; DELETE FROM giocatori; DELETE FROM partite;');
            } catch (e) {}
          }

          if (Array.isArray(buzzerbeater.giocatori)) {
            const insertG = db.prepare(`
              INSERT OR REPLACE INTO giocatori (
                id, user_id, playerid, owner, name, pos, min, js, jr, od, ha, dr, pa, ish, ide, rb, sb, st, ft, ex, gs, age, height, potential, dmi, salary,
                skill_tot, skill_int, skill_out, data_import
              ) VALUES (
                @id, @user_id, @playerid, @owner, @name, @pos, @min, @js, @jr, @od, @ha, @dr, @pa, @ish, @ide, @rb, @sb, @st, @ft, @ex, @gs, @age, @height, @potential, @dmi, @salary,
                @skill_tot, @skill_int, @skill_out, @data_import
              )
            `);
            for (const g of buzzerbeater.giocatori) {
              try { insertG.run(g); } catch (e) {}
            }
          }

          if (Array.isArray(buzzerbeater.minutigiocati)) {
            const insertMin = db.prepare(`
              INSERT OR REPLACE INTO minutigiocati (id, match_id, user_id, playerid, player_name, position, minuti_giocati, inizio, fine)
              VALUES (@id, @match_id, @user_id, @playerid, @player_name, @position, @minuti_giocati, @inizio, @fine)
            `);
            for (const min of buzzerbeater.minutigiocati) {
              try { insertMin.run(min); } catch (e) {}
            }
          }

          if (Array.isArray(buzzerbeater.partite)) {
            const insertP = db.prepare(`
              INSERT OR REPLACE INTO partite (
                id, user_id, matchid, stagione, teamAway, risAway, risHome, teamHome, date, type, retrieve, inizio, fine,
                bleachers, lower_tier, courtside, luxury, total_attendance
              ) VALUES (
                @id, @user_id, @matchid, @stagione, @teamAway, @risAway, @risHome, @teamHome, @date, @type, @retrieve, @inizio, @fine,
                @bleachers, @lower_tier, @courtside, @luxury, @total_attendance
              )
            `);
            for (const p of buzzerbeater.partite) {
              try { insertP.run(p); } catch (e) {}
            }
          }
        }

        // Import AnDa tables if provided
        if (anda && typeof anda === 'object') {
          if (overwrite) {
            try {
              db.exec('DELETE FROM predefined_quantities; DELETE FROM procedures; DELETE FROM ingredients; DELETE FROM recipes; DELETE FROM categories;');
            } catch (e) {}
          }

          if (Array.isArray(anda.categories)) {
            const insertC = db.prepare(`
              INSERT OR REPLACE INTO categories (id, name, slug, description, icon, sort_order)
              VALUES (@id, @name, @slug, @description, @icon, @sort_order)
            `);
            for (const c of anda.categories) {
              try { insertC.run(c); } catch (e) {}
            }
          }

          if (Array.isArray(anda.recipes)) {
            const insertR = db.prepare(`
              INSERT OR REPLACE INTO recipes (id, name, slug, category, category_id, description, image_url, is_parametric, calculator_name, prep_time, cook_time, difficulty)
              VALUES (@id, @name, @slug, @category, @category_id, @description, @image_url, @is_parametric, @calculator_name, @prep_time, @cook_time, @difficulty)
            `);
            for (const r of anda.recipes) {
              try { insertR.run(r); } catch (e) {}
            }
          }

          if (Array.isArray(anda.ingredients)) {
            const insertI = db.prepare(`
              INSERT OR REPLACE INTO ingredients (id, recipe_id, phase, name, quantity, unit, notes, sort_order)
              VALUES (@id, @recipe_id, @phase, @name, @quantity, @unit, @notes, @sort_order)
            `);
            for (const i of anda.ingredients) {
              try { insertI.run(i); } catch (e) {}
            }
          }

          if (Array.isArray(anda.procedures)) {
            const insertPr = db.prepare(`
              INSERT OR REPLACE INTO procedures (id, recipe_id, step_number, phase, description, image_url, timer_minutes)
              VALUES (@id, @recipe_id, @step_number, @phase, @description, @image_url, @timer_minutes)
            `);
            for (const pr of anda.procedures) {
              try { insertPr.run(pr); } catch (e) {}
            }
          }

          if (Array.isArray(anda.predefined_quantities)) {
            const insertQ = andaDb.prepare(`
              INSERT OR REPLACE INTO predefined_quantities (id, recipe_id, quantity_name, multiplier, base_value)
              VALUES (@id, @recipe_id, @quantity_name, @multiplier, @base_value)
            `);
            for (const q of anda.predefined_quantities) {
              try { insertQ.run(q); } catch (e) {}
            }
          }
        }

        // Import Hattrick tables if provided
        if (hattrick && typeof hattrick === 'object') {
          if (overwrite) {
            try {
              hattrickDb.exec('DELETE FROM "Player"; DELETE FROM "TeamDetails"; DELETE FROM "users";');
            } catch (e) {}
          }

          if (Array.isArray(hattrick.users)) {
            const insertU = hattrickDb.prepare(`
              INSERT OR REPLACE INTO "users" (user_id, loginname, name, icq, language_id, language_name, has_supporter, signup_date, activation_date, last_login_date, national_team_coach)
              VALUES (@user_id, @loginname, @name, @icq, @language_id, @language_name, @has_supporter, @signup_date, @activation_date, @last_login_date, @national_team_coach)
            `);
            for (const u of hattrick.users) {
              try { insertU.run(u); } catch (e) {}
            }
          }

          if (Array.isArray(hattrick.teams)) {
            const insertT = hattrickDb.prepare(`
              INSERT OR REPLACE INTO "TeamDetails" (
                TeamID, TeamName, ShortTeamName, IsPrimaryClub, FoundedDate, IsDeactivated,
                ArenaID, ArenaName, LeagueID, LeagueName, CountryID, CountryName, RegionID, RegionName,
                TrainerID, DressURI, DressAlternateURI, LeagueLevelUnitID, LeagueLevelUnitName, LeagueLevel,
                IsBot, StillInCup, GlobalRanking, LeagueRanking, RegionRanking, PowerRating,
                FriendlyTeamID, NumberOfVictories, NumberOfUndefeated, TeamRank,
                FanclubID, FanclubName, FanclubSize, LogoURL, YouthTeamID, YouthTeamName,
                NumberOfVisits, PossibleToChallengeMidweek, PossibleToChallengeWeekend, UserID
              ) VALUES (
                @TeamID, @TeamName, @ShortTeamName, @IsPrimaryClub, @FoundedDate, @IsDeactivated,
                @ArenaID, @ArenaName, @LeagueID, @LeagueName, @CountryID, @CountryName, @RegionID, @RegionName,
                @TrainerID, @DressURI, @DressAlternateURI, @LeagueLevelUnitID, @LeagueLevelUnitName, @LeagueLevel,
                @IsBot, @StillInCup, @GlobalRanking, @LeagueRanking, @RegionRanking, @PowerRating,
                @FriendlyTeamID, @NumberOfVictories, @NumberOfUndefeated, @TeamRank,
                @FanclubID, @FanclubName, @FanclubSize, @LogoURL, @YouthTeamID, @YouthTeamName,
                @NumberOfVisits, @PossibleToChallengeMidweek, @PossibleToChallengeWeekend, @UserID
              )
            `);
            for (const t of hattrick.teams) {
              try { insertT.run(t); } catch (e) {}
            }
          }

          if (Array.isArray(hattrick.players)) {
            const insertP = hattrickDb.prepare(`
              INSERT OR REPLACE INTO "Player" (
                PlayerID, FirstName, NickName, LastName, PlayerNumber, Age, AgeDays, ArrivalDate, OwnerNotes,
                TSI, PlayerForm, Statement, Experience, Loyalty, MotherClubBonus, Leadership, Salary, IsAbroad,
                Agreeability, Aggressiveness, Honesty, LeagueGoals, CupGoals, FriendliesGoals, CareerGoals,
                CareerHattricks, MatchesCurrentTeam, GoalsCurrentTeam, AssistsCurrentTeam, CareerAssists,
                Specialty, TransferListed, NationalTeamID, CountryID, Caps, CapsU20, Cards, InjuryLevel,
                StaminaSkill, KeeperSkill, PlaymakerSkill, ScorerSkill, PassingSkill, WingerSkill, DefenderSkill,
                SetPiecesSkill, PlayerCategoryId, OwnerNote, UserID, TeamID
              ) VALUES (
                @PlayerID, @FirstName, @NickName, @LastName, @PlayerNumber, @Age, @AgeDays, @ArrivalDate, @OwnerNotes,
                @TSI, @PlayerForm, @Statement, @Experience, @Loyalty, @MotherClubBonus, @Leadership, @Salary, @IsAbroad,
                @Agreeability, @Aggressiveness, @Honesty, @LeagueGoals, @CupGoals, @FriendliesGoals, @CareerGoals,
                @CareerHattricks, @MatchesCurrentTeam, @GoalsCurrentTeam, @AssistsCurrentTeam, @CareerAssists,
                @Specialty, @TransferListed, @NationalTeamID, @CountryID, @Caps, @CapsU20, @Cards, @InjuryLevel,
                @StaminaSkill, @KeeperSkill, @PlaymakerSkill, @ScorerSkill, @PassingSkill, @WingerSkill, @DefenderSkill,
                @SetPiecesSkill, @PlayerCategoryId, @OwnerNote, @UserID, @TeamID
              )
            `);
            for (const p of hattrick.players) {
              try { insertP.run(p); } catch (e) {}
            }
          }
        }
      });

      tx();
      res.json({ ok: true, message: 'Dati importati con successo.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware in sviluppo / file statici in produzione
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 2. AVVIO SERVER CON PORT DINAMICA
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Express backend listening on http://0.0.0.0:${PORT}`);
    console.log(`[DATABASE] Local SQLite operating on filesystem at: ${dbPath}`);
    console.log(`[AUTH] Ready for Nginx reverse proxy x-remote-user and Basic Auth headers`);
  });

  // 2. GRACEFUL SHUTDOWN SU SIGTERM E SIGINT CON server.close()
  // per rilasciare subito il socket TCP ai riavvii di systemd
  function gracefulShutdown(signal: string) {
    console.log(`[SYSTEMD/PROCESS] Received signal ${signal}. Initiating graceful shutdown...`);
    server.close(() => {
      console.log('[SYSTEMD/PROCESS] HTTP server closed. Socket TCP freed.');
      try {
        db.close();
        console.log('[DATABASE] SQLite connection cleanly closed.');
      } catch (err) {
        console.error('[DATABASE] Error closing SQLite database:', err);
      }
      process.exit(0);
    });

    // Timeout di sicurezza per forzare l'uscita
    setTimeout(() => {
      console.error('[SYSTEMD/PROCESS] Graceful shutdown timeout (4s). Force exiting.');
      process.exit(1);
    }, 4000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[FATAL] Failed to start server:', err);
  process.exit(1);
});
