import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  RotateCcw,
  Calculator,
  Check,
  X,
  Clock,
  CircleDot,
  Edit2,
  Trash2,
  Sparkles,
  TrendingUp,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
import { MasaStats, Evento, MasanielloCalculation } from '../types';
import { api } from '../services/api';

interface MasaDetailProps {
  masa: MasaStats;
  onBack: () => void;
  onRefreshMasa: () => Promise<void>;
  onEditMasa: (masa: MasaStats) => void;
  onOpenAddEvento: (masaId: number, nextNumber: number) => void;
  onOpenEditEvento: (evento: Evento) => void;
  isAdmin: boolean;
}

export const MasaDetail: React.FC<MasaDetailProps> = ({
  masa,
  onBack,
  onRefreshMasa,
  onEditMasa,
  onOpenAddEvento,
  onOpenEditEvento,
  isAdmin,
}) => {
  const [calcQuota, setCalcQuota] = useState<number>(1.80);
  const [calculation, setCalculation] = useState<MasanielloCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calcolo matematico al volo
  const handleCalculate = async () => {
    try {
      setIsCalculating(true);
      setErrorMessage(null);
      const res = await api.calculateNextStake(masa.id, calcQuota);
      setCalculation(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore nel calcolo');
    } finally {
      setIsCalculating(false);
    }
  };

  // Cambio esito rapido per un evento
  const handleQuickEsito = async (evento: Evento, newEsito: string) => {
    try {
      setIsUpdatingEvent(evento.id);
      setErrorMessage(null);

      // Se impostiamo VINTO o PERSO e la puntata era 0, proviamo a calcolare una puntata consigliata o mantenere la presente
      let stakeToUse = evento.puntata;
      if ((newEsito === 'VINTO' || newEsito === 'PERSO') && stakeToUse <= 0) {
        // Se non c'era puntata, calcoliamone una rapida
        const calcRes = await api.calculateNextStake(masa.id, evento.quota || 1.80);
        stakeToUse = calcRes.puntata;
      }

      await api.updateEvento(evento.id, {
        esito: newEsito,
        puntata: stakeToUse,
        recalcNext: true,
      });

      await onRefreshMasa();
    } catch (err: any) {
      setErrorMessage(err.message || "Errore nell'aggiornamento dell'evento");
    } finally {
      setIsUpdatingEvent(null);
    }
  };

  // Assegna la puntata calcolata al primo evento in corso o in attesa
  const handleApplyCalculatedStake = async () => {
    if (!calculation || calculation.puntata <= 0) return;
    const targetEvent =
      masa.eventi.find((e) => e.esito === 'IN CORSO') ||
      masa.eventi.find((e) => e.esito === 'ATTESA');

    if (!targetEvent) {
      setErrorMessage('Nessun evento in attesa trovato a cui applicare la puntata.');
      return;
    }

    try {
      setIsUpdatingEvent(targetEvent.id);
      await api.updateEvento(targetEvent.id, {
        puntata: calculation.puntata,
        quota: calculation.quota,
        esito: 'IN CORSO',
      });
      await onRefreshMasa();
      setCalculation(null);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsUpdatingEvent(null);
    }
  };

  // Eliminazione evento
  const handleDeleteEvento = async (eventoId: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo evento dal Masaniello?')) return;
    try {
      await api.deleteEvento(eventoId);
      await onRefreshMasa();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Reset del Masa
  const handleReset = async () => {
    if (!confirm('Attenzione: confermi di voler azzerare tutti gli esiti di questo Masaniello e ripartire dal primo evento?')) return;
    try {
      await api.resetMasa(masa.id);
      await onRefreshMasa();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const isVinto = masa.stato === 'VINTO';
  const isPerso = masa.stato === 'PERSO';

  return (
    <div className="space-y-6">
      {/* Top navigation & title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800"
            title="Torna alla lista Masaniello"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{masa.nome}</h2>
              {isVinto && (
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  TARGET RAGGIUNTO
                </span>
              )}
              {isPerso && (
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                  STOP LOSS
                </span>
              )}
              {!isVinto && !isPerso && (
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                  IN CORSO
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              PLAN ID #{masa.id} &bull; TARGET: <strong>{masa.eventi_attesi} VINCENTI</strong> SU{' '}
              <strong>{masa.n_eventi} STEP TOTALI</strong>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditMasa(masa)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono border border-zinc-800 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> Modifica
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 text-xs font-mono border border-zinc-800 transition-colors"
            title="Azzera esiti"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={() => onOpenAddEvento(masa.id, (masa.eventi?.length || 0) + 1)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-medium shadow-md shadow-red-950/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nuovo Step
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bento Progress and Financial Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {/* Cassa Attuale */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1 flex items-center justify-between">
            <span>Cassa Attuale</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">€{masa.cassaAttuale.toFixed(2)}</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 pt-2 border-t border-zinc-800/80">
            Stanziati: <span className="text-zinc-300">€{masa.capitale.toFixed(2)}</span>
          </div>
        </div>

        {/* Utile Netto */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1 flex items-center justify-between">
            <span>Resa Netta</span>
            <TrendingUp className={`w-3.5 h-3.5 ${masa.utileNetto >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              masa.utileNetto >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {masa.utileNetto >= 0 ? `+€${masa.utileNetto.toFixed(2)}` : `-€${Math.abs(masa.utileNetto).toFixed(2)}`}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 pt-2 border-t border-zinc-800/80">
            ROI: <span className={masa.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}>{masa.roi >= 0 ? `+${masa.roi}%` : `${masa.roi}%`}</span>
          </div>
        </div>

        {/* Eventi Vincenti */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1 flex items-center justify-between">
            <span>Step Vinti</span>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {masa.vinti} <span className="text-xs text-zinc-500 font-normal">/ {masa.eventi_attesi}</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 pt-2 border-t border-zinc-800/80">
            {masa.kMancanti === 0 ? 'Target raggiunto' : `Residui: ${masa.kMancanti} V`}
          </div>
        </div>

        {/* Eventi Persi ed Errori consentiti */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1 flex items-center justify-between">
            <span>Errori Tollerati</span>
            <X className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {masa.persi} <span className="text-xs text-zinc-500 font-normal">/ {masa.erroriMax} max</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 pt-2 border-t border-zinc-800/80">
            {masa.erroriRimasti > 0 ? `${masa.erroriRimasti} margine residuo` : 'Nessun errore residuo'}
          </div>
        </div>

        {/* Eventi Rimanenti */}
        <div className="col-span-2 md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1 flex items-center justify-between">
            <span>Da Giocare</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-200">
            {masa.nRimasti} <span className="text-xs text-zinc-500 font-normal">/ {masa.n_eventi}</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 pt-2 border-t border-zinc-800/80">
            {masa.inCorso} live &bull; {masa.inAttesa} attesa
          </div>
        </div>
      </div>

      {/* Interactive Masaniello Stake Calculator Widget (Bento Module) */}
      {!isVinto && !isPerso && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-red-500" />
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                  Calcolatore Combinatorio Masaniello &bull; Prossima Puntata
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Calcola la puntata matematica ottimale ponderata sul capitale residuo e gli eventi mancanti.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500 font-mono uppercase">Quota:</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={calcQuota}
                  onChange={(e) => setCalcQuota(parseFloat(e.target.value) || 1.80)}
                  className="w-20 bg-transparent text-sm font-mono font-bold text-amber-300 focus:outline-none"
                />
              </div>

              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isCalculating ? 'Calcolo...' : 'Calcola Puntata'}
              </button>
            </div>
          </div>

          {/* Results display in Bento inset tiles */}
          {calculation && (
            <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center font-mono">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] uppercase text-zinc-500 tracking-wider">Puntata Ottimale</div>
                <div className="text-2xl font-bold text-emerald-400">
                  €{calculation.puntata.toFixed(2)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Quota base: <strong className="text-amber-300">{calculation.quota.toFixed(2)}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] uppercase text-zinc-500 tracking-wider">Ritorno Lordo Potenziale</div>
                <div className="text-2xl font-bold text-white">
                  €{(calculation.puntata * calculation.quota).toFixed(2)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Guadagno netto: +€{((calculation.puntata * calculation.quota) - calculation.puntata).toFixed(2)}
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <button
                  onClick={handleApplyCalculatedStake}
                  disabled={isUpdatingEvent !== null || calculation.puntata <= 0}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-xs shadow transition-all active:scale-95 disabled:opacity-50"
                >
                  Assegna al Prossimo Step
                </button>
                <span className="text-[10px] text-zinc-500 text-center mt-1">
                  Imposta puntata e quota nell&apos;evento in attesa
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Events Table Container (Data Explorer format from Bento Grid template) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-red-500" />
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider font-mono">
              DATA EXPLORER: MASANIELLO STEPS &amp; EVENTS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
              {masa.eventi?.length || 0} record memorizzati in SQLite
            </span>
            <button
              onClick={() => onOpenAddEvento(masa.id, (masa.eventi?.length || 0) + 1)}
              className="text-xs font-mono bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-red-400" /> Aggiungi Step
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3 border-b border-zinc-800 w-12 text-center">ID</th>
                <th className="px-5 py-3 border-b border-zinc-800 font-sans">Pronostico / Match</th>
                <th className="px-5 py-3 border-b border-zinc-800 w-24 text-right">Quota</th>
                <th className="px-5 py-3 border-b border-zinc-800 w-28 text-right">Puntata</th>
                <th className="px-5 py-3 border-b border-zinc-800 w-28 text-right">Ritorno</th>
                <th className="px-5 py-3 border-b border-zinc-800 w-64 text-center">Esito / Aggiorna</th>
                <th className="px-5 py-3 border-b border-zinc-800 w-24 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {masa.eventi && masa.eventi.length > 0 ? (
                masa.eventi.map((evento) => {
                  const isEventoVinto = evento.esito === 'VINTO';
                  const isEventoPerso = evento.esito === 'PERSO';
                  const isEventoInCorso = evento.esito === 'IN CORSO';
                  const ritorno = evento.puntata * evento.quota;
                  const utileNettoEvento = ritorno - evento.puntata;
                  const isBusy = isUpdatingEvent === evento.id;

                  return (
                    <tr
                      key={evento.id}
                      className={`border-b border-zinc-800 hover:bg-white/5 transition-colors ${
                        isEventoVinto
                          ? 'bg-emerald-950/10'
                          : isEventoPerso
                          ? 'bg-red-950/10'
                          : isEventoInCorso
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* Step Number */}
                      <td className="px-5 py-3.5 text-center text-zinc-400 font-bold">
                        #{evento.numero}
                      </td>

                      {/* Title */}
                      <td className="px-5 py-3.5 font-sans">
                        <div className="font-semibold text-white">
                          {evento.titolo || `Evento #${evento.numero}`}
                        </div>
                        {evento.timestamp && (
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {new Date(evento.timestamp).toLocaleString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </td>

                      {/* Quota */}
                      <td className="px-5 py-3.5 text-right font-bold text-amber-300">
                        {evento.quota.toFixed(2)}
                      </td>

                      {/* Puntata */}
                      <td className="px-5 py-3.5 text-right font-bold text-zinc-100">
                        €{evento.puntata.toFixed(2)}
                      </td>

                      {/* Potenziale Ritorno */}
                      <td className="px-5 py-3.5 text-right">
                        {evento.puntata > 0 ? (
                          <>
                            <div className="text-zinc-200">€{ritorno.toFixed(2)}</div>
                            <div
                              className={`text-[10px] ${
                                isEventoVinto
                                  ? 'text-emerald-400'
                                  : isEventoPerso
                                  ? 'text-red-400'
                                  : 'text-zinc-500'
                              }`}
                            >
                              {isEventoPerso ? `-€${evento.puntata.toFixed(2)}` : `+€${utileNettoEvento.toFixed(2)}`}
                            </div>
                          </>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>

                      {/* Quick Esito Action Buttons */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* VINTO */}
                          <button
                            onClick={() => handleQuickEsito(evento, 'VINTO')}
                            disabled={isBusy}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                              isEventoVinto
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-zinc-950 text-zinc-400 hover:bg-emerald-950/60 hover:text-emerald-300 border border-zinc-800'
                            }`}
                            title="Segna come Vinto (re-calcola step successivo)"
                          >
                            <Check className="w-3 h-3" />
                            <span>OK</span>
                          </button>

                          {/* PERSO */}
                          <button
                            onClick={() => handleQuickEsito(evento, 'PERSO')}
                            disabled={isBusy}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                              isEventoPerso
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-zinc-950 text-zinc-400 hover:bg-red-950/60 hover:text-red-300 border border-zinc-800'
                            }`}
                            title="Segna come Perso (re-calcola step successivo)"
                          >
                            <X className="w-3 h-3" />
                            <span>KO</span>
                          </button>

                          {/* IN CORSO */}
                          <button
                            onClick={() => handleQuickEsito(evento, 'IN CORSO')}
                            disabled={isBusy}
                            className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                              isEventoInCorso
                                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                                : 'bg-zinc-950 text-zinc-500 hover:bg-zinc-800 border border-zinc-800'
                            }`}
                            title="In corso di svolgimento"
                          >
                            LIVE
                          </button>

                          {/* ATTESA */}
                          <button
                            onClick={() => handleQuickEsito(evento, 'ATTESA')}
                            disabled={isBusy}
                            className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                              evento.esito === 'ATTESA'
                                ? 'bg-zinc-800 text-white font-semibold'
                                : 'bg-zinc-950 text-zinc-500 hover:bg-zinc-800 border border-zinc-800'
                            }`}
                            title="In attesa"
                          >
                            ATT
                          </button>
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenEditEvento(evento)}
                            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors"
                            title="Modifica quote o dettagli evento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvento(evento.id)}
                            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Elimina evento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-zinc-500">
                    Nessun evento registrato per questo Masaniello. Clicca &quot;Nuovo Step&quot; per iniziare.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
          <span>{masa.eventi?.length || 0} eventi registrati nel piano #{masa.id}</span>
          <div className="flex gap-2">
            <span className="text-emerald-400">{masa.vinti} VINTE</span>
            <span>&bull;</span>
            <span className="text-red-400">{masa.persi} PERSE</span>
            <span>&bull;</span>
            <span className="text-zinc-400">{masa.nRimasti} RIMANENTI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
