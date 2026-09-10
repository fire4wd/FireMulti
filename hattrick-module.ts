import Database, { Database as DatabaseType } from 'better-sqlite3';
import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Helper per scoprire le tabelle reali esistenti nel file SQLite
export function getTableNames(db: DatabaseType): string[] {
  try {
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
    return rows.map(r => r.name);
  } catch {
    return [];
  }
}

// Rilevamento intelligente della tabella Giocatori (priorità a tabelle con record > 0)
export function getPlayerTable(db: DatabaseType): string {
  const tables = getTableNames(db);
  if (tables.length === 0) return 'Player';

  const candidates = [
    'player', 'players', 'ht_player', 'ht_players',
    'giocatori', 'roster', 'chpp_players', 'chpp_player',
    'team_players', 'players_details'
  ];

  // 1. Cerca tabelle candidate che abbiano effettivi record (> 0)
  const matches = tables.filter(t => candidates.includes(t.toLowerCase()));
  if (matches.length > 0) {
    let best = matches[0];
    let maxCount = -1;
    for (const m of matches) {
      try {
        const c = (db.prepare(`SELECT COUNT(*) as c FROM "${m}"`).get() as any)?.c || 0;
        if (c > maxCount) {
          maxCount = c;
          best = m;
        }
      } catch {}
    }
    if (maxCount > 0) return best;
  }

  // 2. Ispezione intelligente colonne di TUTTE le tabelle: cerca colonne tipiche di Hattrick
  for (const t of tables) {
    try {
      const cols = (db.prepare(`PRAGMA table_info("${t}")`).all() as any[]).map(c => c.name.toLowerCase());
      if (
        cols.includes('tsi') ||
        cols.includes('playerid') ||
        cols.includes('player_id') ||
        (cols.includes('firstname') && cols.includes('lastname')) ||
        (cols.includes('first_name') && cols.includes('last_name'))
      ) {
        return t;
      }
    } catch {}
  }

  return matches[0] || tables[0] || 'Player';
}

// Rilevamento intelligente della tabella Club/Squadra
export function getTeamTable(db: DatabaseType): string {
  const tables = getTableNames(db);
  if (tables.length === 0) return 'TeamDetails';

  const candidates = [
    'teamdetails', 'team_details', 'teams', 'team',
    'ht_teams', 'ht_team', 'clubs', 'club', 'squadra', 'squadre'
  ];

  const matches = tables.filter(t => candidates.includes(t.toLowerCase()));
  if (matches.length > 0) {
    let best = matches[0];
    let maxCount = -1;
    for (const m of matches) {
      try {
        const c = (db.prepare(`SELECT COUNT(*) as c FROM "${m}"`).get() as any)?.c || 0;
        if (c > maxCount) {
          maxCount = c;
          best = m;
        }
      } catch {}
    }
    if (maxCount > 0) return best;
  }

  for (const t of tables) {
    try {
      const cols = (db.prepare(`PRAGMA table_info("${t}")`).all() as any[]).map(c => c.name.toLowerCase());
      if (
        cols.includes('teamid') ||
        cols.includes('team_id') ||
        cols.includes('teamname') ||
        cols.includes('team_name') ||
        cols.includes('shortteamname')
      ) {
        return t;
      }
    } catch {}
  }

  return matches[0] || 'TeamDetails';
}

// Rilevamento intelligente della tabella Utenti/Manager
export function getUserTable(db: DatabaseType): string {
  const tables = getTableNames(db);
  if (tables.length === 0) return 'users';

  const candidates = ['users', 'user', 'ht_users', 'ht_user', 'utenti', 'utente', 'manager'];
  const matches = tables.filter(t => candidates.includes(t.toLowerCase()));
  if (matches.length > 0) {
    let best = matches[0];
    let maxCount = -1;
    for (const m of matches) {
      try {
        const c = (db.prepare(`SELECT COUNT(*) as c FROM "${m}"`).get() as any)?.c || 0;
        if (c > maxCount) {
          maxCount = c;
          best = m;
        }
      } catch {}
    }
    if (maxCount > 0) return best;
  }

  for (const t of tables) {
    try {
      const cols = (db.prepare(`PRAGMA table_info("${t}")`).all() as any[]).map(c => c.name.toLowerCase());
      if (
        cols.includes('user_id') ||
        cols.includes('userid') ||
        cols.includes('loginname') ||
        cols.includes('username')
      ) {
        return t;
      }
    } catch {}
  }

  return matches[0] || 'users';
}

// Helper per scansionare candidati DB presenti sul server
export function scanCandidateDbs(currentPath: string) {
  const possiblePaths = [
    currentPath,
    '/home/fire/bots/FireHt/fireht.db',
    '/home/fire/bots/FireHt/data/fireht.db',
    '/home/fire/bots/FireHt/FireHt.db',
    '/home/fire/bots/FireHt/data/FireHt.db',
    '/home/fire/bots/FireHt/data/hattrick.db',
    '/home/fire/bots/FireHt/hattrick.db',
    '/home/fire/bots/FireHt/fireht.sqlite',
    '/home/fire/bots/FireHt/fireht.sqlite3',
    path.join(process.cwd(), 'data', 'hattrick.db')
  ];

  const unique = Array.from(new Set(possiblePaths.map(p => path.resolve(p))));
  const results: any[] = [];

  for (const p of unique) {
    try {
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        if (stat.isFile()) {
          const sizeKB = Math.round((stat.size / 1024) * 10) / 10;
          let tableCount = 0;
          let playersCount = 0;
          let tables: string[] = [];
          try {
            const tempDb = new Database(p, { readonly: true, fileMustExist: true });
            try { tempDb.pragma('wal_checkpoint(PASSIVE)'); } catch {}
            const rows = tempDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
            tables = rows.map(r => r.name);
            tableCount = tables.length;
            const pTable = getPlayerTable(tempDb);
            if (tables.includes(pTable)) {
              playersCount = (tempDb.prepare(`SELECT COUNT(*) as c FROM "${pTable}"`).get() as any)?.c || 0;
            }
            tempDb.close();
          } catch {}

          results.push({
            path: p,
            sizeKB,
            tableCount,
            playersCount,
            tables,
            isCurrent: path.resolve(p) === path.resolve(currentPath)
          });
        }
      }
    } catch {}
  }
  return results;
}

