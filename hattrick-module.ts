import { Database as DatabaseType } from 'better-sqlite3';
import { Router, Request, Response } from 'express';
import fs from 'fs';

export function setupHattrick(db: DatabaseType, dbFilePath?: string): Router {
  const router = Router();

  // 1. INIZIALIZZAZIONE SCHEMA EXACT RICHIESTO DALL'UTENTE
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

  // Seeding automatico iniziale se il database è vuoto
  seedHattrickDemo(db);

  // 2. ENDPOINTS

  // Info database e connessione (utilissimo per la gestione multi-db locale)
  router.get('/db-info', (req: Request, res: Response) => {
    try {
      let fileSizeKB = 0;
      if (dbFilePath && fs.existsSync(dbFilePath)) {
        fileSizeKB = Math.round(fs.statSync(dbFilePath).size / 1024 * 10) / 10;
      }
      const totalPlayers = (db.prepare('SELECT COUNT(*) as c FROM "Player"').get() as any).c;
      const totalTeams = (db.prepare('SELECT COUNT(*) as c FROM "TeamDetails"').get() as any).c;
      const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM "users"').get() as any).c;

      res.json({
        module: 'hattrick',
        dbFilePath: dbFilePath || 'hattrick.db',
        fileSizeKB,
        totalPlayers,
        totalTeams,
        totalUsers,
        isSeparateDb: true
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dettagli Club & Utente
  router.get('/team', (req: Request, res: Response) => {
    try {
      const team = db.prepare('SELECT * FROM "TeamDetails" LIMIT 1').get() as any;
      if (!team) {
        return res.status(404).json({ error: 'Nessun club trovato' });
      }
      const user = db.prepare('SELECT * FROM "users" WHERE user_id = ?').get(team.UserID) as any;
      res.json({ team, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Aggiorna Dettagli Club
  router.put('/team/:id', (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id, 10);
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
        UPDATE "TeamDetails"
        SET TeamName = COALESCE(?, TeamName),
            ShortTeamName = COALESCE(?, ShortTeamName),
            ArenaName = COALESCE(?, ArenaName),
            LeagueLevelUnitName = COALESCE(?, LeagueLevelUnitName),
            FanclubName = COALESCE(?, FanclubName),
            YouthTeamName = COALESCE(?, YouthTeamName),
            LogoURL = COALESCE(?, LogoURL)
        WHERE TeamID = ?
      `).run(TeamName, ShortTeamName, ArenaName, LeagueLevelUnitName, FanclubName, YouthTeamName, LogoURL, teamId);

      const updated = db.prepare('SELECT * FROM "TeamDetails" WHERE TeamID = ?').get(teamId);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Lista Giocatori con filtri e calcolo ruolo ideale
  router.get('/players', (req: Request, res: Response) => {
    try {
      const { search, role, minTsi, injured, transferListed, sortBy = 'TSI', sortOrder = 'DESC' } = req.query;

      let query = 'SELECT * FROM "Player" WHERE 1=1';
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

      const rows = db.prepare(query).all(...params) as any[];

      // Arricchisce i dati calcolando il ruolo ideale e la valutazione stelle stimata
      const enriched = rows.map((p) => {
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
        filtered = enriched.filter((p) => p.bestRole.code.toLowerCase() === role.toLowerCase());
      }

      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dettaglio Giocatore
  router.get('/players/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const player = db.prepare('SELECT * FROM "Player" WHERE PlayerID = ?').get(id) as any;
      if (!player) {
        return res.status(404).json({ error: 'Giocatore non trovato' });
      }
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

  // Crea Giocatore
  router.post('/players', (req: Request, res: Response) => {
    try {
      const {
        FirstName,
        LastName,
        NickName = '',
        PlayerNumber = 0,
        Age = 20,
        AgeDays = 0,
        TSI = 1000,
        PlayerForm = 6,
        Experience = 3,
        Loyalty = 10,
        MotherClubBonus = 0,
        Leadership = 4,
        Salary = 1200,
        Specialty = 0,
        InjuryLevel = 0,
        StaminaSkill = 6,
        KeeperSkill = 1,
        PlaymakerSkill = 1,
        ScorerSkill = 1,
        PassingSkill = 1,
        WingerSkill = 1,
        DefenderSkill = 1,
        SetPiecesSkill = 1,
        OwnerNotes = '',
        TransferListed = 0
      } = req.body;

      if (!FirstName || !LastName) {
        return res.status(400).json({ error: 'Nome e Cognome sono obbligatori' });
      }

      // Prendi TeamID e UserID correnti
      const team = db.prepare('SELECT TeamID, UserID FROM "TeamDetails" LIMIT 1').get() as any;
      const teamId = team ? team.TeamID : 1;
      const userId = team ? team.UserID : 1;

      // Genera nuovo PlayerID se non specificato
      const maxId = (db.prepare('SELECT MAX(PlayerID) as maxId FROM "Player"').get() as any)?.maxId || 300000000;
      const newPlayerId = maxId + 1;

      const stmt = db.prepare(`
        INSERT INTO "Player" (
          PlayerID, FirstName, NickName, LastName, PlayerNumber, Age, AgeDays, ArrivalDate, OwnerNotes,
          TSI, PlayerForm, Statement, Experience, Loyalty, MotherClubBonus, Leadership, Salary, IsAbroad,
          Agreeability, Aggressiveness, Honesty, LeagueGoals, CupGoals, FriendliesGoals, CareerGoals,
          CareerHattricks, MatchesCurrentTeam, GoalsCurrentTeam, AssistsCurrentTeam, CareerAssists,
          Specialty, TransferListed, NationalTeamID, CountryID, Caps, CapsU20, Cards, InjuryLevel,
          StaminaSkill, KeeperSkill, PlaymakerSkill, ScorerSkill, PassingSkill, WingerSkill, DefenderSkill,
          SetPiecesSkill, PlayerCategoryId, OwnerNote, UserID, TeamID
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?,
          ?, ?, '', ?, ?, ?, ?, ?, 0,
          3, 3, 3, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          ?, ?, 0, 4, 0, 0, 0, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, 1, ?, ?, ?
        )
      `);

      stmt.run(
        newPlayerId, FirstName, NickName || null, LastName, parseInt(PlayerNumber, 10) || 0,
        parseInt(Age, 10) || 19, parseInt(AgeDays, 10) || 0, OwnerNotes || '',
        parseInt(TSI, 10) || 1000, parseInt(PlayerForm, 10) || 6,
        parseInt(Experience, 10) || 1, parseInt(Loyalty, 10) || 1, MotherClubBonus ? 1 : 0,
        parseInt(Leadership, 10) || 3, parseInt(Salary, 10) || 1000,
        parseInt(Specialty, 10) || 0, TransferListed ? 1 : 0, parseInt(InjuryLevel, 10) || 0,
        parseInt(StaminaSkill, 10) || 5, parseInt(KeeperSkill, 10) || 1, parseInt(PlaymakerSkill, 10) || 1,
        parseInt(ScorerSkill, 10) || 1, parseInt(PassingSkill, 10) || 1, parseInt(WingerSkill, 10) || 1,
        parseInt(DefenderSkill, 10) || 1, parseInt(SetPiecesSkill, 10) || 1,
        OwnerNotes || '', userId, teamId
      );

      const created = db.prepare('SELECT * FROM "Player" WHERE PlayerID = ?').get(newPlayerId) as any;
      const ratings = calculateRoleRatings(created);

      res.status(201).json({
        ...created,
        bestRole: ratings.bestRole,
        bestRating: ratings.bestRating,
        roleRatings: ratings.all
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Modifica Giocatore
  router.put('/players/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = db.prepare('SELECT * FROM "Player" WHERE PlayerID = ?').get(id) as any;
      if (!existing) {
        return res.status(404).json({ error: 'Giocatore non trovato' });
      }

      const {
        FirstName = existing.FirstName,
        LastName = existing.LastName,
        NickName = existing.NickName,
        PlayerNumber = existing.PlayerNumber,
        Age = existing.Age,
        AgeDays = existing.AgeDays,
        TSI = existing.TSI,
        PlayerForm = existing.PlayerForm,
        Experience = existing.Experience,
        Loyalty = existing.Loyalty,
        MotherClubBonus = existing.MotherClubBonus,
        Leadership = existing.Leadership,
        Salary = existing.Salary,
        Specialty = existing.Specialty,
        InjuryLevel = existing.InjuryLevel,
        StaminaSkill = existing.StaminaSkill,
        KeeperSkill = existing.KeeperSkill,
        PlaymakerSkill = existing.PlaymakerSkill,
        ScorerSkill = existing.ScorerSkill,
        PassingSkill = existing.PassingSkill,
        WingerSkill = existing.WingerSkill,
        DefenderSkill = existing.DefenderSkill,
        SetPiecesSkill = existing.SetPiecesSkill,
        OwnerNotes = existing.OwnerNotes,
        TransferListed = existing.TransferListed,
        Cards = existing.Cards,
        CareerGoals = existing.CareerGoals,
        CareerAssists = existing.CareerAssists
      } = req.body;

      db.prepare(`
        UPDATE "Player"
        SET FirstName = ?, LastName = ?, NickName = ?, PlayerNumber = ?, Age = ?, AgeDays = ?,
            TSI = ?, PlayerForm = ?, Experience = ?, Loyalty = ?, MotherClubBonus = ?, Leadership = ?,
            Salary = ?, Specialty = ?, InjuryLevel = ?, StaminaSkill = ?, KeeperSkill = ?,
            PlaymakerSkill = ?, ScorerSkill = ?, PassingSkill = ?, WingerSkill = ?, DefenderSkill = ?,
            SetPiecesSkill = ?, OwnerNotes = ?, TransferListed = ?, Cards = ?,
            CareerGoals = ?, CareerAssists = ?
        WHERE PlayerID = ?
      `).run(
        FirstName, LastName, NickName, parseInt(PlayerNumber, 10), parseInt(Age, 10), parseInt(AgeDays, 10),
        parseInt(TSI, 10), parseInt(PlayerForm, 10), parseInt(Experience, 10), parseInt(Loyalty, 10),
        MotherClubBonus ? 1 : 0, parseInt(Leadership, 10), parseInt(Salary, 10), parseInt(Specialty, 10),
        parseInt(InjuryLevel, 10), parseInt(StaminaSkill, 10), parseInt(KeeperSkill, 10),
        parseInt(PlaymakerSkill, 10), parseInt(ScorerSkill, 10), parseInt(PassingSkill, 10),
        parseInt(WingerSkill, 10), parseInt(DefenderSkill, 10), parseInt(SetPiecesSkill, 10),
        OwnerNotes, TransferListed ? 1 : 0, parseInt(Cards, 10), parseInt(CareerGoals, 10),
        parseInt(CareerAssists, 10), id
      );

      const updated = db.prepare('SELECT * FROM "Player" WHERE PlayerID = ?').get(id) as any;
      const ratings = calculateRoleRatings(updated);

      res.json({
        ...updated,
        bestRole: ratings.bestRole,
        bestRating: ratings.bestRating,
        roleRatings: ratings.all
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Elimina Giocatore
  router.delete('/players/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = db.prepare('DELETE FROM "Player" WHERE PlayerID = ?').run(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Giocatore non trovato' });
      }
      res.json({ ok: true, message: `Giocatore #${id} eliminato con successo` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Statistiche Aggregate Squadra
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const players = db.prepare('SELECT * FROM "Player"').all() as any[];
      const team = db.prepare('SELECT * FROM "TeamDetails" LIMIT 1').get() as any;

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

      // Top scorer
      const topScorer = [...players].sort((a, b) => (b.CareerGoals || 0) - (a.CareerGoals || 0))[0] || null;

      // Top TSI
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
      const formation = (req.query.formation as string) || '3-5-2';
      const players = db.prepare('SELECT * FROM "Player" WHERE InjuryLevel <= 0').all() as any[];

      const assessed = players.map((p) => ({
        player: p,
        ratings: calculateRoleRatings(p)
      }));

      // Selezione formazione Hattrick standard
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

  // Ripristina o Ricarica Squadra Demo
  router.post('/seed', (req: Request, res: Response) => {
    try {
      db.exec('DELETE FROM "Player"; DELETE FROM "TeamDetails"; DELETE FROM "users";');
      seedHattrickDemo(db);
      res.json({ ok: true, message: 'Squadra e dati Hattrick rigenerati con successo.' });
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
  const countUsers = (db.prepare('SELECT COUNT(*) as c FROM "users"').get() as any).c;
  if (countUsers > 0) return;

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
}
