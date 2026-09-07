export interface Evento {
  id: number;
  masa_id: number;
  numero: number;
  quota: number;
  puntata: number;
  esito: 'ATTESA' | 'IN CORSO' | 'VINTO' | 'PERSO' | 'NON GIOCATO' | string;
  titolo?: string;
  timestamp?: string;
}

export interface Masa {
  id: number;
  nome: string;
  n_eventi: number;
  eventi_attesi: number;
  capitale: number;
  vinti: number;
  persi: number;
  masa1?: number;
  masa2?: number;
  attivo: number; // 1 = attivo, 0 = chiuso
}

export interface MasaStats extends Masa {
  cassaAttuale: number;
  utileNetto: number;
  roi: number;
  inCorso: number;
  inAttesa: number;
  nGiocati: number;
  nRimasti: number;
  kMancanti: number;
  erroriRimasti: number;
  erroriMax: number;
  stato: 'IN_CORSO' | 'VINTO' | 'PERSO' | 'ARCHIVIATO' | string;
  eventi: Evento[];
}

export interface AuthMe {
  username: string;
  isAdmin: boolean;
  role: 'admin' | 'user';
  permissions: string[];
  authMethod: string;
  dbPath: string;
  systemdPort: number;
  timestamp?: string;
}

export interface DatabaseInfoItem {
  path: string;
  exists: boolean;
  sizeKB: number;
}

export interface SystemStatus {
  ok: boolean;
  version?: string;
  name?: string;
  isPreview?: boolean;
  dbPath: string;
  dbExists: boolean;
  dbSizeBytes: number;
  dbSizeKB: number;
  totalMasa: number;
  activeMasa: number;
  totalEventi: number;
  totalGiocatori?: number;
  totalPartite?: number;
  totalRecipes?: number;
  totalCategories?: number;
  totalHtPlayers?: number;
  totalHtTeams?: number;
  databases?: {
    masa: DatabaseInfoItem;
    bbeater: DatabaseInfoItem;
    anda: DatabaseInfoItem;
    hattrick: DatabaseInfoItem;
  };
  port: number;
  pid: number;
  nodeVersion: string;
  uptimeSeconds: number;
  memoryUsageMB: number;
  envPortVar: string;
}

export interface MasanielloCalculation {
  status: 'ATTIVO' | 'TARGET_RAGGIUNTO' | 'FALLITO' | 'CONCLUSO';
  messaggio: string;
  puntata: number;
  quota: number;
  kMancanti: number;
  erroriDisponibili: number;
  nRimasti: number;
  cassaAttuale?: number;
  capitaleIniziale?: number;
}

// BuzzerBeater Types
export interface BBPlayer {
  id: number;
  user_id?: number;
  playerid: string;
  owner?: number;
  name: string;
  pos: string; // PG, SG, SF, PF, C
  min?: number; // minuti settimanali
  js: number; // Jump Shot (Tiro in sospensione)
  jr: number; // Jump Range (Distanza tiro)
  od: number; // Outside Defense (Difesa perimetrale)
  ha: number; // Handling (Controllo palla)
  dr: number; // Driving (Penetrazione)
  pa: number; // Passing (Passaggio)
  ish: number; // Inside Shot (Tiro da sotto)
  ide: number; // Inside Defense (Difesa in area)
  rb: number; // Rebounding (Rimbalzo)
  sb: number; // Shot Blocking (Stoppata)
  st: number; // Stamina (Resistenza)
  ft: number; // Free Throw (Tiri liberi)
  ex: number; // Experience (Esperienza)
  gs: number; // Game Shape (Forma 1-9+)
  age: number;
  height: string; // es. "188 cm / 6'2\""
  potential: number; // 1 to 11
  dmi: number;
  salary: number;
  pg?: number;
  sg?: number;
  sf?: number;
  pf?: number;
  c?: number;
  data_import?: string;
  for_sale?: number;
  skill_tot: number;
  skill_int: number;
  skill_out: number;
  best_position?: string;
  nationality?: string;
}

export interface BBArena {
  id: number;
  user_id?: number;
  teamid: number;
  retrieved?: string;
  name: string;
  nome_arena?: string;
  bleachers: number; // Posti in piedi
  bleachers_price: number;
  price_bleachers?: number;
  bleachers_next_price: number;
  lower_tier: number; // Tribuna
  lower_tier_price: number;
  price_lower_tier?: number;
  lower_tier_next_price: number;
  courtside: number; // Bordo campo
  courtside_price: number;
  price_courtside?: number;
  courtside_next_price: number;
  luxury: number; // Palchi d'onore
  luxury_price: number;
  price_luxury?: number;
  luxury_next_price: number;
  total_capacity?: number;
}

