export const BB_SKILL_NAMES: Record<string, { name: string; full: string; category: 'out' | 'in' | 'phys' }> = {
  js: { name: 'JS', full: 'Tiro in sospensione', category: 'out' },
  jr: { name: 'JR', full: 'Distanza di tiro', category: 'out' },
  od: { name: 'OD', full: 'Difesa perimetrale', category: 'out' },
  ha: { name: 'HA', full: 'Controllo palla', category: 'out' },
  dr: { name: 'DR', full: 'Penetrazione', category: 'out' },
  pa: { name: 'PA', full: 'Passaggio', category: 'out' },
  ish: { name: 'IS', full: 'Tiro da sotto', category: 'in' },
  ide: { name: 'ID', full: 'Difesa in area', category: 'in' },
  rb: { name: 'RB', full: 'Rimbalzo', category: 'in' },
  sb: { name: 'SB', full: 'Stoppata', category: 'in' },
  st: { name: 'ST', full: 'Resistenza', category: 'phys' },
  ft: { name: 'FT', full: 'Tiri liberi', category: 'phys' },
  ex: { name: 'EXP', full: 'Esperienza', category: 'phys' },
  gs: { name: 'GS', full: 'Forma partita', category: 'phys' },
};

export const BB_SKILL_LEVELS: Record<number, string> = {
  1: 'Atroce',
  2: 'Tremendo',
  3: 'Scarso',
  4: 'Debole',
  5: 'Insufficiente',
  6: 'Medio',
  7: 'Rispettabile',
  8: 'Forte',
  9: 'Valido',
  10: 'Eccellente',
  11: 'Formidabile',
  12: 'Straordinario',
  13: 'Splendido',
  14: 'Meraviglioso',
  15: 'Sensazionale',
  16: 'Prodigioso',
  17: 'Prodigioso+',
  18: 'All-Time',
  19: 'All-Time+',
  20: 'Leggendario',
};

export const BB_POTENTIAL_LEVELS: Record<number, string> = {
  1: 'Scaldabagno (1)',
  2: 'Non convocato (2)',
  3: 'Tifoso (3)',
  4: 'Panchinaro (4)',
  5: 'Sesto Uomo (5)',
  6: 'Titolare (6)',
  7: 'Stella (7)',
  8: 'All-Star (8)',
  9: 'Perenne All-Star (9)',
  10: 'Superstar (10)',
  11: 'MVP (11)',
  12: 'Hall of Famer (12)',
};

export function getSkillColor(level: number): string {
  if (level >= 15) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  if (level >= 12) return 'text-red-400 bg-red-500/10 border-red-500/30';
  if (level >= 9) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (level >= 7) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
  if (level >= 5) return 'text-zinc-300 bg-zinc-800 border-zinc-700';
  return 'text-zinc-500 bg-zinc-900 border-zinc-800';
}

export function getGameShapeStatus(minutes: number): {
  label: string;
  color: string;
  badgeClass: string;
  tip: string;
} {
  if (minutes >= 48 && minutes <= 75) {
    return {
      label: 'OTTIMO (48-75 min)',
      color: 'text-emerald-400',
      badgeClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-800',
      tip: 'Minuti perfetti per allenamento completo e mantenimento Forma 9 (Forte/Valido)'
    };
  }
  if (minutes < 48) {
    return {
      label: `INCOMPLETO (${minutes}/48 min)`,
      color: 'text-amber-400',
      badgeClass: 'bg-amber-950/40 text-amber-300 border-amber-800',
      tip: 'Mancano minuti per ricevere allenamento pieno (servono 48 min)'
    };
  }
  return {
    label: `SOVRACCARICO (${minutes} min)`,
    color: 'text-rose-400',
    badgeClass: 'bg-rose-950/40 text-rose-300 border-rose-800',
    tip: 'Attenzione: oltre 75 minuti settimanali la forma rischia di crollare per stanchezza!'
  };
}