// Helper per elencare i file presenti nella cartella genitrice (per scoprire differenze di case o file .db-wal)
export function getSiblingFiles(filePath: string) {
  try {
    const dir = path.dirname(path.resolve(filePath));
    if (!fs.existsSync(dir)) {
      return { dir, exists: false, files: [] };
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries.map(e => {
      let sizeKB = 0;
      try {
        if (!e.isDirectory()) {
          sizeKB = Math.round((fs.statSync(path.join(dir, e.name)).size / 1024) * 10) / 10;
        }
      } catch {}
      return {
        name: e.name,
        isDirectory: e.isDirectory(),
        sizeKB
      };
    });
    return { dir, exists: true, files };
  } catch {
    return { dir: path.dirname(filePath), exists: false, files: [] };
  }
}

// Normalizza i record dei giocatori supportando sia nomi colonna PascalCase (standard CHPP) sia snake_case (bot/Python)
export function normalizePlayerRow(p: any): any {
  if (!p) return null;
  const getVal = (...keys: string[]) => {
    for (const k of keys) {
      if (p[k] !== undefined && p[k] !== null) return p[k];
      const foundKey = Object.keys(p).find(pk => pk.toLowerCase() === k.toLowerCase());
      if (foundKey && p[foundKey] !== undefined && p[foundKey] !== null) return p[foundKey];
    }
    return undefined;
  };

  const PlayerID = Number(getVal('PlayerID', 'player_id', 'id', 'playerId') || 0);
  const FirstName = String(getVal('FirstName', 'first_name', 'firstName', 'name') || '');
  const NickName = String(getVal('NickName', 'nick_name', 'nickName', 'nickname') || '');
  const LastName = String(getVal('LastName', 'last_name', 'lastName', 'surname') || '');
  const PlayerNumber = Number(getVal('PlayerNumber', 'player_number', 'number', 'shirt_number') || 0);
  const Age = Number(getVal('Age', 'age') || 20);
  const AgeDays = Number(getVal('AgeDays', 'age_days', 'days') || 0);
  const ArrivalDate = String(getVal('ArrivalDate', 'arrival_date', 'joined') || '');
  const OwnerNotes = String(getVal('OwnerNotes', 'OwnerNote', 'owner_notes', 'owner_note', 'notes') || '');
  const TSI = Number(getVal('TSI', 'tsi') || 0);
  const PlayerForm = Number(getVal('PlayerForm', 'player_form', 'form') || 5);
  const Statement = String(getVal('Statement', 'statement') || '');
  const Experience = Number(getVal('Experience', 'experience', 'exp') || 1);
  const Loyalty = Number(getVal('Loyalty', 'loyalty') || 1);
  const MotherClubBonus = Boolean(getVal('MotherClubBonus', 'mother_club_bonus') || 0);
  const Leadership = Number(getVal('Leadership', 'leadership') || 1);
  const Salary = Number(getVal('Salary', 'salary', 'wage') || 0);
  const IsAbroad = Boolean(getVal('IsAbroad', 'is_abroad') || 0);
  const Agreeability = Number(getVal('Agreeability', 'agreeability') || 3);
  const Aggressiveness = Number(getVal('Aggressiveness', 'aggressiveness') || 2);
  const Honesty = Number(getVal('Honesty', 'honesty') || 3);
  const LeagueGoals = Number(getVal('LeagueGoals', 'league_goals') || 0);
  const CupGoals = Number(getVal('CupGoals', 'cup_goals') || 0);
  const FriendliesGoals = Number(getVal('FriendliesGoals', 'friendlies_goals') || 0);
  const CareerGoals = Number(getVal('CareerGoals', 'career_goals', 'goals') || (LeagueGoals + CupGoals + FriendliesGoals));
  const CareerHattricks = Number(getVal('CareerHattricks', 'career_hattricks') || 0);
  const MatchesCurrentTeam = Number(getVal('MatchesCurrentTeam', 'matches_current_team') || 0);
  const GoalsCurrentTeam = Number(getVal('GoalsCurrentTeam', 'goals_current_team') || 0);
  const AssistsCurrentTeam = Number(getVal('AssistsCurrentTeam', 'assists_current_team') || 0);
  const CareerAssists = Number(getVal('CareerAssists', 'career_assists') || AssistsCurrentTeam);
  const Specialty = Number(getVal('Specialty', 'specialty') || 0);
  const TransferListed = Boolean(getVal('TransferListed', 'transfer_listed') || 0);
  const NationalTeamID = Number(getVal('NationalTeamID', 'national_team_id') || 0);
  const CountryID = Number(getVal('CountryID', 'country_id') || 0);
  const Caps = Number(getVal('Caps', 'caps') || 0);
  const CapsU20 = Number(getVal('CapsU20', 'caps_u20') || 0);
  const Cards = Number(getVal('Cards', 'cards') || 0);
  const InjuryLevel = Number(getVal('InjuryLevel', 'injury_level') || 0);
  const StaminaSkill = Number(getVal('StaminaSkill', 'stamina_skill', 'stamina') || 1);
  const KeeperSkill = Number(getVal('KeeperSkill', 'keeper_skill', 'keeper') || 1);
  const PlaymakerSkill = Number(getVal('PlaymakerSkill', 'playmaker_skill', 'playmaker', 'regia') || 1);
  const ScorerSkill = Number(getVal('ScorerSkill', 'scorer_skill', 'scorer', 'attacco') || 1);
  const PassingSkill = Number(getVal('PassingSkill', 'passing_skill', 'passing', 'passaggi') || 1);
  const WingerSkill = Number(getVal('WingerSkill', 'winger_skill', 'winger', 'cross') || 1);
  const DefenderSkill = Number(getVal('DefenderSkill', 'defender_skill', 'defender', 'difesa') || 1);
  const SetPiecesSkill = Number(getVal('SetPiecesSkill', 'set_pieces_skill', 'setpieces', 'piazzati') || 1);
  const PlayerCategoryId = Number(getVal('PlayerCategoryId', 'player_category_id') || 1);
  const UserID = Number(getVal('UserID', 'user_id') || 0);
  const TeamID = Number(getVal('TeamID', 'team_id') || 0);

  return {
    ...p,
    PlayerID,
    FirstName,
    NickName,
    LastName,
    PlayerNumber,
    Age,
    AgeDays,
    ArrivalDate,
    OwnerNotes,
    TSI,
    PlayerForm,
    Statement,
    Experience,
    Loyalty,
    MotherClubBonus,
    Leadership,
    Salary,
    IsAbroad,
    Agreeability,
    Aggressiveness,
    Honesty,
    LeagueGoals,
    CupGoals,
    FriendliesGoals,
    CareerGoals,
    CareerHattricks,
    MatchesCurrentTeam,
    GoalsCurrentTeam,
    AssistsCurrentTeam,
    CareerAssists,
    Specialty,
    TransferListed,
    NationalTeamID,
    CountryID,
    Caps,
    CapsU20,
    Cards,
    InjuryLevel,
    StaminaSkill,
    KeeperSkill,
    PlaymakerSkill,
    ScorerSkill,
    PassingSkill,
    WingerSkill,
    DefenderSkill,
    SetPiecesSkill,
    PlayerCategoryId,
    OwnerNote: OwnerNotes,
    UserID,
    TeamID
  };
}

export function normalizeTeamRow(t: any): any {
  if (!t) return null;
  const getVal = (...keys: string[]) => {
    for (const k of keys) {
      if (t[k] !== undefined && t[k] !== null) return t[k];
      const foundKey = Object.keys(t).find(pk => pk.toLowerCase() === k.toLowerCase());
      if (foundKey && t[foundKey] !== undefined && t[foundKey] !== null) return t[foundKey];
    }
    return undefined;
  };

  return {
    ...t,
    TeamID: Number(getVal('TeamID', 'team_id', 'id') || 0),
    TeamName: String(getVal('TeamName', 'team_name', 'name') || 'Club Hattrick'),
    ShortTeamName: String(getVal('ShortTeamName', 'short_team_name', 'short_name') || 'HT'),
    IsPrimaryClub: Boolean(getVal('IsPrimaryClub', 'is_primary_club') ?? 1),
    FoundedDate: String(getVal('FoundedDate', 'founded_date') || ''),
    IsDeactivated: Boolean(getVal('IsDeactivated', 'is_deactivated') ?? 0),
    ArenaID: Number(getVal('ArenaID', 'arena_id') || 0),
    ArenaName: String(getVal('ArenaName', 'arena_name') || 'Stadio Club'),
    LeagueID: Number(getVal('LeagueID', 'league_id') || 0),
    LeagueName: String(getVal('LeagueName', 'league_name') || 'Italia'),
    CountryID: Number(getVal('CountryID', 'country_id') || 0),
    CountryName: String(getVal('CountryName', 'country_name') || 'Italia'),
    RegionID: Number(getVal('RegionID', 'region_id') || 0),
    RegionName: String(getVal('RegionName', 'region_name') || ''),
    TrainerID: Number(getVal('TrainerID', 'trainer_id') || 0),
    DressURI: String(getVal('DressURI', 'dress_uri') || ''),
    DressAlternateURI: String(getVal('DressAlternateURI', 'dress_alternate_uri') || ''),
    LeagueLevelUnitID: Number(getVal('LeagueLevelUnitID', 'league_level_unit_id') || 0),
    LeagueLevelUnitName: String(getVal('LeagueLevelUnitName', 'league_level_unit_name') || 'Serie V'),
    LeagueLevel: Number(getVal('LeagueLevel', 'league_level') || 5),
    IsBot: Boolean(getVal('IsBot', 'is_bot') ?? 0),
    StillInCup: Boolean(getVal('StillInCup', 'still_in_cup') ?? 1),
    GlobalRanking: Number(getVal('GlobalRanking', 'global_ranking') || 0),
    LeagueRanking: Number(getVal('LeagueRanking', 'league_ranking') || 1),
    RegionRanking: Number(getVal('RegionRanking', 'region_ranking') || 1),
    PowerRating: Number(getVal('PowerRating', 'power_rating') || 0),
    FriendlyTeamID: Number(getVal('FriendlyTeamID', 'friendly_team_id') || 0),
    NumberOfVictories: Number(getVal('NumberOfVictories', 'number_of_victories', 'victories') || 0),
    NumberOfUndefeated: Number(getVal('NumberOfUndefeated', 'number_of_undefeated', 'undefeated') || 0),
    TeamRank: Number(getVal('TeamRank', 'team_rank') || 1),
    FanclubID: Number(getVal('FanclubID', 'fanclub_id') || 0),
    FanclubName: String(getVal('FanclubName', 'fanclub_name') || 'Club Tifosi'),
    FanclubSize: Number(getVal('FanclubSize', 'fanclub_size') || 0),
    LogoURL: String(getVal('LogoURL', 'logo_url') || ''),
    YouthTeamID: Number(getVal('YouthTeamID', 'youth_team_id') || 0),
    YouthTeamName: String(getVal('YouthTeamName', 'youth_team_name') || 'Primavera'),
    NumberOfVisits: Number(getVal('NumberOfVisits', 'number_of_visits') || 0),
    PossibleToChallengeMidweek: Boolean(getVal('PossibleToChallengeMidweek', 'possible_to_challenge_midweek') ?? 1),
    PossibleToChallengeWeekend: Boolean(getVal('PossibleToChallengeWeekend', 'possible_to_challenge_weekend') ?? 1),
    UserID: Number(getVal('UserID', 'user_id') || 0)
  };
}

export function normalizeUserRow(u: any): any {
  if (!u) return null;
  const getVal = (...keys: string[]) => {
    for (const k of keys) {
      if (u[k] !== undefined && u[k] !== null) return u[k];
      const foundKey = Object.keys(u).find(pk => pk.toLowerCase() === k.toLowerCase());
      if (foundKey && u[foundKey] !== undefined && u[foundKey] !== null) return u[foundKey];
    }
    return undefined;
  };

  return {
    ...u,
    user_id: Number(getVal('user_id', 'UserID', 'id') || 0),
    loginname: String(getVal('loginname', 'username', 'LoginName', 'login') || 'Mister'),
    name: String(getVal('name', 'Name', 'fullname') || ''),
    icq: String(getVal('icq', 'ICQ') || ''),
    language_id: Number(getVal('language_id', 'LanguageID') || 4),
    language_name: String(getVal('language_name', 'LanguageName') || 'Italiano'),
    has_supporter: Boolean(getVal('has_supporter', 'HasSupporter') || 0),
    signup_date: String(getVal('signup_date', 'SignupDate') || ''),
    activation_date: String(getVal('activation_date', 'ActivationDate') || ''),
    last_login_date: String(getVal('last_login_date', 'LastLoginDate') || ''),
    national_team_coach: String(getVal('national_team_coach', 'NationalTeamCoach') || '')
  };
}

export function setupHattrick(initialDb: DatabaseType, initialDbFilePath?: string, envVarName?: string): Router {
  const router = Router();

  let db = initialDb;
  let dbFilePath = initialDbFilePath || 'hattrick.db';

  // Checkpoint passivo iniziale per allineare file WAL
  try {
    db.pragma('wal_checkpoint(PASSIVE)');
  } catch (err: any) {
    console.warn('[HATTRICK] Avviso checkpoint WAL iniziale:', err.message);
  }

  // 1. INIZIALIZZAZIONE SCHEMA
  // CRUCIALE: Eseguiamo CREATE TABLE solo se il file non contiene già tabelle!
  // In questo modo, se il database ha già tabelle come "players" o "giocatori",
  // non creiamo tabelle ombra vuote ("Player") che oscurerebbero i dati reali del bot!
  const initialTables = getTableNames(db);
  if (initialTables.length === 0) {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS "users" (
          "user_id" INTEGER NOT NULL PRIMARY KEY, 
          "loginname" VARCHAR(50) NOT NULL, 
          "name" VARCHAR(100), 
          "icq" VARCHAR(20), 
          "language_id" INTEGER, 
          "language_name" VARCHAR(50), 
          "has_supporter" BOOLEAN, 
          "signup_date" DATETIME, 
          "activation_date" DATETIME, 
          "last_login_date" DATETIME, 
          "national_team_coach" VARCHAR(100)
        );

        CREATE TABLE IF NOT EXISTS "TeamDetails" (
          "TeamID" INTEGER NOT NULL PRIMARY KEY, 
          "TeamName" VARCHAR, 
          "ShortTeamName" VARCHAR, 
          "IsPrimaryClub" BOOLEAN, 
          "FoundedDate" DATETIME, 
          "IsDeactivated" BOOLEAN, 
          "ArenaID" INTEGER, 
          "ArenaName" VARCHAR, 
          "LeagueID" INTEGER, 
          "LeagueName" VARCHAR, 
          "CountryID" INTEGER, 
          "CountryName" VARCHAR, 
          "RegionID" INTEGER, 
          "RegionName" VARCHAR, 
          "TrainerID" INTEGER, 
          "DressURI" VARCHAR, 
          "DressAlternateURI" VARCHAR, 
          "LeagueLevelUnitID" INTEGER, 
          "LeagueLevelUnitName" VARCHAR, 
          "LeagueLevel" INTEGER, 
          "IsBot" BOOLEAN, 
          "StillInCup" BOOLEAN, 
          "GlobalRanking" INTEGER, 
          "LeagueRanking" INTEGER, 
          "RegionRanking" INTEGER, 
          "PowerRating" INTEGER, 
          "FriendlyTeamID" INTEGER, 
          "NumberOfVictories" INTEGER, 
          "NumberOfUndefeated" INTEGER, 
          "TeamRank" INTEGER, 
          "FanclubID" INTEGER, 
          "FanclubName" VARCHAR, 
          "FanclubSize" INTEGER, 
          "LogoURL" VARCHAR, 
          "YouthTeamID" INTEGER, 
          "YouthTeamName" VARCHAR, 
          "NumberOfVisits" INTEGER, 
          "PossibleToChallengeMidweek" BOOLEAN, 
          "PossibleToChallengeWeekend" BOOLEAN, 
          "UserID" INTEGER, 
          FOREIGN KEY("UserID") REFERENCES "users" ("user_id")
        );

        CREATE TABLE IF NOT EXISTS "Player" (
          "PlayerID" INTEGER NOT NULL PRIMARY KEY, 
          "FirstName" VARCHAR, 
          "NickName" VARCHAR, 
          "LastName" VARCHAR, 
          "PlayerNumber" INTEGER, 
          "Age" INTEGER, 
          "AgeDays" INTEGER, 
          "ArrivalDate" DATETIME, 
          "OwnerNotes" VARCHAR, 
          "TSI" INTEGER, 
          "PlayerForm" INTEGER, 
          "Statement" VARCHAR, 
          "Experience" INTEGER, 
          "Loyalty" INTEGER, 
          "MotherClubBonus" BOOLEAN, 
          "Leadership" INTEGER, 
          "Salary" INTEGER, 
          "IsAbroad" BOOLEAN, 
          "Agreeability" INTEGER, 
          "Aggressiveness" INTEGER, 
          "Honesty" INTEGER, 
          "LeagueGoals" INTEGER, 
          "CupGoals" INTEGER, 
          "FriendliesGoals" INTEGER, 
          "CareerGoals" INTEGER, 
          "CareerHattricks" INTEGER, 
          "MatchesCurrentTeam" INTEGER, 
          "GoalsCurrentTeam" INTEGER, 
          "AssistsCurrentTeam" INTEGER, 
          "CareerAssists" INTEGER, 
          "Specialty" INTEGER, 
          "TransferListed" BOOLEAN, 
          "NationalTeamID" INTEGER, 
          "CountryID" INTEGER, 
          "Caps" INTEGER, 
          "CapsU20" INTEGER, 
          "Cards" INTEGER, 
          "InjuryLevel" INTEGER, 
          "StaminaSkill" INTEGER, 
          "KeeperSkill" INTEGER, 
          "PlaymakerSkill" INTEGER, 
          "ScorerSkill" INTEGER, 
          "PassingSkill" INTEGER, 
          "WingerSkill" INTEGER, 
          "DefenderSkill" INTEGER, 
          "SetPiecesSkill" INTEGER, 
          "PlayerCategoryId" INTEGER, 
          "OwnerNote" VARCHAR, 
          "UserID" INTEGER, 
          "TeamID" INTEGER, 
          FOREIGN KEY("UserID") REFERENCES "users" ("user_id"), 
          FOREIGN KEY("TeamID") REFERENCES "TeamDetails" ("TeamID")
        );

        CREATE INDEX IF NOT EXISTS "ix_players_skills" ON "Player" ("PlaymakerSkill", "ScorerSkill", "DefenderSkill");
        CREATE INDEX IF NOT EXISTS "ix_players_team" ON "Player" ("TeamID");
        CREATE INDEX IF NOT EXISTS "ix_players_user" ON "Player" ("UserID");
      `);

      seedHattrickDemo(db);
    } catch (err: any) {
      console.warn('[HATTRICK] Avviso inizializzazione tabelle:', err.message);
    }
  }

  // 2. ENDPOINTS

  // Info database e connessione (trasparenza totale su DB e percorsi)
  router.get('/db-info', (req: Request, res: Response) => {
    try {
      let fileSizeKB = 0;
      let fileSizeBytes = 0;
      let fileMtime = '';
      const exists = Boolean(dbFilePath && fs.existsSync(dbFilePath));
      if (exists && dbFilePath) {
        try {
          const st = fs.statSync(dbFilePath);
          fileSizeBytes = st.size;
          fileSizeKB = Math.round((st.size / 1024) * 10) / 10;
          fileMtime = st.mtime.toISOString();
        } catch {}
      }

      // Checkpoint WAL passivo prima di leggere conteggi
      try { db.pragma('wal_checkpoint(PASSIVE)'); } catch {}

      const tables = getTableNames(db);
      const playerTable = getPlayerTable(db);
      const teamTable = getTeamTable(db);
      const userTable = getUserTable(db);

      let totalPlayers = 0;
      let totalTeams = 0;
      let totalUsers = 0;

      try { totalPlayers = (db.prepare(`SELECT COUNT(*) as c FROM "${playerTable}"`).get() as any)?.c || 0; } catch {}
      try { totalTeams = (db.prepare(`SELECT COUNT(*) as c FROM "${teamTable}"`).get() as any)?.c || 0; } catch {}
      try { totalUsers = (db.prepare(`SELECT COUNT(*) as c FROM "${userTable}"`).get() as any)?.c || 0; } catch {}

      const tableCounts: Record<string, number> = {};
      for (const t of tables) {
        try {
          tableCounts[t] = (db.prepare(`SELECT COUNT(*) as c FROM "${t}"`).get() as any)?.c || 0;
        } catch {
          tableCounts[t] = -1;
        }
      }

      let pragmaDbList: any[] = [];
      try {
        pragmaDbList = db.prepare("PRAGMA database_list").all();
      } catch {}

      let sqliteVersion = '';
      try {
        sqliteVersion = (db.prepare("SELECT sqlite_version() as v").get() as any)?.v || '';
      } catch {}

      const siblings = getSiblingFiles(dbFilePath);
      const candidates = scanCandidateDbs(dbFilePath);

      const walPath = `${dbFilePath}-wal`;
      const shmPath = `${dbFilePath}-shm`;
      const walExists = fs.existsSync(walPath);
      const walSizeKB = walExists ? Math.round((fs.statSync(walPath).size / 1024) * 10) / 10 : 0;
      const shmExists = fs.existsSync(shmPath);

      res.json({
        module: 'hattrick',
        dbFilePath: dbFilePath || 'hattrick.db',
        resolvedPath: path.resolve(dbFilePath),
        dbExists: exists,
        fileSizeKB,
        fileSizeBytes,
        fileMtime,
        envVarUsed: envVarName || 'FIREHT_DB_PATH',
        sqliteVersion,
        pragmaDbList,
        siblings,
        candidates,
        walFile: {
          exists: walExists,
          path: walPath,
          sizeKB: walSizeKB
        },
        shmFile: {
          exists: shmExists,
          path: shmPath
        },
        detectedTables: {
          playerTable,
          teamTable,
          userTable
        },
        totalPlayers,
        totalTeams,
        totalUsers,
        tables,
        tableCounts,
        isSeparateDb: true
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Schema Inspector & Elenco Query Eseguite (per chiarire al 100% cosa fa il modulo)
  router.get('/inspect', (req: Request, res: Response) => {
    try {
      const exists = Boolean(dbFilePath && fs.existsSync(dbFilePath));
      let fileSizeKB = 0;
      if (exists && dbFilePath) {
        fileSizeKB = Math.round((fs.statSync(dbFilePath).size / 1024) * 10) / 10;
      }

      const tableNames = getTableNames(db);
      const tablesInfo = tableNames.map((tableName) => {
        let count = 0;
        let columns: any[] = [];
        let sampleRows: any[] = [];
        try {
          count = (db.prepare(`SELECT COUNT(*) as c FROM "${tableName}"`).get() as any)?.c || 0;
        } catch {}
        try {
          columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
        } catch {}
        try {
          sampleRows = db.prepare(`SELECT * FROM "${tableName}" LIMIT 3`).all();
        } catch {}
        return {
          name: tableName,
          count,
          columns,
          sampleRows
        };
      });

      const playerTable = getPlayerTable(db);
      const teamTable = getTeamTable(db);
      const userTable = getUserTable(db);

      const registeredQueries = [
        {
          name: 'Squad / Rosa Giocatori',
          endpoint: 'GET /api/hattrick/players',
          sql: `SELECT * FROM "${playerTable}" WHERE 1=1 [filtri: search, minTsi, injured, transferListed] ORDER BY [colonna] [ASC|DESC]`,
          purpose: 'Recupera la lista dei giocatori, applica i filtri e calcola in tempo reale le valutazioni per ruolo (GK, CD, WB, IM, W, FW) e le stelle stimate.',
          targetTable: playerTable
        },
        {
          name: 'Dettagli Club & Società',
          endpoint: 'GET /api/hattrick/team',
          sql: `SELECT * FROM "${teamTable}" LIMIT 1`,
          purpose: 'Recupera i metadati societari del club (nome squadra, stadio, ranking, livello campionato, tifosi, ecc.).',
          targetTable: teamTable
        },
        {
          name: 'Dati Utente / Allenatore',
          endpoint: 'GET /api/hattrick/team (sub-query)',
          sql: `SELECT * FROM "${userTable}" WHERE user_id = [team.UserID] LIMIT 1`,
          purpose: "Recupera le informazioni dell'account utente proprietario del club.",
          targetTable: userTable
        },
        {
          name: 'Statistiche Aggregate Squadra',
          endpoint: 'GET /api/hattrick/stats',
          sql: `SELECT * FROM "${playerTable}"; SELECT * FROM "${teamTable}" LIMIT 1;`,
          purpose: 'Calcola TSI totale, stipendi settimanali, età media, capocannoniere, top TSI e distribuzione ruoli.',
          targetTable: playerTable
        },
        {
          name: 'Formazione Ottimale (Best XI Pitch)',
          endpoint: 'GET /api/hattrick/best-xi?formation=[modulo]',
          sql: `SELECT * FROM "${playerTable}" WHERE InjuryLevel <> 1`,
          purpose: 'Seleziona gli 11 migliori giocatori disponibili in base al modulo tattico scelto (es. 3-5-2, 4-4-2, 2-5-3, 4-5-1).',
          targetTable: playerTable
        },
        {
          name: 'Dettaglio Singolo Giocatore',
          endpoint: 'GET /api/hattrick/players/:id',
          sql: `SELECT * FROM "${playerTable}" WHERE PlayerID = ?`,
          purpose: 'Carica la scheda completa di un giocatore con tutte le abilità, forma, esperienza, specialità e statistiche carriera.',
          targetTable: playerTable
        },
        {
          name: 'Verifica & Conteggi DB',
          endpoint: 'GET /api/hattrick/db-info',
          sql: `SELECT COUNT(*) FROM "${playerTable}"; SELECT COUNT(*) FROM "${teamTable}"; SELECT COUNT(*) FROM "${userTable}";`,
          purpose: 'Restituisce i conteggi rapidi per verificare lo stato di popolamento del database.',
          targetTable: `${playerTable}, ${teamTable}, ${userTable}`
        }
      ];

      res.json({
        dbFilePath: dbFilePath || 'hattrick.db',
        dbExists: exists,
        fileSizeKB,
        envVarUsed: envVarName || 'FIREHT_DB_PATH',
        detectedTables: {
          playerTable,
          teamTable,
          userTable
        },
        tables: tablesInfo,
        queries: registeredQueries
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Query Runner di Sola Lettura: permette all'utente di ispezionare il DB in tempo reale dal frontend!
  router.post('/query', (req: Request, res: Response) => {
    try {
      const { sql } = req.body;
      if (!sql || typeof sql !== 'string') {
        return res.status(400).json({ error: 'Parametro sql obbligatorio' });
      }

      const trimmed = sql.trim();
      const upper = trimmed.toUpperCase();
      const isReadOnly = upper.startsWith('SELECT') || upper.startsWith('PRAGMA') || upper.startsWith('EXPLAIN') || upper.startsWith('WITH');
      if (!isReadOnly) {
        return res.status(403).json({ error: 'Solo query di sola lettura (SELECT, PRAGMA, EXPLAIN, WITH) sono consentite dal Query Inspector.' });
      }

      const t0 = Date.now();
      const rows = db.prepare(trimmed).all();
      const durationMs = Date.now() - t0;
      const columns = rows.length > 0 ? Object.keys(rows[0] as object) : [];

      let pragmaFile = '';
      try {
        const dblist = db.prepare("PRAGMA database_list").all() as any[];
        pragmaFile = dblist.find(d => d.name === 'main')?.file || '';
      } catch {}

      res.json({
        ok: true,
        sql: trimmed,
        count: rows.length,
        durationMs,
        columns,
        rows,
        activeDbPath: dbFilePath,
        sqliteFileAttached: pragmaFile
      });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  // Esecuzione Checkpoint WAL esplicito (sincronizza eventuali transazioni pendenti da bot esterni)
  router.post('/checkpoint', (req: Request, res: Response) => {
    try {
      const result = db.pragma('wal_checkpoint(PASSIVE)');
      const tables = getTableNames(db);
      const playerTable = getPlayerTable(db);
      let playersCount = 0;
      try {
        playersCount = (db.prepare(`SELECT COUNT(*) as c FROM "${playerTable}"`).get() as any)?.c || 0;
      } catch {}

      res.json({
        ok: true,
        result,
        message: 'Checkpoint WAL passivo eseguito con successo',
        activeDbPath: dbFilePath,
        tables,
        playerTable,
        playersCount
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Switch dinamico DB in tempo reale (per testare altri percorsi sul server senza riavviare il processo)
  router.post('/switch-db', (req: Request, res: Response) => {
    try {
      const { newPath } = req.body;
      if (!newPath || typeof newPath !== 'string') {
        return res.status(400).json({ ok: false, error: 'Parametro newPath obbligatorio' });
      }

      let p = newPath.trim().replace(/^["']+|["']+$/g, '').trim();
      if (p.startsWith('~')) {
        const home = process.env.HOME || '/home/fire';
        p = path.join(home, p.slice(1));
      }
      const resolved = path.resolve(p);

      if (!fs.existsSync(resolved)) {
        return res.status(404).json({
          ok: false,
          error: `Il file specificato non esiste: ${resolved}. Verifica il percorso esatto sul filesystem.`
        });
      }

      // Prova ad aprire il nuovo database
      const newDb = new Database(resolved);
      newDb.pragma('journal_mode = WAL');
      newDb.pragma('foreign_keys = OFF');
      try { newDb.pragma('wal_checkpoint(PASSIVE)'); } catch {}

      const tables = getTableNames(newDb);
      const playerTable = getPlayerTable(newDb);
      let playersCount = 0;
      try {
        playersCount = (newDb.prepare(`SELECT COUNT(*) as c FROM "${playerTable}"`).get() as any)?.c || 0;
      } catch {}

      // Sostituisce il DB attivo per le chiamate successive
      db = newDb;
      dbFilePath = resolved;

      res.json({
        ok: true,
        message: `Database Hattrick collegato con successo al percorso: ${resolved}`,
        activeDbPath: resolved,
        tableCount: tables.length,
        tables,
        playerTable,
        playersCount
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Dettagli Club & Utente
  router.get('/team', (req: Request, res: Response) => {
    try {
      const teamTable = getTeamTable(db);
      const userTable = getUserTable(db);

      let team: any = null;
      try {
        const rawTeam = db.prepare(`SELECT * FROM "${teamTable}" LIMIT 1`).get() as any;
        if (rawTeam) {
          team = normalizeTeamRow(rawTeam);
        }
      } catch (e: any) {
        console.warn(`[HATTRICK] Errore lettura tabella ${teamTable}:`, e.message);
      }

      if (!team) {
        return res.json({
          team: null,
          user: null,
          message: `Nessun record trovato nella tabella "${teamTable}". Il file database è aperto ma la tabella non contiene righe.`
        });
      }

      let user: any = null;
      try {
        const rawUser = db.prepare(`SELECT * FROM "${userTable}" WHERE user_id = ? OR UserID = ? LIMIT 1`).get(team.UserID, team.UserID) as any;
        if (rawUser) {
          user = normalizeUserRow(rawUser);
        }
      } catch {}

      res.json({ team, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message, query: `SELECT * FROM "${getTeamTable(db)}" LIMIT 1` });
    }
  });

  // Aggiorna Dettagli Club
  router.put('/team/:id', (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id, 10);
      const teamTable = getTeamTable(db);
      const {
        TeamName,
        ShortTeamName,
        ArenaName,
        LeagueLevelUnitName,
        FanclubName,
        YouthTeamName,
        LogoURL
      } = req.body;

      db.prepare(`
        UPDATE "${teamTable}"
        SET TeamName = COALESCE(?, TeamName),
            ShortTeamName = COALESCE(?, ShortTeamName),
            ArenaName = COALESCE(?, ArenaName),
            LeagueLevelUnitName = COALESCE(?, LeagueLevelUnitName),
            FanclubName = COALESCE(?, FanclubName),
            YouthTeamName = COALESCE(?, YouthTeamName),
            LogoURL = COALESCE(?, LogoURL)
        WHERE TeamID = ?
      `).run(TeamName, ShortTeamName, ArenaName, LeagueLevelUnitName, FanclubName, YouthTeamName, LogoURL, teamId);

      const updated = db.prepare(`SELECT * FROM "${teamTable}" WHERE TeamID = ?`).get(teamId);
      res.json(normalizeTeamRow(updated));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Lista Giocatori con filtri e calcolo ruolo ideale
  router.get('/players', (req: Request, res: Response) => {
    try {
      const playerTable = getPlayerTable(db);
      const { search, role, minTsi, injured, transferListed, sortBy = 'TSI', sortOrder = 'DESC' } = req.query;

      let query = `SELECT * FROM "${playerTable}" WHERE 1=1`;
      const params: any[] = [];

      if (search && typeof search === 'string' && search.trim()) {
        query += ' AND (FirstName LIKE ? OR LastName LIKE ? OR NickName LIKE ?)';
        const term = `%${search.trim()}%`;
        params.push(term, term, term);
      }

      if (minTsi) {
        query += ' AND TSI >= ?';
        params.push(parseInt(minTsi as string, 10));
      }

      if (injured === 'true') {
        query += ' AND (InjuryLevel > 0 OR InjuryLevel = -1)';
      }

      if (transferListed === 'true') {
        query += ' AND TransferListed = 1';
      }

      const validSortCols = [
        'PlayerID', 'PlayerNumber', 'Age', 'TSI', 'PlayerForm', 'Salary', 'Experience',
        'StaminaSkill', 'KeeperSkill', 'PlaymakerSkill', 'ScorerSkill', 'PassingSkill',
        'WingerSkill', 'DefenderSkill', 'SetPiecesSkill', 'CareerGoals', 'LastName'
      ];
      const sortCol = validSortCols.includes(sortBy as string) ? sortBy : 'TSI';
      const order = (sortOrder as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      query += ` ORDER BY ${sortCol} ${order}`;

      let rows: any[] = [];
      try {
        rows = db.prepare(query).all(...params) as any[];
      } catch (e: any) {
        // Fallback su query base senza filtri complessi se fallisce una colonna specifica
        console.warn(`[HATTRICK] Fallback query su "${playerTable}":`, e.message);
        rows = db.prepare(`SELECT * FROM "${playerTable}"`).all() as any[];
      }

      // Normalizzazione e arricchimento con calcolo del ruolo ideale e stelle stimate
      const normalized = rows.map(normalizePlayerRow);
      const enriched = normalized.map((p) => {
        const ratings = calculateRoleRatings(p);
        return {
          ...p,
          bestRole: ratings.bestRole,
          bestRating: ratings.bestRating,
          roleRatings: ratings.all
        };
      });

      // Filtro ruolo applicato post-calcolo
      let filtered = enriched;
      if (role && typeof role === 'string' && role !== 'all') {
        filtered = enriched.filter((p) => p.bestRole?.code?.toLowerCase() === role.toLowerCase());
      }

      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: err.message, queryTable: getPlayerTable(db) });
    }
  });

  // Dettaglio Giocatore
  router.get('/players/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const playerTable = getPlayerTable(db);
      const rawPlayer = db.prepare(`SELECT * FROM "${playerTable}" WHERE PlayerID = ? OR player_id = ?`).get(id, id) as any;
      if (!rawPlayer) {
        return res.status(404).json({ error: 'Giocatore non trovato' });
      }
      const player = normalizePlayerRow(rawPlayer);
      const ratings = calculateRoleRatings(player);
      res.json({
        ...player,
        bestRole: ratings.bestRole,
        bestRating: ratings.bestRating,
        roleRatings: ratings.all
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Statistiche Aggregate Squadra
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const playerTable = getPlayerTable(db);
      const teamTable = getTeamTable(db);

      let rawPlayers: any[] = [];
      try {
        rawPlayers = db.prepare(`SELECT * FROM "${playerTable}"`).all() as any[];
      } catch (e: any) {
        console.warn(`[HATTRICK] Errore lettura ${playerTable} per statistiche:`, e.message);
      }
      const players = rawPlayers.map(normalizePlayerRow);

      let team = null;
      try {
        const rawTeam = db.prepare(`SELECT * FROM "${teamTable}" LIMIT 1`).get() as any;
        if (rawTeam) team = normalizeTeamRow(rawTeam);
      } catch {}

      const totalPlayers = players.length;
      let totalTsi = 0;
      let totalSalary = 0;
      let sumAge = 0;
      let injuredCount = 0;
      let bruisedCount = 0;
      let transferListedCount = 0;
      let totalGoals = 0;

      const roleCounts = {
        GK: 0,
        CD: 0,
        WB: 0,
        IM: 0,
        W: 0,
        FW: 0
      };

      players.forEach((p) => {
        totalTsi += p.TSI || 0;
        totalSalary += p.Salary || 0;
        sumAge += (p.Age || 0) + ((p.AgeDays || 0) / 112);
        if (p.InjuryLevel > 0) injuredCount++;
        if (p.InjuryLevel === -1) bruisedCount++;
        if (p.TransferListed) transferListedCount++;
        totalGoals += p.CareerGoals || 0;

        const role = calculateRoleRatings(p).bestRole.code as keyof typeof roleCounts;
        if (roleCounts[role] !== undefined) {
          roleCounts[role]++;
        }
      });

      const avgAge = totalPlayers > 0 ? Math.round((sumAge / totalPlayers) * 10) / 10 : 0;
      const avgTsi = totalPlayers > 0 ? Math.round(totalTsi / totalPlayers) : 0;

      const topScorer = [...players].sort((a, b) => (b.CareerGoals || 0) - (a.CareerGoals || 0))[0] || null;
      const topTsi = [...players].sort((a, b) => (b.TSI || 0) - (a.TSI || 0))[0] || null;

      res.json({
        team,
        totalPlayers,
        totalTsi,
        avgTsi,
        totalSalary,
        avgAge,
        injuredCount,
        bruisedCount,
        transferListedCount,
        totalGoals,
        roleCounts,
        topScorer,
        topTsi
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Calcolo Formazione Ottimale (Top 11 Hattrick)
  router.get('/best-xi', (req: Request, res: Response) => {
    try {
      const playerTable = getPlayerTable(db);
      const formation = (req.query.formation as string) || '3-5-2';

      let rawPlayers: any[] = [];
      try {
        rawPlayers = db.prepare(`SELECT * FROM "${playerTable}" WHERE (InjuryLevel IS NULL OR InjuryLevel <= 0 OR InjuryLevel <> 1)`).all() as any[];
      } catch {
        rawPlayers = db.prepare(`SELECT * FROM "${playerTable}"`).all() as any[];
      }

      const players = rawPlayers.map(normalizePlayerRow);
      const assessed = players.map((p) => ({
        player: p,
        ratings: calculateRoleRatings(p)
      }));

      let lineup: any = {};
      if (formation === '3-5-2') {
        lineup = pickBestXI(assessed, { GK: 1, CD: 2, WB: 1, IM: 3, W: 2, FW: 2 });
      } else if (formation === '2-5-3') {
        lineup = pickBestXI(assessed, { GK: 1, CD: 2, WB: 0, IM: 3, W: 2, FW: 3 });
      } else if (formation === '4-4-2') {
        lineup = pickBestXI(assessed, { GK: 1, CD: 2, WB: 2, IM: 2, W: 2, FW: 2 });
      } else if (formation === '4-5-1') {
        lineup = pickBestXI(assessed, { GK: 1, CD: 2, WB: 2, IM: 3, W: 2, FW: 1 });
      } else {
        lineup = pickBestXI(assessed, { GK: 1, CD: 2, WB: 1, IM: 3, W: 2, FW: 2 });
      }

      res.json({
        formation,
        lineup,
        availablePlayers: players.length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Seed esplicito demo su richiesta se il DB è vuoto
  router.post('/seed-demo', (req: Request, res: Response) => {
    try {
      seedHattrickDemo(db);
      res.json({ ok: true, message: 'Dati dimostrativi ripristinati con successo' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

// Calcolo ruolo ideale e rating da abilità Hattrick
export function calculateRoleRatings(player: any) {
  const gk = (player.KeeperSkill || 1) * 1.0 + (player.SetPiecesSkill || 1) * 0.12;
  const cd = (player.DefenderSkill || 1) * 1.0 + (player.PlaymakerSkill || 1) * 0.35 + (player.PassingSkill || 1) * 0.25;
  const wb = (player.DefenderSkill || 1) * 0.85 + (player.WingerSkill || 1) * 0.70 + (player.PlaymakerSkill || 1) * 0.25 + (player.PassingSkill || 1) * 0.20;
  const im = (player.PlaymakerSkill || 1) * 1.0 + (player.PassingSkill || 1) * 0.45 + (player.DefenderSkill || 1) * 0.35 + (player.ScorerSkill || 1) * 0.15;
  const w = (player.WingerSkill || 1) * 1.0 + (player.PlaymakerSkill || 1) * 0.55 + (player.PassingSkill || 1) * 0.40 + (player.DefenderSkill || 1) * 0.25;
  const fw = (player.ScorerSkill || 1) * 1.0 + (player.PassingSkill || 1) * 0.42 + (player.WingerSkill || 1) * 0.25 + (player.PlaymakerSkill || 1) * 0.18;

  const roles = [
    { code: 'GK', label: 'Portiere', rating: Math.round(gk * 10) / 10 },
    { code: 'CD', label: 'Difensore Centrale', rating: Math.round(cd * 10) / 10 },
    { code: 'WB', label: 'Terzino', rating: Math.round(wb * 10) / 10 },
    { code: 'IM', label: 'Centrocampista (Regista)', rating: Math.round(im * 10) / 10 },
    { code: 'W', label: 'Ala', rating: Math.round(w * 10) / 10 },
    { code: 'FW', label: 'Attaccante', rating: Math.round(fw * 10) / 10 }
  ];

  roles.sort((a, b) => b.rating - a.rating);
  return {
    bestRole: roles[0],
    bestRating: roles[0].rating,
    all: roles
  };
}

function pickBestXI(
  assessed: Array<{ player: any; ratings: { bestRole: any; all: any[] } }>,
  slots: { GK: number; CD: number; WB: number; IM: number; W: number; FW: number }
) {
  const chosen = new Set<number>();
  const lineup: Record<string, any[]> = {
    GK: [],
    CD: [],
    WB: [],
    IM: [],
    W: [],
    FW: []
  };

  const roleCodes: Array<keyof typeof slots> = ['GK', 'CD', 'WB', 'IM', 'W', 'FW'];

  // Prima assegna i ruoli con candidati più performanti
  for (const code of roleCodes) {
    const required = slots[code];
    const pool = assessed
      .filter((item) => !chosen.has(item.player.PlayerID))
      .map((item) => {
        const rating = item.ratings.all.find((r: any) => r.code === code)?.rating || 0;
        return { player: item.player, roleRating: rating };
      })
      .sort((a, b) => b.roleRating - a.roleRating);

    for (let i = 0; i < required && i < pool.length; i++) {
      chosen.add(pool[i].player.PlayerID);
      lineup[code].push(pool[i]);
    }
  }

  return lineup;
}

// 3. SEEDING DATI DIMOSTRATIVI COMPLETI HATTRICK
export function seedHattrickDemo(db: DatabaseType) {
  try {
    const userTable = getUserTable(db);
    const playerTable = getPlayerTable(db);
    let countUsers = 0;
    let countPlayers = 0;
    try {
      countUsers = (db.prepare(`SELECT COUNT(*) as c FROM "${userTable}"`).get() as any)?.c || 0;
    } catch {}
    try {
      countPlayers = (db.prepare(`SELECT COUNT(*) as c FROM "${playerTable}"`).get() as any)?.c || 0;
    } catch {}

    if (countUsers > 0 || countPlayers > 0) return;

  db.exec(`
    INSERT INTO "users" (user_id, loginname, name, icq, language_id, language_name, has_supporter, signup_date, activation_date, last_login_date, national_team_coach)
    VALUES (104892, 'mister_mario', 'Mario Rossi', '18492014', 4, 'Italiano', 1, '2021-03-15 14:00:00', '2021-03-15 14:30:00', '2026-09-07 09:15:00', '');

    INSERT INTO "TeamDetails" (
      TeamID, TeamName, ShortTeamName, IsPrimaryClub, FoundedDate, IsDeactivated,
      ArenaID, ArenaName, LeagueID, LeagueName, CountryID, CountryName, RegionID, RegionName,
      TrainerID, DressURI, DressAlternateURI, LeagueLevelUnitID, LeagueLevelUnitName, LeagueLevel,
      IsBot, StillInCup, GlobalRanking, LeagueRanking, RegionRanking, PowerRating,
      FriendlyTeamID, NumberOfVictories, NumberOfUndefeated, TeamRank,
      FanclubID, FanclubName, FanclubSize, LogoURL, YouthTeamID, YouthTeamName,
      NumberOfVisits, PossibleToChallengeMidweek, PossibleToChallengeWeekend, UserID
    ) VALUES (
      874125, 'FC Vesuvio United', 'VES', 1, '2021-03-15 14:00:00', 0,
      95412, 'Stadio San Ciro Arena', 4, 'Italia', 4, 'Italia', 15, 'Campania',
      41285, '', '', 1284, 'V.214', 5,
      0, 1, 3420, 182, 34, 785,
      0, 142, 28, 2,
      5412, 'I Fedelissimi Rossoblù', 1845, '', 98451, 'Vesuvio Primavera',
      482, 1, 1, 104892
    );
  `);

  const insertPlayer = db.prepare(`
    INSERT INTO "Player" (
      PlayerID, FirstName, NickName, LastName, PlayerNumber, Age, AgeDays, ArrivalDate, OwnerNotes,
      TSI, PlayerForm, Statement, Experience, Loyalty, MotherClubBonus, Leadership, Salary, IsAbroad,
      Agreeability, Aggressiveness, Honesty, LeagueGoals, CupGoals, FriendliesGoals, CareerGoals,
      CareerHattricks, MatchesCurrentTeam, GoalsCurrentTeam, AssistsCurrentTeam, CareerAssists,
      Specialty, TransferListed, NationalTeamID, CountryID, Caps, CapsU20, Cards, InjuryLevel,
      StaminaSkill, KeeperSkill, PlaymakerSkill, ScorerSkill, PassingSkill, WingerSkill, DefenderSkill,
      SetPiecesSkill, PlayerCategoryId, OwnerNote, UserID, TeamID
    ) VALUES (
      @PlayerID, @FirstName, @NickName, @LastName, @PlayerNumber, @Age, @AgeDays, @ArrivalDate, @OwnerNotes,
      @TSI, @PlayerForm, '', @Experience, @Loyalty, @MotherClubBonus, @Leadership, @Salary, 0,
      @Agreeability, @Aggressiveness, @Honesty, @LeagueGoals, @CupGoals, 2, @CareerGoals,
      @CareerHattricks, @MatchesCurrentTeam, @GoalsCurrentTeam, @AssistsCurrentTeam, @CareerAssists,
      @Specialty, @TransferListed, 0, 4, @Caps, @CapsU20, @Cards, @InjuryLevel,
      @StaminaSkill, @KeeperSkill, @PlaymakerSkill, @ScorerSkill, @PassingSkill, @WingerSkill, @DefenderSkill,
      @SetPiecesSkill, 1, @OwnerNotes, 104892, 874125
    )
  `);

  const demoPlayers = [
    // PORTIERI
    {
      PlayerID: 45012301, FirstName: 'Matteo', NickName: 'La Saracinesca', LastName: 'Marchetti', PlayerNumber: 1,
      Age: 27, AgeDays: 45, ArrivalDate: '2023-01-10', OwnerNotes: 'Titolare inamovibile. Ottimo sui piazzati.',
      TSI: 48500, PlayerForm: 7, Experience: 9, Loyalty: 16, MotherClubBonus: 0, Leadership: 5, Salary: 9500,
      Agreeability: 3, Aggressiveness: 2, Honesty: 3, LeagueGoals: 0, CupGoals: 0, CareerGoals: 0,
      CareerHattricks: 0, MatchesCurrentTeam: 88, GoalsCurrentTeam: 0, AssistsCurrentTeam: 1, CareerAssists: 3,
      Specialty: 0, TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 7, KeeperSkill: 13, PlaymakerSkill: 2, ScorerSkill: 1, PassingSkill: 4, WingerSkill: 1, DefenderSkill: 4, SetPiecesSkill: 9
    },
    {
      PlayerID: 45012302, FirstName: 'Lorenzo', NickName: '', LastName: 'De Angelis', PlayerNumber: 12,
      Age: 20, AgeDays: 14, ArrivalDate: '2025-06-01', OwnerNotes: 'Giovane promessa delle giovanili in allenamento parate.',
      TSI: 12400, PlayerForm: 6, Experience: 3, Loyalty: 20, MotherClubBonus: 1, Leadership: 4, Salary: 2600,
      Agreeability: 4, Aggressiveness: 3, Honesty: 3, LeagueGoals: 0, CupGoals: 0, CareerGoals: 0,
      CareerHattricks: 0, MatchesCurrentTeam: 12, GoalsCurrentTeam: 0, AssistsCurrentTeam: 0, CareerAssists: 0,
      Specialty: 0, TransferListed: 0, Caps: 0, CapsU20: 2, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 6, KeeperSkill: 9, PlaymakerSkill: 1, ScorerSkill: 1, PassingSkill: 3, WingerSkill: 1, DefenderSkill: 3, SetPiecesSkill: 5
    },

    // DIFENSORI CENTRALI
    {
      PlayerID: 45012303, FirstName: 'Gennaro', NickName: 'Ringhio', LastName: 'Caputo', PlayerNumber: 3,
      Age: 29, AgeDays: 88, ArrivalDate: '2022-09-01', OwnerNotes: 'Capitano e colonna della difesa. Fortissimo nel gioco aereo.',
      TSI: 36200, PlayerForm: 7, Experience: 10, Loyalty: 18, MotherClubBonus: 0, Leadership: 7, Salary: 8200,
      Agreeability: 3, Aggressiveness: 4, Honesty: 2, LeagueGoals: 4, CupGoals: 1, CareerGoals: 18,
      CareerHattricks: 0, MatchesCurrentTeam: 114, GoalsCurrentTeam: 11, AssistsCurrentTeam: 4, CareerAssists: 12,
      Specialty: 4, // Colpo di testa
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 1, InjuryLevel: 0,
      StaminaSkill: 7, KeeperSkill: 1, PlaymakerSkill: 7, ScorerSkill: 3, PassingSkill: 6, WingerSkill: 4, DefenderSkill: 13, SetPiecesSkill: 6
    },
    {
      PlayerID: 45012304, FirstName: 'David', NickName: 'The Wall', LastName: 'Lindström', PlayerNumber: 5,
      Age: 28, AgeDays: 20, ArrivalDate: '2023-08-15', OwnerNotes: 'Difensore centrale solido, potenza fisica pura.',
      TSI: 34100, PlayerForm: 6, Experience: 8, Loyalty: 15, MotherClubBonus: 0, Leadership: 4, Salary: 7800,
      Agreeability: 3, Aggressiveness: 3, Honesty: 3, LeagueGoals: 2, CupGoals: 0, CareerGoals: 9,
      CareerHattricks: 0, MatchesCurrentTeam: 72, GoalsCurrentTeam: 5, AssistsCurrentTeam: 3, CareerAssists: 8,
      Specialty: 3, // Potente
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 8, KeeperSkill: 1, PlaymakerSkill: 8, ScorerSkill: 2, PassingSkill: 5, WingerSkill: 3, DefenderSkill: 12, SetPiecesSkill: 4
    },
    {
      PlayerID: 45012305, FirstName: 'Salvatore', NickName: '', LastName: 'Esposito', PlayerNumber: 13,
      Age: 22, AgeDays: 102, ArrivalDate: '2024-02-10', OwnerNotes: 'Difensore moderno con ottima regia di impostazione.',
      TSI: 21800, PlayerForm: 7, Experience: 5, Loyalty: 12, MotherClubBonus: 0, Leadership: 4, Salary: 4200,
      Agreeability: 4, Aggressiveness: 2, Honesty: 3, LeagueGoals: 1, CupGoals: 0, CareerGoals: 4,
      CareerHattricks: 0, MatchesCurrentTeam: 45, GoalsCurrentTeam: 3, AssistsCurrentTeam: 6, CareerAssists: 9,
      Specialty: 1, // Tecnico
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 7, KeeperSkill: 1, PlaymakerSkill: 9, ScorerSkill: 2, PassingSkill: 7, WingerSkill: 4, DefenderSkill: 10, SetPiecesSkill: 5
    },

    // TERZINI
    {
      PlayerID: 45012306, FirstName: 'Andrea', NickName: 'Turbo', LastName: 'Barone', PlayerNumber: 2,
      Age: 25, AgeDays: 34, ArrivalDate: '2023-11-20', OwnerNotes: 'Terzino fluidificante con spinta costante.',
      TSI: 28900, PlayerForm: 7, Experience: 6, Loyalty: 14, MotherClubBonus: 0, Leadership: 4, Salary: 5800,
      Agreeability: 3, Aggressiveness: 3, Honesty: 3, LeagueGoals: 3, CupGoals: 1, CareerGoals: 8,
      CareerHattricks: 0, MatchesCurrentTeam: 64, GoalsCurrentTeam: 6, AssistsCurrentTeam: 14, CareerAssists: 22,
      Specialty: 2, // Veloce
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 8, KeeperSkill: 1, PlaymakerSkill: 6, ScorerSkill: 3, PassingSkill: 6, WingerSkill: 11, DefenderSkill: 11, SetPiecesSkill: 3
    },
    {
      PlayerID: 45012307, FirstName: 'Manuel', NickName: '', LastName: 'Ferri', PlayerNumber: 14,
      Age: 24, AgeDays: 61, ArrivalDate: '2024-05-18', OwnerNotes: 'Terzino di riserva, in recupero da lieve contusione.',
      TSI: 19500, PlayerForm: 6, Experience: 4, Loyalty: 11, MotherClubBonus: 0, Leadership: 3, Salary: 3400,
      Agreeability: 4, Aggressiveness: 2, Honesty: 3, LeagueGoals: 1, CupGoals: 0, CareerGoals: 3,
      CareerHattricks: 0, MatchesCurrentTeam: 32, GoalsCurrentTeam: 2, AssistsCurrentTeam: 5, CareerAssists: 7,
      Specialty: 6, // Resiliente
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: -1, // Bruised / cerotto
      StaminaSkill: 7, KeeperSkill: 1, PlaymakerSkill: 5, ScorerSkill: 2, PassingSkill: 5, WingerSkill: 9, DefenderSkill: 10, SetPiecesSkill: 3
    },

    // CENTROCAMPISTI CENTRALI (REGISTI)
    {
      PlayerID: 45012308, FirstName: 'Federico', NickName: 'Il Professore', LastName: 'Moretti', PlayerNumber: 8,
      Age: 27, AgeDays: 12, ArrivalDate: '2022-07-01', OwnerNotes: 'Il cervello della squadra. Regia fuoriclasse e visione di gioco.',
      TSI: 54000, PlayerForm: 8, Experience: 9, Loyalty: 17, MotherClubBonus: 0, Leadership: 5, Salary: 11500,
      Agreeability: 3, Aggressiveness: 2, Honesty: 4, LeagueGoals: 8, CupGoals: 2, CareerGoals: 34,
      CareerHattricks: 1, MatchesCurrentTeam: 120, GoalsCurrentTeam: 24, AssistsCurrentTeam: 38, CareerAssists: 62,
      Specialty: 4, // Colpo di testa
      TransferListed: 0, Caps: 2, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 8, KeeperSkill: 1, PlaymakerSkill: 14, ScorerSkill: 5, PassingSkill: 9, WingerSkill: 5, DefenderSkill: 8, SetPiecesSkill: 8
    },
    {
      PlayerID: 45012309, FirstName: 'Tommaso', NickName: 'Metronomo', LastName: 'Santoro', PlayerNumber: 4,
      Age: 26, AgeDays: 78, ArrivalDate: '2023-03-12', OwnerNotes: 'Regista di grandissima intensità e recupero palloni.',
      TSI: 46200, PlayerForm: 7, Experience: 8, Loyalty: 15, MotherClubBonus: 0, Leadership: 4, Salary: 9800,
      Agreeability: 4, Aggressiveness: 3, Honesty: 3, LeagueGoals: 5, CupGoals: 1, CareerGoals: 21,
      CareerHattricks: 0, MatchesCurrentTeam: 92, GoalsCurrentTeam: 14, AssistsCurrentTeam: 26, CareerAssists: 44,
      Specialty: 3, // Potente
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 1, InjuryLevel: 0,
      StaminaSkill: 8, KeeperSkill: 1, PlaymakerSkill: 13, ScorerSkill: 4, PassingSkill: 8, WingerSkill: 4, DefenderSkill: 9, SetPiecesSkill: 6
    },
    {
      PlayerID: 45012310, FirstName: 'Gabriele', NickName: 'Mago', LastName: 'Rinaldi', PlayerNumber: 10,
      Age: 23, AgeDays: 95, ArrivalDate: '2024-01-05', OwnerNotes: 'Tecnico sopraffino, abile negli Special Events e tiri da fuori.',
      TSI: 39500, PlayerForm: 7, Experience: 5, Loyalty: 13, MotherClubBonus: 0, Leadership: 3, Salary: 7200,
      Agreeability: 4, Aggressiveness: 2, Honesty: 4, LeagueGoals: 7, CupGoals: 2, CareerGoals: 19,
      CareerHattricks: 0, MatchesCurrentTeam: 58, GoalsCurrentTeam: 16, AssistsCurrentTeam: 21, CareerAssists: 29,
      Specialty: 1, // Tecnico
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 7, KeeperSkill: 1, PlaymakerSkill: 12, ScorerSkill: 6, PassingSkill: 10, WingerSkill: 6, DefenderSkill: 6, SetPiecesSkill: 11
    },
    {
      PlayerID: 45012311, FirstName: 'Simone', NickName: '', LastName: 'Caruso', PlayerNumber: 18,
      Age: 21, AgeDays: 30, ArrivalDate: '2025-01-15', OwnerNotes: 'Giovane centrocampista canterano in forte crescita.',
      TSI: 22100, PlayerForm: 6, Experience: 3, Loyalty: 20, MotherClubBonus: 1, Leadership: 4, Salary: 3900,
      Agreeability: 3, Aggressiveness: 3, Honesty: 3, LeagueGoals: 2, CupGoals: 0, CareerGoals: 5,
      CareerHattricks: 0, MatchesCurrentTeam: 26, GoalsCurrentTeam: 4, AssistsCurrentTeam: 8, CareerAssists: 8,
      Specialty: 2, // Veloce
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 7, KeeperSkill: 1, PlaymakerSkill: 10, ScorerSkill: 4, PassingSkill: 7, WingerSkill: 5, DefenderSkill: 6, SetPiecesSkill: 4
    },

    // ALI
    {
      PlayerID: 45012312, FirstName: 'Alessio', NickName: 'La Freccia', LastName: 'Pagano', PlayerNumber: 7,
      Age: 25, AgeDays: 52, ArrivalDate: '2023-07-20', OwnerNotes: 'Ala pura, salta sempre il terzino avversario in velocità.',
      TSI: 38800, PlayerForm: 7, Experience: 7, Loyalty: 15, MotherClubBonus: 0, Leadership: 4, Salary: 7600,
      Agreeability: 3, Aggressiveness: 2, Honesty: 3, LeagueGoals: 12, CupGoals: 3, CareerGoals: 38,
      CareerHattricks: 1, MatchesCurrentTeam: 78, GoalsCurrentTeam: 26, AssistsCurrentTeam: 34, CareerAssists: 52,
      Specialty: 2, // Veloce
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 8, KeeperSkill: 1, PlaymakerSkill: 9, ScorerSkill: 6, PassingSkill: 8, WingerSkill: 13, DefenderSkill: 5, SetPiecesSkill: 5
    },
    {
      PlayerID: 45012313, FirstName: 'Claudio', NickName: '', LastName: 'Romano', PlayerNumber: 11,
      Age: 26, AgeDays: 110, ArrivalDate: '2023-10-01', OwnerNotes: 'Ala sinistra con ottima propensione al cross tagliato.',
      TSI: 34200, PlayerForm: 6, Experience: 6, Loyalty: 14, MotherClubBonus: 0, Leadership: 4, Salary: 6500,
      Agreeability: 4, Aggressiveness: 2, Honesty: 3, LeagueGoals: 9, CupGoals: 1, CareerGoals: 27,
      CareerHattricks: 0, MatchesCurrentTeam: 68, GoalsCurrentTeam: 18, AssistsCurrentTeam: 25, CareerAssists: 38,
      Specialty: 5, // Imprevedibile
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 7, KeeperSkill: 1, PlaymakerSkill: 8, ScorerSkill: 5, PassingSkill: 7, WingerSkill: 12, DefenderSkill: 6, SetPiecesSkill: 6
    },
    {
      PlayerID: 45012314, FirstName: 'Filippo', NickName: '', LastName: 'Gentile', PlayerNumber: 17,
      Age: 20, AgeDays: 8, ArrivalDate: '2025-08-01', OwnerNotes: 'Ala di prospettiva, veloce e con buon controllo palla.',
      TSI: 16500, PlayerForm: 6, Experience: 2, Loyalty: 18, MotherClubBonus: 1, Leadership: 3, Salary: 2800,
      Agreeability: 3, Aggressiveness: 3, Honesty: 4, LeagueGoals: 1, CupGoals: 0, CareerGoals: 2,
      CareerHattricks: 0, MatchesCurrentTeam: 14, GoalsCurrentTeam: 2, AssistsCurrentTeam: 4, CareerAssists: 4,
      Specialty: 2, // Veloce
      TransferListed: 1, // Sul mercato
      Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 6, KeeperSkill: 1, PlaymakerSkill: 6, ScorerSkill: 4, PassingSkill: 6, WingerSkill: 9, DefenderSkill: 4, SetPiecesSkill: 3
    },

    // ATTACCANTI
    {
      PlayerID: 45012315, FirstName: 'Dario', NickName: 'Il Bomber', LastName: 'Lombardi', PlayerNumber: 9,
      Age: 27, AgeDays: 40, ArrivalDate: '2022-08-10', OwnerNotes: 'Capocannoniere indiscusso. Letale di testa sui calci piazzati.',
      TSI: 58000, PlayerForm: 8, Experience: 9, Loyalty: 16, MotherClubBonus: 0, Leadership: 4, Salary: 13200,
      Agreeability: 3, Aggressiveness: 3, Honesty: 3, LeagueGoals: 28, CupGoals: 7, CareerGoals: 112,
      CareerHattricks: 6, MatchesCurrentTeam: 110, GoalsCurrentTeam: 78, AssistsCurrentTeam: 18, CareerAssists: 31,
      Specialty: 4, // Colpo di testa
      TransferListed: 0, Caps: 1, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 7, KeeperSkill: 1, PlaymakerSkill: 6, ScorerSkill: 14, PassingSkill: 8, WingerSkill: 5, DefenderSkill: 4, SetPiecesSkill: 13
    },
    {
      PlayerID: 45012316, FirstName: 'Marco', NickName: 'Cobra', LastName: 'Valenti', PlayerNumber: 20,
      Age: 24, AgeDays: 85, ArrivalDate: '2024-03-01', OwnerNotes: 'Seconda punta rapida e opportunista.',
      TSI: 41500, PlayerForm: 7, Experience: 6, Loyalty: 13, MotherClubBonus: 0, Leadership: 3, Salary: 8100,
      Agreeability: 4, Aggressiveness: 2, Honesty: 3, LeagueGoals: 16, CupGoals: 4, CareerGoals: 48,
      CareerHattricks: 2, MatchesCurrentTeam: 54, GoalsCurrentTeam: 32, AssistsCurrentTeam: 14, CareerAssists: 24,
      Specialty: 2, // Veloce
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 8, KeeperSkill: 1, PlaymakerSkill: 6, ScorerSkill: 12, PassingSkill: 7, WingerSkill: 6, DefenderSkill: 3, SetPiecesSkill: 5
    },
    {
      PlayerID: 45012317, FirstName: 'Emanuele', NickName: '', LastName: 'Testa', PlayerNumber: 21,
      Age: 22, AgeDays: 24, ArrivalDate: '2024-11-12', OwnerNotes: 'Attaccante potente, ottimo nel pressing e lavoro sporco.',
      TSI: 26800, PlayerForm: 6, Experience: 4, Loyalty: 12, MotherClubBonus: 0, Leadership: 4, Salary: 4900,
      Agreeability: 3, Aggressiveness: 4, Honesty: 3, LeagueGoals: 6, CupGoals: 1, CareerGoals: 14,
      CareerHattricks: 0, MatchesCurrentTeam: 36, GoalsCurrentTeam: 10, AssistsCurrentTeam: 5, CareerAssists: 9,
      Specialty: 3, // Potente
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 0,
      StaminaSkill: 7, KeeperSkill: 1, PlaymakerSkill: 5, ScorerSkill: 10, PassingSkill: 6, WingerSkill: 4, DefenderSkill: 4, SetPiecesSkill: 4
    },
    {
      PlayerID: 45012318, FirstName: 'Pietro', NickName: '', LastName: 'Coppola', PlayerNumber: 22,
      Age: 19, AgeDays: 60, ArrivalDate: '2025-07-10', OwnerNotes: 'Attaccante canterano. Purtroppo fermo per infortunio muscolare.',
      TSI: 14200, PlayerForm: 5, Experience: 2, Loyalty: 20, MotherClubBonus: 1, Leadership: 3, Salary: 2100,
      Agreeability: 3, Aggressiveness: 2, Honesty: 4, LeagueGoals: 2, CupGoals: 0, CareerGoals: 3,
      CareerHattricks: 0, MatchesCurrentTeam: 10, GoalsCurrentTeam: 2, AssistsCurrentTeam: 1, CareerAssists: 1,
      Specialty: 4, // Colpo di testa
      TransferListed: 0, Caps: 0, CapsU20: 0, Cards: 0, InjuryLevel: 2, // Infortunato 2 settimane
      StaminaSkill: 6, KeeperSkill: 1, PlaymakerSkill: 4, ScorerSkill: 8, PassingSkill: 5, WingerSkill: 3, DefenderSkill: 2, SetPiecesSkill: 3
    }
  ];

  for (const p of demoPlayers) {
    insertPlayer.run(p);
  }
} catch (err: any) {
  console.warn('[HATTRICK] Avviso durante seedHattrickDemo:', err.message);
}
}