export interface BBEconomy {
  id: number;
  user_id?: number;
  DataRetrieved?: string;
  DataRif?: string;
  Initial: number;
  playerSalaries: number;
  staffSalaries: number;
  merchandise: number;
  scouting: number;
  tvMoney: number;
  unknown?: number;
  arenaExpansion: number;
  matchRevenue: number;
  transfer: number;
  current: number;
  weeklyBalance?: number;
  saldo_attuale?: number;
  incassi_palazzetto?: number;
  diritti_tv?: number;
  sponsor?: number;
  stipendi_staff?: number;
  manutenzione_arena?: number;
}

export interface BBMinute {
  id: number;
  match_id?: number;
  user_id?: number;
  playerid: string;
  player_name: string;
  position: string;
  minuti_giocati: number;
  inizio?: string;
  fine?: string;
}

export interface BBMatch {
  id: number;
  user_id?: number;
  matchid?: number;
  stagione: number;
  teamAway: string;
  risAway: number;
  risHome: number;
  teamHome: string;
  date: string;
  type: string; // "Campionato", "Coppa", "Amichevole", "Playoff"
  retrieve?: string;
  inizio?: string;
  fine?: string;
  bleachers?: number;
  lower_tier?: number;
  courtside?: number;
  luxury?: number;
  total_attendance?: number;
  incassoTotale?: number;
}

export interface BBPlayerStat {
  id: number;
  user_id?: number;
  owner_id?: number;
  player_id: number;
  first_name: string;
  last_name: string;
  games: number;
  mpg: number;
  fgm: number;
  tpm: number;
  ftm: number;
  fga: string;
  tpa: string;
  fta: string;
  orpg: number;
  rpg: number;
  apg: number;
  topg: number;
  spg: number;
  bpg: number;
  ppg: number;
  fpg: number;
  rating: number;
  mode?: string;
  season?: number;
}

export interface BBTeam {
  id: number;
  user: string;
  codice?: string;
  teamid: number;
  nomesquadra: string;
  serie: string;
  shortname: string;
  owner: string;
  createdate?: string;
  country: string;
  rival?: string;
  rivalname?: string;
}

export type BBUser = BBTeam;

export interface BBDashboardData {
  currentUser?: {
    username: string;
    userId: number;
    teamId: number | null;
    teamName: string;
  };
  team: BBTeam | null;
  arena: BBArena | null;
  economy: BBEconomy | null;
  playersCount: number;
  totalSalaries: number;
  weeklyMinutesTotal: number;
  optimalShapePlayers: number;
  lastMatch: BBMatch | null;
  nextMatch: BBMatch | null;
  roster?: BBPlayer[];
  matches?: BBMatch[];
  minutes?: BBMinute[];
  stats?: BBPlayerStat[];
}

// AnDa - Ricettario & Calcolatori Parametrici
export interface AndaCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order: number;
  created_at?: string;
  recipe_count?: number;
}

export interface AndaIngredient {
  id?: number;
  recipe_id?: number;
  phase: number;
  name: string;
  quantity: string;
  unit: string;
  notes?: string;
  sort_order: number;
  // Scaled dynamic calculation fields
  scaled_quantity?: string | number;
}

export interface AndaPredefinedQuantity {
  id?: number;
  recipe_id?: number;
  quantity_name: string;
  multiplier: number;
  base_value: number;
}

export interface AndaProcedure {
  id?: number;
  recipe_id?: number;
  step_number: number;
  phase: number;
  description: string;
  image_url?: string;
  timer_minutes?: number;
}

export interface AndaRecipe {
  id: number;
  name: string;
  slug: string;
  category?: string;
  category_id?: number;
  description?: string;
  image_url?: string;
  is_parametric: number; // 0 or 1
  calculator_name?: string;
  prep_time?: number;
  cook_time?: number;
  difficulty?: 'Facile' | 'Media' | 'Difficile' | 'Avanzata' | string;
  created_at?: string;
  updated_at?: string;
  // Computed / Joined
  category_name?: string;
  category_icon?: string;
  category_slug?: string;
  ingredients_count?: number;
  procedures_count?: number;
}

export interface AndaRecipeDetail extends AndaRecipe {
  ingredients: AndaIngredient[];
  procedures: AndaProcedure[];
  predefined_quantities: AndaPredefinedQuantity[];
}

export interface AndaOverview {
  totalRecipes: number;
  parametricRecipes: number;
  totalCategories: number;
  categories: AndaCategory[];
  recentRecipes: AndaRecipe[];
}

// ----------------------------------------------------
// HATTRICK FOOTBALL MANAGER TYPES (SCHEMA EXACT UTENTE)
// ----------------------------------------------------

