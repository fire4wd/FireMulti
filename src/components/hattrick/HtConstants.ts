// Hattrick Official Skill Names, Denominations and Helpers

export const HT_SKILLS = [
  { key: 'KeeperSkill', label: 'Parate', short: 'PAR', color: 'amber' },
  { key: 'DefenderSkill', label: 'Difesa', short: 'DIF', color: 'blue' },
  { key: 'PlaymakerSkill', label: 'Regia', short: 'REG', color: 'emerald' },
  { key: 'WingerSkill', label: 'Cross', short: 'CRO', color: 'cyan' },
  { key: 'PassingSkill', label: 'Passaggi', short: 'PAS', color: 'indigo' },
  { key: 'ScorerSkill', label: 'Attacco', short: 'ATT', color: 'red' },
  { key: 'SetPiecesSkill', label: 'Calci Piazzati', short: 'CP', color: 'purple' },
  { key: 'StaminaSkill', label: 'Resistenza', short: 'RES', color: 'teal' },
] as const;

export const HT_DENOMINATIONS: Record<number, string> = {
  1: 'Disastroso (1)',
  2: 'Tremendo (2)',
  3: 'Scarso (3)',
  4: 'Debole (4)',
  5: 'Insufficiente (5)',
  6: 'Accettabile (6)',
  7: 'Buono (7)',
  8: 'Eccellente (8)',
  9: 'Formidabile (9)',
  10: 'Straordinario (10)',
  11: 'Splendido (11)',
  12: 'Magnifico (12)',
  13: 'Fuoriclasse (13)',
  14: 'Sovrannaturale (14)',
  15: 'Titanico (15)',
  16: 'Extraterrestre (16)',
  17: 'Mitico (17)',
  18: 'Magico (18)',
  19: 'Utopico (19)',
  20: 'Divino (20)',
};

export const HT_SPECIALTIES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Nessuna', icon: '—' },
  1: { label: 'Tecnico', icon: '🎯' },
  2: { label: 'Veloce', icon: '⚡' },
  3: { label: 'Potente', icon: '💪' },
  4: { label: 'Colpo di testa', icon: '👤' },
  5: { label: 'Imprevedibile', icon: '🎲' },
  6: { label: 'Resiliente', icon: '🛡️' },
};

export const HT_FORM_LEVELS: Record<number, string> = {
  1: 'Disastroso (1)',
  2: 'Tremendo (2)',
  3: 'Scarso (3)',
  4: 'Debole (4)',
  5: 'Insufficiente (5)',
  6: 'Accettabile (6)',
  7: 'Buono (7)',
  8: 'Eccellente (8)',
};

export const HT_LEADERSHIP: Record<number, string> = {
  1: 'Disastroso',
  2: 'Tremendo',
  3: 'Scarso',
  4: 'Debole',
  5: 'Insufficiente',
  6: 'Accettabile',
  7: 'Buono',
  8: 'Eccellente',
};

export const HT_AGREEABILITY: Record<number, string> = {
  1: 'Antipatico',
  2: 'Scontroso',
  3: 'Gradevole',
  4: 'Simpatico',
  5: 'Amatissimo da tutti',
};

export const HT_AGGRESSIVENESS: Record<number, string> = {
  1: 'Tranquillo',
  2: 'Calmo',
  3: 'Equilibrato',
  4: 'Irascibile',
  5: 'Incendiario',
};

export const HT_HONESTY: Record<number, string> = {
  1: 'Disonesto',
  2: 'Infame',
  3: 'Onesto',
  4: 'Retto',
  5: 'Integerrimo',
};

export const HT_ROLES: Record<string, { label: string; badgeColor: string }> = {
  GK: { label: 'Portiere', badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-500/30' },
  CD: { label: 'Difensore Centrale', badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-500/30' },
  WB: { label: 'Terzino', badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30' },
  IM: { label: 'Centrocampista', badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' },
  W: { label: 'Ala', badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30' },
  FW: { label: 'Attaccante', badgeColor: 'bg-red-950/80 text-red-300 border-red-500/30' },
};

export function getSkillBadgeClass(val: number): string {
  if (val >= 15) return 'text-amber-400 bg-amber-500/10 border-amber-500/40 font-bold';
  if (val >= 11) return 'text-red-400 bg-red-500/10 border-red-500/30 font-semibold';
  if (val >= 8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 font-semibold';
  if (val >= 6) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  if (val >= 4) return 'text-zinc-300 bg-zinc-800/80 border-zinc-700/50';
  return 'text-zinc-500 bg-zinc-900 border-zinc-800';
}
