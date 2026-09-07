import { Database as DatabaseType } from 'better-sqlite3';
import { Router, Request, Response } from 'express';

export function setupBBeater(db: DatabaseType, getUserFn?: (req: Request) => { username: string }): Router {
  const router = Router();

  // Helper per estrarre e risolvere l'utente corrente dalla richiesta e dalla tabella 'utenti'
  function getCurrentUser(req: Request): {
    id: number;
    user: string;
    teamid: number | null;
    owner: string | null;
    nomesquadra: string | null;
  } {
    let username = 'fire';
    if (getUserFn) {
      try {
        const u = getUserFn(req);
        if (u && u.username) username = u.username;
      } catch (e) {}
    } else {
      const xRemote = req.headers['x-remote-user'] || req.headers['x-user-override'];
      if (typeof xRemote === 'string' && xRemote.trim()) {
        username = xRemote.trim();
      }
    }

    if (typeof req.query.user === 'string' && req.query.user.trim()) {
      username = req.query.user.trim();
    } else if (typeof req.query.username === 'string' && req.query.username.trim()) {
      username = req.query.username.trim();
    }

    try {
      let userRow = db.prepare(`
        SELECT id, user, teamid, owner, nomesquadra 
        FROM utenti 
        WHERE LOWER(user) = LOWER(?) OR LOWER(owner) = LOWER(?) 
        LIMIT 1
      `).get(username, username) as any;

      if (!userRow) {
        const numericId = parseInt(username, 10);
        if (!isNaN(numericId)) {
          userRow = db.prepare(`
            SELECT id, user, teamid, owner, nomesquadra 
            FROM utenti 
            WHERE id = ? OR teamid = ? 
            LIMIT 1
          `).get(numericId, numericId) as any;
        }
      }

      if (!userRow) {
        userRow = db.prepare(`
          SELECT id, user, teamid, owner, nomesquadra 
          FROM utenti 
          ORDER BY id ASC 
          LIMIT 1
        `).get() as any;
      }

      if (userRow) {
        return {
          id: userRow.id,
          user: userRow.user || username,
          teamid: userRow.teamid || null,
          owner: userRow.owner || null,
          nomesquadra: userRow.nomesquadra || null
        };
      }
    } catch (err) {
      console.warn('[BUZZERBEATER] Avviso lookup utente:', err);
    }

    return {
      id: 1,
      user: username,
      teamid: 102934,
      owner: username,
      nomesquadra: 'UTC'
    };
  }

  // 1. INIZIALIZZAZIONE TABELLE BUZZERBEATER SECONDO LO SCHEMA SQLITE
  db.exec(`
    CREATE TABLE IF NOT EXISTS "users" (
      "UserID" INTEGER NOT NULL PRIMARY KEY, 
      loginname VARCHAR(50) NOT NULL, 
      name VARCHAR(100), 
      icq VARCHAR(20), 
      language_id INTEGER, 
      language_name VARCHAR(50), 
      has_supporter BOOLEAN, 
      signup_date DATETIME, 
      activation_date DATETIME, 
      last_login_date DATETIME, 
      national_team_coach VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS "utenti" (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
      user VARCHAR, 
      codice VARCHAR, 
      teamid INTEGER, 
      ultimavoltalogin DATE, 
      ultimodownload DATE, 
      nomesquadra VARCHAR, 
      serie VARCHAR, 
      shortname VARCHAR, 
      owner VARCHAR, 
      createdate DATE, 
      country VARCHAR, 
      rival VARCHAR, 
      rivalname VARCHAR
    );

    CREATE TABLE IF NOT EXISTS "arena" (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
      user_id INTEGER, 
      teamid INTEGER NOT NULL, 
      retrieved DATE NOT NULL, 
      name VARCHAR NOT NULL, 
      bleachers INTEGER NOT NULL, 
      bleachers_price INTEGER NOT NULL, 
      bleachers_next_price INTEGER NOT NULL, 
      lower_tier INTEGER NOT NULL, 
      lower_tier_price INTEGER NOT NULL, 
      lower_tier_next_price INTEGER NOT NULL, 
      courtside INTEGER NOT NULL, 
      courtside_price INTEGER NOT NULL, 
      courtside_next_price INTEGER NOT NULL, 
      luxury INTEGER NOT NULL, 
      luxury_price INTEGER NOT NULL, 
      luxury_next_price INTEGER NOT NULL, 
      FOREIGN KEY(user_id) REFERENCES utenti (id)
    );

    CREATE TABLE IF NOT EXISTS "economia" (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
      user_id INTEGER, 
      "DataRetrieved" DATE, 
      "DataRif" DATE, 
      "Initial" INTEGER, 
      "playerSalaries" INTEGER, 
      "staffSalaries" INTEGER, 
      merchandise INTEGER, 
      scouting INTEGER, 
      "tvMoney" INTEGER, 
      unknown INTEGER, 
      "arenaExpansion" INTEGER, 
      "matchRevenue" INTEGER, 
      transfer INTEGER, 
      current INTEGER, 
      FOREIGN KEY(user_id) REFERENCES utenti (id)
    );

    CREATE TABLE IF NOT EXISTS "giocatori" (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
      user_id INTEGER, 
      playerid VARCHAR, 
      owner INTEGER, 
      name VARCHAR, 
      pos VARCHAR, 
      min INTEGER DEFAULT 0, 
      js INTEGER DEFAULT 1, 
      jr INTEGER DEFAULT 1, 
      od INTEGER DEFAULT 1, 
      ha INTEGER DEFAULT 1, 
      dr INTEGER DEFAULT 1, 
      pa INTEGER DEFAULT 1, 
      ish INTEGER DEFAULT 1, 
      ide INTEGER DEFAULT 1, 
      rb INTEGER DEFAULT 1, 
      sb INTEGER DEFAULT 1, 
      st INTEGER DEFAULT 1, 
      ft INTEGER DEFAULT 1, 
      ex INTEGER DEFAULT 1, 
      gs INTEGER DEFAULT 7, 
      age INTEGER DEFAULT 18, 
      height VARCHAR, 
      potential INTEGER DEFAULT 5, 
      dmi INTEGER DEFAULT 10000, 
      salary INTEGER DEFAULT 2500, 
      pg INTEGER DEFAULT 0, 
      sg INTEGER DEFAULT 0, 
      sf INTEGER DEFAULT 0, 
      pf INTEGER DEFAULT 0, 
      c INTEGER DEFAULT 0, 
      data_import VARCHAR, 
      for_sale INTEGER DEFAULT 0, 
      skill_tot INTEGER DEFAULT 0, 
      skill_int INTEGER DEFAULT 0, 
      skill_out INTEGER DEFAULT 0, 
      FOREIGN KEY(user_id) REFERENCES utenti (id)
    );

    CREATE TABLE IF NOT EXISTS "partite" (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
      user_id INTEGER NOT NULL, 
      matchid INTEGER, 
      stagione INTEGER, 
      "teamAway" VARCHAR, 
      "risAway" INTEGER, 
      "risHome" INTEGER, 
      "teamHome" VARCHAR, 
      date DATE, 
      type VARCHAR, 
      retrieve DATE, 
      inizio DATE, 
      fine DATE, 
      bleachers INTEGER, 
      lower_tier INTEGER, 
      courtside INTEGER, 
      luxury INTEGER, 
      total_attendance INTEGER, 
      FOREIGN KEY(user_id) REFERENCES utenti (id)
    );

    CREATE TABLE IF NOT EXISTS "minutigiocati" (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
      match_id INTEGER, 
      user_id INTEGER, 
      playerid VARCHAR, 
      player_name VARCHAR, 
      position VARCHAR, 
      minuti_giocati INTEGER, 
      inizio DATE, 
      fine DATE, 
      FOREIGN KEY(match_id) REFERENCES partite (id), 
      FOREIGN KEY(user_id) REFERENCES utenti (id)
    );

    CREATE TABLE IF NOT EXISTS "player_stats" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "user_id" INTEGER,
      "owner_id" INTEGER,
      "player_id" INTEGER,
      "first_name" TEXT,
      "last_name" TEXT,
      "games" INTEGER,
      "mpg" REAL,
      "fgm" REAL,
      "tpm" REAL,
      "ftm" REAL,
      "fga" TEXT,
      "tpa" TEXT,
      "fta" TEXT,
      "orpg" REAL,
      "rpg" REAL,
      "apg" REAL,
      "topg" REAL,
      "spg" REAL,
      "bpg" REAL,
      "ppg" REAL,
      "fpg" REAL,
      "rating" REAL,
      "mode" TEXT,
      "season" INTEGER,
      "inizio" TEXT,
      "fine" TEXT
    );

    CREATE TABLE IF NOT EXISTS "roster" (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
      user_id INTEGER, 
      playerid INTEGER NOT NULL UNIQUE, 
      owner INTEGER NOT NULL, 
      retrieved DATE, 
      first_name VARCHAR NOT NULL, 
      last_name VARCHAR NOT NULL, 
      nationality_id INTEGER NOT NULL, 
      nationality VARCHAR NOT NULL, 
      age INTEGER NOT NULL, 
      height INTEGER NOT NULL, 
      dmi INTEGER NOT NULL, 
      salary INTEGER NOT NULL, 
      best_position VARCHAR NOT NULL, 
      season_drafted INTEGER NOT NULL, 
      league_drafted INTEGER NOT NULL, 
      team_drafted INTEGER NOT NULL, 
      draft_pick INTEGER NOT NULL, 
      for_sale INTEGER NOT NULL, 
      game_shape INTEGER NOT NULL, 
      potential INTEGER NOT NULL, 
      jump_shot INTEGER NOT NULL, 
      range INTEGER NOT NULL, 
      outside_def INTEGER NOT NULL, 
      handling INTEGER NOT NULL, 
      driving INTEGER NOT NULL, 
      passing INTEGER NOT NULL, 
      inside_shot INTEGER NOT NULL, 
      inside_def INTEGER NOT NULL, 
      rebound INTEGER NOT NULL, 
      block INTEGER NOT NULL, 
      stamina INTEGER NOT NULL, 
      free_throw INTEGER NOT NULL, 
      experience INTEGER NOT NULL, 
      skill_tot INTEGER, 
      skill_int INTEGER, 
      skill_out INTEGER, 
      giocatore_id INTEGER, 
      FOREIGN KEY(user_id) REFERENCES utenti (id), 
      FOREIGN KEY(giocatore_id) REFERENCES giocatori (id)
    );

    CREATE TABLE IF NOT EXISTS "valutazioni_team" (
      coeff_id INTEGER NOT NULL PRIMARY KEY, 
      position VARCHAR, 
      "JS" FLOAT, 
      "JR" FLOAT, 
      "OD" FLOAT, 
      "HA" FLOAT, 
      "DR" FLOAT, 
      "PA" FLOAT, 
      "ISH" FLOAT, 
      "ID" FLOAT, 
      "RB" FLOAT, 
      "SB" FLOAT, 
      abs FLOAT, 
      rel FLOAT, 
      coeff VARCHAR, 
      const FLOAT
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
      FOREIGN KEY("UserID") REFERENCES users ("UserID")
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
      FOREIGN KEY("UserID") REFERENCES users ("UserID"), 
      FOREIGN KEY("TeamID") REFERENCES "TeamDetails" ("TeamID")
    );
  `);

  // Aggiornamento garantito: sostituisce qualsiasi residuo di "Red Vipers" con "UTC"
  try {
    db.exec(`
      UPDATE utenti SET nomesquadra = 'UTC', shortname = 'UTC' 
      WHERE nomesquadra LIKE '%Viper%' OR shortname = 'FRV';
    `);
    db.exec(`
      UPDATE partite SET teamHome = 'UTC' WHERE teamHome LIKE '%Viper%';
      UPDATE partite SET teamAway = 'UTC' WHERE teamAway LIKE '%Viper%';
    `);
  } catch (e) {}

  // SEED DEMO DATA SE UTENTI / GIOCATORI SONO VUOTI
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM utenti').get() as { count: number }).count;
  if (userCount === 0) {
    console.log('[BUZZERBEATER] Inizializzazione dati demo BuzzerBeater...');
    
    // Inserisci Utente / Squadra
    const teamInsert = db.prepare(`
      INSERT INTO utenti (id, user, codice, teamid, ultimavoltalogin, ultimodownload, nomesquadra, serie, shortname, owner, createdate, country, rival, rivalname)
      VALUES (1, 'fire', 'BB-ITALIA-99', 102934, date('now'), date('now'), 'UTC', 'Serie II.2', 'UTC', 'fire', '2023-09-15', 'Italia', '105412', 'Bologna Dunkers')
    `);
    teamInsert.run();

    // Arena Palazzetto
    const arenaInsert = db.prepare(`
      INSERT INTO arena (id, user_id, teamid, retrieved, name, bleachers, bleachers_price, bleachers_next_price, lower_tier, lower_tier_price, lower_tier_next_price, courtside, courtside_price, courtside_next_price, luxury, luxury_price, luxury_next_price)
      VALUES (1, 1, 102934, date('now'), 'Mandela Forum', 9500, 12, 12, 2200, 38, 40, 550, 125, 130, 35, 950, 980)
    `);
    arenaInsert.run();

    // Economia
    const econInsert = db.prepare(`
      INSERT INTO economia (id, user_id, DataRetrieved, DataRif, Initial, playerSalaries, staffSalaries, merchandise, scouting, tvMoney, unknown, arenaExpansion, matchRevenue, transfer, current)
      VALUES (1, 1, date('now'), date('now'), 850000, 124800, 34200, 28400, 10000, 85000, 0, 0, 172600, 0, 966800)
    `);
    econInsert.run();

    // Giocatori dimostrativi con skill reali BuzzerBeater (scala 1-20)
    const demoPlayers = [
      {
        playerid: '3810291',
        name: 'Marco Bellini',
        pos: 'PG',
        min: 62,
        js: 13, jr: 11, od: 14, ha: 12, dr: 12, pa: 14,
        ish: 7, ide: 6, rb: 4, sb: 3, st: 8, ft: 9, ex: 7, gs: 9,
        age: 23, height: '185 cm / 6\'1"', potential: 9, dmi: 325000, salary: 28500,
        nat: 'Italia'
      },
      {
        playerid: '3759124',
        name: 'Andrea Conti',
        pos: 'SG',
        min: 58,
        js: 15, jr: 14, od: 13, ha: 10, dr: 11, pa: 8,
        ish: 8, ide: 7, rb: 5, sb: 4, st: 7, ft: 11, ex: 8, gs: 9,
        age: 25, height: '193 cm / 6\'4"', potential: 8, dmi: 290000, salary: 24200,
        nat: 'Italia'
      },
      {
        playerid: '3620194',
        name: 'Alessandro Rossi',
        pos: 'SF',
        min: 68,
        js: 12, jr: 9, od: 12, ha: 10, dr: 11, pa: 9,
        ish: 12, ide: 11, rb: 10, sb: 7, st: 8, ft: 8, ex: 9, gs: 8,
        age: 27, height: '201 cm / 6\'7"', potential: 8, dmi: 380000, salary: 31000,
        nat: 'Italia'
      },
      {
        playerid: '3840192',
        name: 'Luca De Luca',
        pos: 'PF',
        min: 72,
        js: 9, jr: 4, od: 8, ha: 7, dr: 8, pa: 6,
        ish: 14, ide: 14, rb: 13, sb: 11, st: 7, ft: 6, ex: 6, gs: 8,
        age: 24, height: '206 cm / 6\'9"', potential: 9, dmi: 410000, salary: 33400,
        nat: 'Italia'
      },
      {
        playerid: '3519823',
        name: 'Stefan Jokic',
        pos: 'C',
        min: 54,
        js: 8, jr: 3, od: 7, ha: 6, dr: 6, pa: 7,
        ish: 15, ide: 16, rb: 16, sb: 13, st: 6, ft: 7, ex: 10, gs: 9,
        age: 28, height: '213 cm / 7\'0"', potential: 10, dmi: 540000, salary: 42000,
        nat: 'Serbia'
      },
      {
        playerid: '4019284',
        name: 'Matteo Barbieri',
        pos: 'PG',
        min: 48,
        js: 10, jr: 9, od: 11, ha: 11, dr: 10, pa: 11,
        ish: 5, ide: 5, rb: 3, sb: 2, st: 6, ft: 7, ex: 3, gs: 9,
        age: 20, height: '183 cm / 6\'0"', potential: 10, dmi: 120000, salary: 11500,
        nat: 'Italia'
      },
      {
        playerid: '3940122',
        name: 'Davide Moretti',
        pos: 'SG',
        min: 34,
        js: 12, jr: 11, od: 11, ha: 9, dr: 9, pa: 7,
        ish: 9, ide: 8, rb: 6, sb: 4, st: 7, ft: 8, ex: 4, gs: 7,
        age: 22, height: '198 cm / 6\'6"', potential: 8, dmi: 185000, salary: 15200,
        nat: 'Italia'
      },
      {
        playerid: '3419021',
        name: 'Giorgio Gallinari',
        pos: 'PF',
        min: 24,
        js: 7, jr: 2, od: 6, ha: 5, dr: 5, pa: 5,
        ish: 12, ide: 13, rb: 12, sb: 10, st: 6, ft: 6, ex: 11, gs: 8,
        age: 29, height: '208 cm / 6\'10"', potential: 7, dmi: 230000, salary: 18900,
        nat: 'Italia'
      },
      {
        playerid: '4081923',
        name: 'Valerio Gentile',
        pos: 'SG',
        min: 82,
        js: 9, jr: 8, od: 9, ha: 9, dr: 9, pa: 8,
        ish: 6, ide: 5, rb: 4, sb: 3, st: 6, ft: 8, ex: 3, gs: 6,
        age: 21, height: '190 cm / 6\'3"', potential: 9, dmi: 95000, salary: 8800,
        nat: 'Italia'
      },
      {
        playerid: '3691024',
        name: 'Kevin O\'Connor',
        pos: 'C',
        min: 48,
        js: 6, jr: 2, od: 6, ha: 5, dr: 5, pa: 4,
        ish: 11, ide: 12, rb: 13, sb: 12, st: 5, ft: 5, ex: 7, gs: 8,
        age: 26, height: '211 cm / 6\'11"', potential: 7, dmi: 210000, salary: 17500,
        nat: 'Irlanda'
      }
    ];

    const insertGiocatore = db.prepare(`
      INSERT INTO giocatori (
        user_id, playerid, owner, name, pos, min, js, jr, od, ha, dr, pa, ish, ide, rb, sb, st, ft, ex, gs, age, height, potential, dmi, salary,
        skill_tot, skill_int, skill_out, data_import
      ) VALUES (
        1, @playerid, 102934, @name, @pos, @min, @js, @jr, @od, @ha, @dr, @pa, @ish, @ide, @rb, @sb, @st, @ft, @ex, @gs, @age, @height, @potential, @dmi, @salary,
        @skill_tot, @skill_int, @skill_out, date('now')
      )
    `);

    const insertRoster = db.prepare(`
      INSERT INTO roster (
        user_id, playerid, owner, retrieved, first_name, last_name, nationality_id, nationality, age, height, dmi, salary,
        best_position, season_drafted, league_drafted, team_drafted, draft_pick, for_sale, game_shape, potential,
        jump_shot, range, outside_def, handling, driving, passing, inside_shot, inside_def, rebound, block, stamina, free_throw, experience,
        skill_tot, skill_int, skill_out, giocatore_id
      ) VALUES (
        1, @playerid, 102934, date('now'), @first_name, @last_name, 1, @nat, @age, @height_num, @dmi, @salary,
        @pos, 60, 2, 102934, 1, 0, @gs, @potential,
        @js, @jr, @od, @ha, @dr, @pa, @ish, @ide, @rb, @sb, @st, @ft, @ex,
        @skill_tot, @skill_int, @skill_out, @giocatore_id
      )
    `);

    const insertMinute = db.prepare(`
      INSERT INTO minutigiocati (user_id, playerid, player_name, position, minuti_giocati, inizio, fine)
      VALUES (1, ?, ?, ?, ?, date('now', '-7 days'), date('now'))
    `);

    for (const p of demoPlayers) {
      const skill_out = p.js + p.jr + p.od + p.ha + p.dr + p.pa;
      const skill_int = p.ish + p.ide + p.rb + p.sb;
      const skill_tot = skill_out + skill_int + p.st + p.ft;

      const res = insertGiocatore.run({
        ...p,
        skill_tot,
        skill_int,
        skill_out
      });
      const gId = res.lastInsertRowid;

      const [first, ...rest] = p.name.split(' ');
      const last = rest.join(' ');
      const heightNum = parseInt(p.height, 10) || 195;

      insertRoster.run({
        playerid: parseInt(p.playerid, 10),
        first_name: first,
        last_name: last,
        nat: p.nat,
        age: p.age,
        height_num: heightNum,
        dmi: p.dmi,
        salary: p.salary,
        pos: p.pos,
        gs: p.gs,
        potential: p.potential,
        js: p.js, jr: p.jr, od: p.od, ha: p.ha, dr: p.dr, pa: p.pa,
        ish: p.ish, ide: p.ide, rb: p.rb, sb: p.sb, st: p.st, ft: p.ft, ex: p.ex,
        skill_tot, skill_int, skill_out,
        giocatore_id: gId
      });

      insertMinute.run(p.playerid, p.name, p.pos, p.min);
    }

    // Partite recenti & in programma
    const insertPartita = db.prepare(`
      INSERT INTO partite (
        user_id, matchid, stagione, teamAway, risAway, risHome, teamHome, date, type, retrieve, inizio, fine,
        bleachers, lower_tier, courtside, luxury, total_attendance
      ) VALUES (
        1, @matchid, 62, @teamAway, @risAway, @risHome, @teamHome, @date, @type, date('now'), date('now'), date('now'),
        @bleachers, @lower_tier, @courtside, @luxury, @total_attendance
      )
    `);

    const demoMatches = [
      {
        matchid: 110291,
        teamHome: 'UTC',
        teamAway: 'Bologna Dunkers',
        risHome: 98,
        risAway: 92,
        date: '2026-08-26',
        type: 'Campionato',
        bleachers: 9500, lower_tier: 2200, courtside: 550, luxury: 35, total_attendance: 12285
      },
      {
        matchid: 110298,
        teamHome: 'Milano Hoops',
        teamAway: 'UTC',
        risHome: 85,
        risAway: 91,
        date: '2026-08-29',
        type: 'Campionato',
        bleachers: 8200, lower_tier: 1900, courtside: 400, luxury: 25, total_attendance: 10525
      },
      {
        matchid: 110305,
        teamHome: 'UTC',
        teamAway: 'Virtus Treviso',
        risHome: 104,
        risAway: 101,
        date: '2026-09-02',
        type: 'Coppa Italia',
        bleachers: 9350, lower_tier: 2150, courtside: 530, luxury: 34, total_attendance: 12064
      },
      {
        matchid: 110312,
        teamHome: 'Roma Gladiators',
        teamAway: 'UTC',
        risHome: 94,
        risAway: 88,
        date: '2026-09-05',
        type: 'Campionato',
        bleachers: 8900, lower_tier: 2000, courtside: 480, luxury: 30, total_attendance: 11410
      },
      {
        matchid: 110319,
        teamHome: 'UTC',
        teamAway: 'Napoli Basket',
        risHome: 0,
        risAway: 0,
        date: '2026-09-09',
        type: 'Campionato',
        bleachers: 0, lower_tier: 0, courtside: 0, luxury: 0, total_attendance: 0
      },
      {
        matchid: 110326,
        teamHome: 'Reyer Venezia',
        teamAway: 'UTC',
        risHome: 0,
        risAway: 0,
        date: '2026-09-12',
        type: 'Campionato',
        bleachers: 0, lower_tier: 0, courtside: 0, luxury: 0, total_attendance: 0
      }
    ];

    for (const m of demoMatches) {
      insertPartita.run(m);
    }

    // Statistiche dimostrative dei giocatori
    const insertStat = db.prepare(`
      INSERT INTO player_stats (
        user_id, owner_id, player_id, first_name, last_name, games, mpg, fgm, tpm, ftm, fga, tpa, fta,
        orpg, rpg, apg, topg, spg, bpg, ppg, fpg, rating, season
      ) VALUES (
        1, 102934, @player_id, @first_name, @last_name, @games, @mpg, @fgm, @tpm, @ftm, @fga, @tpa, @fta,
        @orpg, @rpg, @apg, @topg, @spg, @bpg, @ppg, @fpg, @rating, 62
      )
    `);

    insertStat.run({
      player_id: 3810291, first_name: 'Marco', last_name: 'Bellini',
      games: 4, mpg: 31.0, fgm: 6.2, tpm: 2.5, ftm: 3.2, fga: '12.5', tpa: '5.2', fta: '3.8',
      orpg: 0.8, rpg: 3.5, apg: 8.2, topg: 2.1, spg: 2.4, bpg: 0.3, ppg: 18.1, fpg: 2.0, rating: 12.5
    });
    insertStat.run({
      player_id: 3759124, first_name: 'Andrea', last_name: 'Conti',
      games: 4, mpg: 29.0, fgm: 7.5, tpm: 3.8, ftm: 3.0, fga: '15.0', tpa: '8.0', fta: '3.2',
      orpg: 0.5, rpg: 4.1, apg: 3.4, topg: 1.8, spg: 1.8, bpg: 0.2, ppg: 21.8, fpg: 2.2, rating: 13.0
    });
    insertStat.run({
      player_id: 3620194, first_name: 'Alessandro', last_name: 'Rossi',
      games: 4, mpg: 34.0, fgm: 6.0, tpm: 1.2, ftm: 4.0, fga: '13.0', tpa: '3.5', fta: '4.8',
      orpg: 2.2, rpg: 8.5, apg: 4.0, topg: 2.5, spg: 1.5, bpg: 1.0, ppg: 17.2, fpg: 2.8, rating: 12.0
    });
    insertStat.run({
      player_id: 3840192, first_name: 'Luca', last_name: 'De Luca',
      games: 4, mpg: 36.0, fgm: 7.8, tpm: 0.2, ftm: 2.8, fga: '14.2', tpa: '1.0', fta: '4.5',
      orpg: 3.8, rpg: 11.2, apg: 2.1, topg: 1.9, spg: 1.0, bpg: 2.2, ppg: 18.6, fpg: 3.1, rating: 13.5
    });
    insertStat.run({
      player_id: 3519823, first_name: 'Stefan', last_name: 'Jokic',
      games: 4, mpg: 27.0, fgm: 6.5, tpm: 0.0, ftm: 3.5, fga: '10.5', tpa: '0.0', fta: '5.0',
      orpg: 4.2, rpg: 14.5, apg: 3.8, topg: 2.0, spg: 0.8, bpg: 2.8, ppg: 16.5, fpg: 3.4, rating: 14.0
    });
  }

  // ==================== API ENDPOINTS BUZZERBEATER ====================

  // Elenco Utenti per selezione in testata (tabella utenti campo user)
  router.get('/users', (req: Request, res: Response) => {
    try {
      const users = db.prepare(`
        SELECT id, user, codice, teamid, ultimavoltalogin, ultimodownload, nomesquadra, serie, shortname, owner, createdate, country, rival, rivalname
        FROM utenti
        ORDER BY id ASC
      `).all();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Overview / Dashboard Stats
  router.get('/dashboard', (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      const userId = currentUser.id;
      const teamId = currentUser.teamid;
      const username = currentUser.user;

      const team = db.prepare('SELECT * FROM utenti WHERE id = ? OR LOWER(user) = LOWER(?) LIMIT 1').get(userId, username) as any ||
                   db.prepare('SELECT * FROM utenti LIMIT 1').get() as any;
      const arena = (teamId ? db.prepare('SELECT * FROM arena WHERE teamid = ? OR user_id = ? LIMIT 1').get(teamId, userId) : null) as any ||
                    db.prepare('SELECT * FROM arena LIMIT 1').get() as any;
      const economy = (userId ? db.prepare('SELECT * FROM economia WHERE user_id = ? LIMIT 1').get(userId) : null) as any ||
                      db.prepare('SELECT * FROM economia LIMIT 1').get() as any;

      // SOLO giocatori con owner <> 0 e dove owner E user_id = utente scelto
      const players = db.prepare(`
        SELECT g.*, r.nationality, r.best_position, r.game_shape
        FROM giocatori g
        LEFT JOIN roster r ON g.playerid = CAST(r.playerid AS TEXT) OR g.id = r.giocatore_id
        WHERE (g.owner IS NOT NULL AND g.owner != 0 AND CAST(g.owner AS TEXT) != '0' AND TRIM(CAST(g.owner AS TEXT)) != '')
          AND (g.user_id = ? OR CAST(g.user_id AS TEXT) = ?)
          AND (
            (? IS NOT NULL AND g.owner = ?)
            OR g.owner = ?
            OR CAST(g.owner AS TEXT) = ?
          )
        ORDER BY 
          CASE g.pos 
            WHEN 'PG' THEN 1 
            WHEN 'SG' THEN 2 
            WHEN 'SF' THEN 3 
            WHEN 'PF' THEN 4 
            WHEN 'C' THEN 5 
            ELSE 6 
          END,
          g.salary DESC
      `).all(userId, username, teamId, teamId, userId, username) as any[];

      const activePlayerIds = new Set(players.map((p) => String(p.playerid)));

      // Minuti: filtrati per i giocatori dell'utente scelto con owner <> 0
      const allMinutes = db.prepare(`
        SELECT m.*, g.name, g.pos, g.gs as game_shape, g.salary, g.dmi
        FROM minutigiocati m
        JOIN giocatori g ON m.playerid = g.playerid
        WHERE (g.owner IS NOT NULL AND g.owner != 0 AND CAST(g.owner AS TEXT) != '0')
          AND (g.user_id = ? OR CAST(g.user_id AS TEXT) = ?)
          AND (
            (? IS NOT NULL AND g.owner = ?)
            OR g.owner = ?
            OR CAST(g.owner AS TEXT) = ?
          )
        ORDER BY m.minuti_giocati DESC
      `).all(userId, username, teamId, teamId, userId, username) as any[];

      const minutes = allMinutes.filter((m) => activePlayerIds.has(String(m.playerid)));

      // Partite
      const matches = db.prepare(`
        SELECT p.*,
          (COALESCE(p.bleachers, 0) * 12 + 
           COALESCE(p.lower_tier, 0) * 38 + 
           COALESCE(p.courtside, 0) * 125 + 
           COALESCE(p.luxury, 0) * 950) as incassoTotale
        FROM partite p
        ORDER BY p.date DESC
      `).all() as any[];

      const totalSalaries = players.reduce((sum, p) => sum + (p.salary || 0), 0);
      const weeklyMinutesTotal = minutes.reduce((sum, m) => sum + (m.minuti_giocati || 0), 0);
      const optimalShapePlayers = minutes.filter((m) => m.minuti_giocati >= 48 && m.minuti_giocati <= 75).length;

      const lastMatch = matches.find((m) => m.risHome > 0 || m.risAway > 0) || null;
      const nextMatch = matches.slice().reverse().find((m) => m.risHome === 0 && m.risAway === 0) || null;

      let stats: any[] = [];
      try {
        const rawStats = db.prepare('SELECT * FROM player_stats').all() as any[];
        stats = rawStats.filter((s) => activePlayerIds.has(String(s.player_id)));
      } catch (e) {}

      res.json({
        currentUser: {
          username: currentUser.user,
          userId,
          teamId,
          teamName: currentUser.nomesquadra || team?.nomesquadra || 'UTC'
        },
        team: team || null,
        arena: arena ? {
          ...arena,
          total_capacity: arena.bleachers + arena.lower_tier + arena.courtside + arena.luxury
        } : null,
        economy: economy ? {
          ...economy,
          saldo_attuale: economy.current ?? economy.Initial ?? 966800,
          incassi_palazzetto: economy.matchRevenue ?? 172600,
          diritti_tv: economy.tvMoney ?? 85000,
          merchandising: economy.merchandise ?? 28400,
          sponsor: 42000,
          stipendi_staff: economy.staffSalaries ?? 34200,
          manutenzione_arena: economy.arenaExpansion ?? 12000,
          weeklyBalance: ((economy.matchRevenue || 0) + (economy.tvMoney || 0) + (economy.merchandise || 0)) -
                         ((economy.playerSalaries || 0) + (economy.staffSalaries || 0) + (economy.scouting || 0))
        } : null,
        playersCount: players.length,
        totalSalaries,
        weeklyMinutesTotal,
        optimalShapePlayers,
        lastMatch,
        nextMatch,
        roster: players,
        matches,
        minutes,
        stats
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Roster / Giocatori (SOLO owner <> 0 e dove owner E user_id = utente scelto)
  router.get('/roster', (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      const userId = currentUser.id;
      const teamId = currentUser.teamid;
      const username = currentUser.user;

      const players = db.prepare(`
        SELECT g.*, r.nationality, r.best_position, r.game_shape
        FROM giocatori g
        LEFT JOIN roster r ON g.playerid = CAST(r.playerid AS TEXT) OR g.id = r.giocatore_id
        WHERE (g.owner IS NOT NULL AND g.owner != 0 AND CAST(g.owner AS TEXT) != '0' AND TRIM(CAST(g.owner AS TEXT)) != '')
          AND (g.user_id = ? OR CAST(g.user_id AS TEXT) = ?)
          AND (
            (? IS NOT NULL AND g.owner = ?)
            OR g.owner = ?
            OR CAST(g.owner AS TEXT) = ?
          )
        ORDER BY 
          CASE g.pos 
            WHEN 'PG' THEN 1 
            WHEN 'SG' THEN 2 
            WHEN 'SF' THEN 3 
            WHEN 'PF' THEN 4 
            WHEN 'C' THEN 5 
            ELSE 6 
          END,
          g.salary DESC
      `).all(userId, username, teamId, teamId, userId, username) as any[];

      res.json(players);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Aggiungi Giocatore
  router.post('/roster', (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      const userId = currentUser.id;
      const ownerVal = currentUser.teamid || currentUser.id || 102934;

      const p = req.body;
      const pid = p.playerid || `${Math.floor(1000000 + Math.random() * 9000000)}`;
      const skill_out = (Number(p.js) || 1) + (Number(p.jr) || 1) + (Number(p.od) || 1) + (Number(p.ha) || 1) + (Number(p.dr) || 1) + (Number(p.pa) || 1);
      const skill_int = (Number(p.ish) || 1) + (Number(p.ide) || 1) + (Number(p.rb) || 1) + (Number(p.sb) || 1);
      const skill_tot = skill_out + skill_int + (Number(p.st) || 1) + (Number(p.ft) || 1);

      const insertG = db.prepare(`
        INSERT INTO giocatori (
          user_id, playerid, owner, name, pos, min, js, jr, od, ha, dr, pa, ish, ide, rb, sb, st, ft, ex, gs, age, height, potential, dmi, salary,
          skill_tot, skill_int, skill_out, data_import
        ) VALUES (
          @user_id, @playerid, @owner, @name, @pos, @min, @js, @jr, @od, @ha, @dr, @pa, @ish, @ide, @rb, @sb, @st, @ft, @ex, @gs, @age, @height, @potential, @dmi, @salary,
          @skill_tot, @skill_int, @skill_out, date('now')
        )
      `);

      const result = insertG.run({
        user_id: userId,
        playerid: pid,
        owner: ownerVal,
        name: p.name || 'Nuovo Giocatore',
        pos: p.pos || 'PG',
        min: Number(p.min) || 0,
        js: Number(p.js) || 7,
        jr: Number(p.jr) || 6,
        od: Number(p.od) || 7,
        ha: Number(p.ha) || 7,
        dr: Number(p.dr) || 7,
        pa: Number(p.pa) || 7,
        ish: Number(p.ish) || 5,
        ide: Number(p.ide) || 5,
        rb: Number(p.rb) || 5,
        sb: Number(p.sb) || 4,
        st: Number(p.st) || 6,
        ft: Number(p.ft) || 7,
        ex: Number(p.ex) || 3,
        gs: Number(p.gs) || 8,
        age: Number(p.age) || 20,
        height: p.height || '190 cm / 6\'3"',
        potential: Number(p.potential) || 7,
        dmi: Number(p.dmi) || 85000,
        salary: Number(p.salary) || 8000,
        skill_tot,
        skill_int,
        skill_out
      });

      // Aggiungi anche a minutigiocati
      db.prepare(`
        INSERT INTO minutigiocati (user_id, playerid, player_name, position, minuti_giocati, inizio, fine)
        VALUES (?, ?, ?, ?, ?, date('now', '-7 days'), date('now'))
      `).run(userId, pid, p.name || 'Nuovo Giocatore', p.pos || 'PG', Number(p.min) || 0);

      const created = db.prepare('SELECT * FROM giocatori WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Aggiorna Giocatore
  router.put('/roster/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const p = req.body;

      const skill_out = (Number(p.js) || 1) + (Number(p.jr) || 1) + (Number(p.od) || 1) + (Number(p.ha) || 1) + (Number(p.dr) || 1) + (Number(p.pa) || 1);
      const skill_int = (Number(p.ish) || 1) + (Number(p.ide) || 1) + (Number(p.rb) || 1) + (Number(p.sb) || 1);
      const skill_tot = skill_out + skill_int + (Number(p.st) || 1) + (Number(p.ft) || 1);

      db.prepare(`
        UPDATE giocatori SET
          name = @name, pos = @pos, min = @min,
          js = @js, jr = @jr, od = @od, ha = @ha, dr = @dr, pa = @pa,
          ish = @ish, ide = @ide, rb = @rb, sb = @sb, st = @st, ft = @ft, ex = @ex, gs = @gs,
          age = @age, height = @height, potential = @potential, dmi = @dmi, salary = @salary,
          skill_tot = @skill_tot, skill_int = @skill_int, skill_out = @skill_out
        WHERE id = @id
      `).run({
        id,
        name: p.name,
        pos: p.pos,
        min: Number(p.min) || 0,
        js: Number(p.js) || 1,
        jr: Number(p.jr) || 1,
        od: Number(p.od) || 1,
        ha: Number(p.ha) || 1,
        dr: Number(p.dr) || 1,
        pa: Number(p.pa) || 1,
        ish: Number(p.ish) || 1,
        ide: Number(p.ide) || 1,
        rb: Number(p.rb) || 1,
        sb: Number(p.sb) || 1,
        st: Number(p.st) || 1,
        ft: Number(p.ft) || 1,
        ex: Number(p.ex) || 1,
        gs: Number(p.gs) || 1,
        age: Number(p.age) || 20,
        height: p.height,
        potential: Number(p.potential) || 5,
        dmi: Number(p.dmi) || 10000,
        salary: Number(p.salary) || 3000,
        skill_tot,
        skill_int,
        skill_out
      });

      const updated = db.prepare('SELECT * FROM giocatori WHERE id = ?').get(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Elimina Giocatore
  router.delete('/roster/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const player = db.prepare('SELECT playerid FROM giocatori WHERE id = ?').get(id) as any;
      if (player) {
        db.prepare('DELETE FROM minutigiocati WHERE playerid = ?').run(player.playerid);
      }
      db.prepare('DELETE FROM giocatori WHERE id = ?').run(id);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Minuti Giocati & Forma (Training Minutes)
  router.get('/minutes', (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      const userId = currentUser.id;
      const teamId = currentUser.teamid;

      const minutes = db.prepare(`
        SELECT m.*, g.name, g.pos, g.gs as game_shape, g.salary, g.dmi
        FROM minutigiocati m
        JOIN giocatori g ON m.playerid = g.playerid
        WHERE (g.owner IS NOT NULL AND g.owner != 0 AND CAST(g.owner AS TEXT) != '0' AND TRIM(CAST(g.owner AS TEXT)) != '')
          AND (
            g.user_id = ? 
            OR (? IS NOT NULL AND g.owner = ?)
            OR (? IS NOT NULL AND g.owner = ?)
          )
        ORDER BY m.minuti_giocati DESC
      `).all(userId, teamId, teamId, userId, userId) as any[];

      res.json(minutes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/minutes', (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      const userId = currentUser.id;
      const { playerid, minuti_giocati, player_name, position } = req.body;
      const existing = db.prepare('SELECT id FROM minutigiocati WHERE playerid = ?').get(playerid) as any;
      if (existing) {
        db.prepare('UPDATE minutigiocati SET minuti_giocati = ? WHERE id = ?').run(Number(minuti_giocati) || 0, existing.id);
      } else {
        db.prepare(`
          INSERT INTO minutigiocati (user_id, playerid, player_name, position, minuti_giocati, inizio, fine)
          VALUES (?, ?, ?, ?, ?, date('now', '-7 days'), date('now'))
        `).run(userId, playerid, player_name || '', position || 'PG', Number(minuti_giocati) || 0);
      }

      // Aggiorna anche su giocatori
      db.prepare('UPDATE giocatori SET min = ? WHERE playerid = ?').run(Number(minuti_giocati) || 0, playerid);

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Partite (Matches)
  router.get('/matches', (req: Request, res: Response) => {
    try {
      const matches = db.prepare(`
        SELECT p.*,
          (COALESCE(p.bleachers, 0) * 12 + 
           COALESCE(p.lower_tier, 0) * 38 + 
           COALESCE(p.courtside, 0) * 125 + 
           COALESCE(p.luxury, 0) * 950) as incassoTotale
        FROM partite p
        ORDER BY p.date DESC
      `).all();

      res.json(matches);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/matches', (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      const userId = currentUser.id;
      const m = req.body;
      const matchid = m.matchid || Math.floor(100000 + Math.random() * 900000);
      const totalAtt = (Number(m.bleachers) || 0) + (Number(m.lower_tier) || 0) + (Number(m.courtside) || 0) + (Number(m.luxury) || 0);

      const stmt = db.prepare(`
        INSERT INTO partite (
          user_id, matchid, stagione, teamAway, risAway, risHome, teamHome, date, type, retrieve, inizio, fine,
          bleachers, lower_tier, courtside, luxury, total_attendance
        ) VALUES (
          @user_id, @matchid, @stagione, @teamAway, @risAway, @risHome, @teamHome, @date, @type, date('now'), date('now'), date('now'),
          @bleachers, @lower_tier, @courtside, @luxury, @total_attendance
        )
      `);

      stmt.run({
        user_id: userId,
        matchid,
        stagione: Number(m.stagione) || 62,
        teamAway: m.teamAway,
        risAway: Number(m.risAway) || 0,
        risHome: Number(m.risHome) || 0,
        teamHome: m.teamHome,
        date: m.date || new Date().toISOString().split('T')[0],
        type: m.type || 'Campionato',
        bleachers: Number(m.bleachers) || 0,
        lower_tier: Number(m.lower_tier) || 0,
        courtside: Number(m.courtside) || 0,
        luxury: Number(m.luxury) || 0,
        total_attendance: totalAtt
      });

      res.status(201).json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Arena Palazzetto
  router.get('/arena', (req: Request, res: Response) => {
    try {
      const arena = db.prepare('SELECT * FROM arena LIMIT 1').get() as any;
      if (!arena) return res.status(404).json({ error: 'Arena non configurata' });
      res.json({
        ...arena,
        total_capacity: arena.bleachers + arena.lower_tier + arena.courtside + arena.luxury
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/arena', (req: Request, res: Response) => {
    try {
      const a = req.body;
      db.prepare(`
        UPDATE arena SET
          name = @name,
          bleachers = @bleachers, bleachers_price = @bleachers_price, bleachers_next_price = @bleachers_next_price,
          lower_tier = @lower_tier, lower_tier_price = @lower_tier_price, lower_tier_next_price = @lower_tier_next_price,
          courtside = @courtside, courtside_price = @courtside_price, courtside_next_price = @courtside_next_price,
          luxury = @luxury, luxury_price = @luxury_price, luxury_next_price = @luxury_next_price
        WHERE id = 1
      `).run({
        name: a.name || 'Mandela Forum',
        bleachers: Number(a.bleachers) || 9500,
        bleachers_price: Number(a.bleachers_price) || 12,
        bleachers_next_price: Number(a.bleachers_next_price) || 12,
        lower_tier: Number(a.lower_tier) || 2200,
        lower_tier_price: Number(a.lower_tier_price) || 38,
        lower_tier_next_price: Number(a.lower_tier_next_price) || 40,
        courtside: Number(a.courtside) || 550,
        courtside_price: Number(a.courtside_price) || 125,
        courtside_next_price: Number(a.courtside_next_price) || 130,
        luxury: Number(a.luxury) || 35,
        luxury_price: Number(a.luxury_price) || 950,
        luxury_next_price: Number(a.luxury_next_price) || 980
      });

      const updated = db.prepare('SELECT * FROM arena LIMIT 1').get();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Economia
  router.get('/economy', (req: Request, res: Response) => {
    try {
      const econ = db.prepare('SELECT * FROM economia LIMIT 1').get() as any;
      if (!econ) return res.status(404).json({ error: 'Dati economici non trovati' });

      const weeklyIncomes = econ.matchRevenue + econ.tvMoney + econ.merchandise;
      const weeklyExpenses = econ.playerSalaries + econ.staffSalaries + econ.scouting;

      res.json({
        ...econ,
        saldo_attuale: econ.current ?? econ.Initial ?? 966800,
        incassi_palazzetto: econ.matchRevenue ?? 172600,
        diritti_tv: econ.tvMoney ?? 85000,
        merchandising: econ.merchandise ?? 28400,
        sponsor: 42000,
        stipendi_staff: econ.staffSalaries ?? 34200,
        manutenzione_arena: econ.arenaExpansion ?? 12000,
        weeklyBalance: weeklyIncomes - weeklyExpenses
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Statistiche Giocatori (SOLO giocatori con owner <> 0 e dove owner E user_id = utente scelto)
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      const userId = currentUser.id;
      const teamId = currentUser.teamid;
      const username = currentUser.user;

      const stats = db.prepare(`
        SELECT s.* 
        FROM player_stats s
        JOIN giocatori g ON (s.player_id = CAST(g.playerid AS INTEGER) OR s.player_id = g.playerid)
        WHERE (g.owner IS NOT NULL AND g.owner != 0 AND CAST(g.owner AS TEXT) != '0' AND TRIM(CAST(g.owner AS TEXT)) != '')
          AND (g.user_id = ? OR CAST(g.user_id AS TEXT) = ?)
          AND (
            (? IS NOT NULL AND g.owner = ?)
            OR g.owner = ?
            OR CAST(g.owner AS TEXT) = ?
          )
        ORDER BY s.ppg DESC
      `).all(userId, username, teamId, teamId, userId, username);

      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