export interface HtRoleRating {
  code: 'GK' | 'CD' | 'WB' | 'IM' | 'W' | 'FW' | string;
  label: string;
  rating: number;
}

export interface HtPlayer {
  PlayerID: number;
  FirstName: string;
  NickName?: string | null;
  LastName: string;
  PlayerNumber: number;
  Age: number;
  AgeDays: number;
  ArrivalDate?: string;
  OwnerNotes?: string | null;
  TSI: number;
  PlayerForm: number; // 1-8
  Statement?: string;
  Experience: number; // 1-20
  Loyalty: number; // 1-20
  MotherClubBonus: number | boolean;
  Leadership: number; // 1-8
  Salary: number;
  IsAbroad: number | boolean;
  Agreeability: number;
  Aggressiveness: number;
  Honesty: number;
  LeagueGoals: number;
  CupGoals: number;
  FriendliesGoals: number;
  CareerGoals: number;
  CareerHattricks: number;
  MatchesCurrentTeam: number;
  GoalsCurrentTeam: number;
  AssistsCurrentTeam: number;
  CareerAssists: number;
  Specialty: number; // 0=Nessuna, 1=Tecnico, 2=Veloce, 3=Potente, 4=Colpo di testa, 5=Imprevedibile, 6=Resiliente
  TransferListed: number | boolean;
  NationalTeamID: number;
  CountryID: number;
  Caps: number;
  CapsU20: number;
  Cards: number;
  InjuryLevel: number; // -1=cerotto, 0=sano, >0=settimane
  StaminaSkill: number; // 1-9
  KeeperSkill: number; // 1-20
  PlaymakerSkill: number; // 1-20
  ScorerSkill: number; // 1-20
  PassingSkill: number; // 1-20
  WingerSkill: number; // 1-20
  DefenderSkill: number; // 1-20
  SetPiecesSkill: number; // 1-20
  PlayerCategoryId?: number;
  OwnerNote?: string | null;
  UserID?: number;
  TeamID?: number;

  // Computed fields
  bestRole?: HtRoleRating;
  bestRating?: number;
  roleRatings?: HtRoleRating[];
}

export interface HtTeamDetails {
  TeamID: number;
  TeamName: string;
  ShortTeamName: string;
  IsPrimaryClub: number | boolean;
  FoundedDate: string;
  IsDeactivated: number | boolean;
  ArenaID: number;
  ArenaName: string;
  LeagueID: number;
  LeagueName: string;
  CountryID: number;
  CountryName: string;
  RegionID: number;
  RegionName: string;
  TrainerID: number;
  DressURI?: string;
  DressAlternateURI?: string;
  LeagueLevelUnitID?: number;
  LeagueLevelUnitName: string;
  LeagueLevel: number;
  IsBot: number | boolean;
  StillInCup: number | boolean;
  GlobalRanking: number;
  LeagueRanking: number;
  RegionRanking: number;
  PowerRating: number;
  FriendlyTeamID: number;
  NumberOfVictories: number;
  NumberOfUndefeated: number;
  TeamRank: number;
  FanclubID: number;
  FanclubName: string;
  FanclubSize: number;
  LogoURL?: string;
  YouthTeamID: number;
  YouthTeamName: string;
  NumberOfVisits: number;
  PossibleToChallengeMidweek: number | boolean;
  PossibleToChallengeWeekend: number | boolean;
  UserID: number;
}

export interface HtUser {
  user_id: number;
  loginname: string;
  name: string;
  icq?: string;
  language_id?: number;
  language_name?: string;
  has_supporter: number | boolean;
  signup_date?: string;
  activation_date?: string;
  last_login_date?: string;
  national_team_coach?: string;
}

export interface HtStats {
  team: HtTeamDetails;
  totalPlayers: number;
  totalTsi: number;
  avgTsi: number;
  totalSalary: number;
  avgAge: number;
  injuredCount: number;
  bruisedCount: number;
  transferListedCount: number;
  totalGoals: number;
  roleCounts: {
    GK: number;
    CD: number;
    WB: number;
    IM: number;
    W: number;
    FW: number;
  };
  topScorer: HtPlayer | null;
  topTsi: HtPlayer | null;
}

export interface HtBestXI {
  formation: string;
  lineup: {
    GK: Array<{ player: HtPlayer; roleRating: number }>;
    CD: Array<{ player: HtPlayer; roleRating: number }>;
    WB: Array<{ player: HtPlayer; roleRating: number }>;
    IM: Array<{ player: HtPlayer; roleRating: number }>;
    W: Array<{ player: HtPlayer; roleRating: number }>;
    FW: Array<{ player: HtPlayer; roleRating: number }>;
  };
  availablePlayers: number;
}


