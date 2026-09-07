import React, { useState, useEffect, useMemo } from 'react';
import { AndaRecipeDetail, AndaIngredient } from '../../types';
import {
  ArrowLeft,
  Clock,
  Flame,
  ChefHat,
  Calculator,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Circle,
  Sparkles,
  Edit3,
  Trash2,
  Volume2,
  Info
} from 'lucide-react';

interface RecipeDetailViewProps {
  recipe: AndaRecipeDetail;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Audio chime generator using browser Web Audio API
function playTimerAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.85);
  } catch (e) {
    console.warn('AudioContext alert notification not available:', e);
  }
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({
  recipe,
  onBack,
  onEdit,
  onDelete,
}) => {
  // Multiplier state (defaults to 1.0)
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  // Timers state per procedure index
  const [timerSeconds, setTimerSeconds] = useState<Record<number, number>>({});
  const [timerRunning, setTimerRunning] = useState<Record<number, boolean>>({});

  // Initialize timers from procedure timer_minutes
  useEffect(() => {
    const initialTimers: Record<number, number> = {};
    recipe.procedures.forEach((proc, idx) => {
      if (proc.timer_minutes && proc.timer_minutes > 0) {
        initialTimers[idx] = proc.timer_minutes * 60;
      }
    });
    setTimerSeconds(initialTimers);
  }, [recipe.procedures]);

  // Timer interval hook
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        let changed = false;
        const next = { ...prev };

        Object.keys(timerRunning).forEach((key) => {
          const idx = Number(key);
          if (timerRunning[idx] && next[idx] > 0) {
            next[idx] -= 1;
            changed = true;
            if (next[idx] === 0) {
              // Timer reached zero!
              playTimerAlertSound();
              setTimerRunning((r) => ({ ...r, [idx]: false }));
            }
          }
        });

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  const toggleTimer = (idx: number) => {
    setTimerRunning((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const resetTimer = (idx: number, originalMinutes: number) => {
    setTimerRunning((prev) => ({ ...prev, [idx]: false }));
    setTimerSeconds((prev) => ({ ...prev, [idx]: originalMinutes * 60 }));
  };

  const toggleIngredientCheck = (id: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Scaled ingredients calculation
  const scaledIngredients = useMemo(() => {
    return recipe.ingredients.map((ing, idx) => {
      const rawQty = (ing.quantity || '').trim().replace(',', '.');
      const numVal = parseFloat(rawQty);

      if (!isNaN(numVal) && isFinite(numVal)) {
        const scaled = Math.round(numVal * multiplier * 100) / 100;
        const display = scaled % 1 === 0 ? String(scaled) : String(scaled.toFixed(1));
        return {
          ...ing,
          scaled_quantity: display,
          isNumeric: true,
          internalId: ing.id || idx,
        };
      }

      return {
        ...ing,
        scaled_quantity: ing.quantity,
        isNumeric: false,
        internalId: ing.id || idx,
      };
    });
  }, [recipe.ingredients, multiplier]);

  // Group ingredients by Phase
  const ingredientsByPhase = useMemo(() => {
    const map = new Map<number, typeof scaledIngredients>();
    scaledIngredients.forEach((ing) => {
      const p = ing.phase || 1;
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(ing);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [scaledIngredients]);

  // Group procedures by Phase
  const proceduresByPhase = useMemo(() => {
    const map = new Map<number, typeof recipe.procedures>();
    recipe.procedures.forEach((proc) => {
      const p = proc.phase || 1;
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(proc);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [recipe.procedures]);

  const formatTimerDisplay = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tutte le ricette</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white transition-all text-xs font-mono"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modifica</span>
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/80 text-red-300 hover:text-red-100 transition-all text-xs font-mono"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Elimina</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl">
        <div className="relative h-64 md:h-72 w-full bg-zinc-950 overflow-hidden">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-amber-500/40">
              <ChefHat className="w-20 h-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

          {/* Hero text overlay */}
          <div className="absolute bottom-5 left-5 right-5 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-amber-500/90 text-zinc-950 font-bold font-mono text-xs">
                {recipe.category_name || recipe.category || 'Ricetta'}
              </span>
              {recipe.difficulty && (
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-700 text-zinc-200 font-mono text-xs">
                  Difficoltà: {recipe.difficulty}
                </span>
              )}
              {Boolean(recipe.is_parametric) && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs">
                  <Calculator className="w-3 h-3 text-emerald-400" />
                  <span>Dosi Parametriche</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {recipe.name}
            </h1>

            {recipe.description && (
              <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
                {recipe.description}
              </p>
            )}

            {/* Quick Meta */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-zinc-400">
              {recipe.prep_time !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Preparazione: <strong className="text-white">{recipe.prep_time} min</strong></span>
                </span>
              )}
              {recipe.cook_time !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-400" />
                  <span>Cottura: <strong className="text-white">{recipe.cook_time} min</strong></span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PARAMETRIC CALCULATOR CARD */}
      {Boolean(recipe.is_parametric) && (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Calculator className="w-4 h-4" />
                <span>{recipe.calculator_name || 'Calcolatore Dosi Parametrico'}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Seleziona un preset o adatta il moltiplicatore per ricalcolare automaticamente tutte le dosi degli ingredienti.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 p-1.5 rounded-2xl font-mono">
              <button
                onClick={() => setMultiplier((m) => Math.max(0.25, Math.round((m - 0.25) * 100) / 100))}
                className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center transition-colors"
                title="Riduci moltiplicatore"
              >
                -
              </button>
              <div className="px-3 text-center">
                <div className="text-sm font-black text-amber-400">{multiplier}x</div>
                <div className="text-[10px] text-zinc-500">Moltiplicatore</div>
              </div>
              <button
                onClick={() => setMultiplier((m) => Math.round((m + 0.25) * 100) / 100)}
                className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center transition-colors"
                title="Aumenta moltiplicatore"
              >
                +
              </button>
              {multiplier !== 1.0 && (
                <button
                  onClick={() => setMultiplier(1.0)}
                  className="px-2.5 py-1 text-[11px] rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  title="Resetta a standard 1.0x"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Predefined Quantities Presets */}
          {recipe.predefined_quantities && recipe.predefined_quantities.length > 0 && (
            <div>
              <span className="text-[11px] font-mono text-zinc-400 block mb-2">Preset rapidi consigliati:</span>
              <div className="flex flex-wrap gap-2 font-mono">
                {recipe.predefined_quantities.map((pred, i) => {
                  const isSelected = Math.abs(multiplier - pred.multiplier) < 0.01;
                  return (
                    <button
                      key={pred.id || i}
                      onClick={() => setMultiplier(pred.multiplier)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-bold'
                          : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <span>{pred.quantity_name}</span>
                      <span className="ml-1.5 opacity-70 text-[10px]">({pred.multiplier}x)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TWO COLUMNS: INGREDIENTS & PROCEDURES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INGREDIENTS (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <ChefHat className="w-5 h-5 text-amber-400" />
                <span>Ingredienti</span>
              </h2>
              {multiplier !== 1.0 && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-mono font-bold">
                  Scalati {multiplier}x
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400 font-mono">
              Tocca un ingrediente per spuntarlo durante la pesata e la preparazione:
            </p>

            <div className="space-y-5">
              {ingredientsByPhase.map(([phase, ings]) => (
                <div key={phase} className="space-y-2">
                  <div className="text-[11px] font-mono font-bold text-amber-400/90 uppercase tracking-wider bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800/80 inline-block">
                    Fase {phase}
                  </div>

                  <div className="space-y-1.5">
                    {ings.map((ing) => {
                      const isChecked = Boolean(checkedIngredients[ing.internalId]);
                      return (
                        <div
                          key={ing.internalId}
                          onClick={() => toggleIngredientCheck(ing.internalId)}
                          className={`flex items-start justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-zinc-950/40 border-zinc-800/50 text-zinc-500 line-through'
                              : 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 text-zinc-200'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              className="mt-0.5 text-zinc-400 hover:text-amber-400 transition-colors"
                            >
                              {isChecked ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Circle className="w-4 h-4 text-zinc-600" />
                              )}
                            </button>
                            <div>
                              <div className={`text-xs font-medium ${isChecked ? 'text-zinc-500' : 'text-zinc-200'}`}>
                                {ing.name}
                              </div>
                              {ing.notes && (
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{ing.notes}</div>
                              )}
                            </div>
                          </div>

                          <div className="text-right font-mono text-xs pl-2 whitespace-nowrap">
                            <span className={`font-bold ${multiplier !== 1.0 ? 'text-amber-400' : 'text-white'}`}>
                              {ing.scaled_quantity}
                            </span>
                            <span className="text-zinc-400 ml-1">{ing.unit}</span>
                            {multiplier !== 1.0 && ing.isNumeric && (
                              <div className="text-[9px] text-zinc-600">orig. {ing.quantity} {ing.unit}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PROCEDURES & TIMERS (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Procedimento &amp; Timer di Cottura</span>
              </h2>
              <span className="text-xs font-mono text-zinc-500">
                {recipe.procedures.length} passaggi
              </span>
            </div>

            <div className="space-y-6">
              {proceduresByPhase.map(([phase, procs]) => (
                <div key={phase} className="space-y-4">
                  <div className="text-xs font-mono font-bold text-amber-400/90 uppercase tracking-wider bg-zinc-950/80 px-3 py-1 rounded-lg border border-zinc-800/80 inline-block">
                    Fase {phase}: Preparazione &amp; Lavorazione
                  </div>

                  <div className="space-y-3">
                    {procs.map((proc, idx) => {
                      const hasTimer = proc.timer_minutes && proc.timer_minutes > 0;
                      const remaining = timerSeconds[idx] ?? (proc.timer_minutes ? proc.timer_minutes * 60 : 0);
                      const isRunning = Boolean(timerRunning[idx]);
                      const isDone = hasTimer && remaining === 0;

                      return (
                        <div
                          key={proc.id || idx}
                          className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-mono text-xs shrink-0 mt-0.5">
                              {proc.step_number || idx + 1}
                            </div>
                            <div className="flex-1 space-y-2">
                              <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                                {proc.description}
                              </p>

                              {/* Interactive Step Timer */}
                              {hasTimer && (
                                <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                                  isDone
                                    ? 'bg-emerald-950/40 border-emerald-500/60 animate-pulse'
                                    : isRunning
                                    ? 'bg-amber-950/30 border-amber-500/50'
                                    : 'bg-zinc-900 border-zinc-800'
                                }`}>
                                  <div className="flex items-center gap-2 font-mono">
                                    <Clock className={`w-4 h-4 ${isRunning ? 'text-amber-400 animate-spin' : isDone ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                    <div>
                                      <div className={`text-base font-black ${isDone ? 'text-emerald-400' : isRunning ? 'text-amber-400' : 'text-white'}`}>
                                        {formatTimerDisplay(remaining)}
                                      </div>
                                      <div className="text-[10px] text-zinc-500">
                                        Durata prevista: {proc.timer_minutes} min
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 font-mono text-xs">
                                    <button
                                      onClick={() => toggleTimer(idx)}
                                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all shadow ${
                                        isRunning
                                          ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                                      }`}
                                    >
                                      {isRunning ? (
                                        <>
                                          <Pause className="w-3.5 h-3.5" />
                                          <span>Pausa</span>
                                        </>
                                      ) : (
                                        <>
                                          <Play className="w-3.5 h-3.5" />
                                          <span>{remaining === 0 ? 'Ripeti' : 'Avvia'}</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      onClick={() => resetTimer(idx, proc.timer_minutes || 0)}
                                      className="p-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
                                      title="Resetta timer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
