import React, { useState, useEffect } from 'react';
import { X, Check, CircleDot, AlertCircle } from 'lucide-react';
import { Evento } from '../types';

interface EventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Evento>) => Promise<void>;
  initialData?: Evento | null;
  defaultNumero?: number;
}

export const EventoModal: React.FC<EventoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultNumero = 1,
}) => {
  const [numero, setNumero] = useState(defaultNumero);
  const [titolo, setTitolo] = useState('');
  const [quota, setQuota] = useState(1.80);
  const [puntata, setPuntata] = useState(0);
  const [esito, setEsito] = useState('ATTESA');
  const [timestamp, setTimestamp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNumero(initialData.numero);
      setTitolo(initialData.titolo || '');
      setQuota(initialData.quota);
      setPuntata(initialData.puntata);
      setEsito(initialData.esito);
      setTimestamp(initialData.timestamp ? initialData.timestamp.slice(0, 16) : '');
    } else {
      setNumero(defaultNumero);
      setTitolo(`Evento #${defaultNumero}`);
      setQuota(1.80);
      setPuntata(0);
      setEsito('ATTESA');
      setTimestamp(new Date().toISOString().slice(0, 16));
    }
    setError(null);
  }, [initialData, defaultNumero, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quota <= 1.0) {
      setError('La quota deve essere maggiore di 1.00');
      return;
    }
    if (puntata < 0) {
      setError('La puntata non può essere negativa');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        numero: Number(numero),
        titolo: titolo.trim() || `Evento #${numero}`,
        quota: Number(quota),
        puntata: Number(puntata),
        esito,
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Errore nel salvataggio dell'evento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-900/30 border border-red-500/40 text-red-500">
              <CircleDot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isEditing ? `Modifica Step #${numero}` : `Aggiungi Evento #${numero}`}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">Dettagli pronostico e puntata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Numero & Titolo */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-zinc-300 mb-1 font-mono">Step #</label>
              <input
                type="number"
                min="1"
                value={numero}
                onChange={(e) => setNumero(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-mono text-center focus:outline-none focus:border-red-500 transition-colors"
                required
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-zinc-300 mb-1 font-mono">
                Pronostico / Partita
              </label>
              <input
                type="text"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder="es. Inter - Arsenal (Over 2.5)"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Quota & Puntata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 font-mono">Quota</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={quota}
                onChange={(e) => setQuota(parseFloat(e.target.value) || 1.80)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-red-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 font-mono">Puntata (€)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={puntata}
                onChange={(e) => setPuntata(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-red-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Calcolo Anteprima Ritorno */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-mono flex items-center justify-between text-zinc-400">
            <span>Potenziale Ritorno Lordo:</span>
            <span className="font-mono font-bold text-white">€{(quota * puntata).toFixed(2)}</span>
          </div>

          {/* Esito & Data/Ora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 font-mono">Esito</label>
              <select
                value={esito}
                onChange={(e) => setEsito(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
              >
                <option value="ATTESA">ATTESA</option>
                <option value="IN CORSO">IN CORSO</option>
                <option value="VINTO">VINTO</option>
                <option value="PERSO">PERSO</option>
                <option value="NON GIOCATO">NON GIOCATO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 font-mono">Data / Ora</label>
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-semibold shadow-md shadow-red-950/40 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Salvataggio...' : isEditing ? 'Aggiorna Evento' : 'Aggiungi Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
