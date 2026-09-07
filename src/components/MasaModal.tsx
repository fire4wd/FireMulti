import React, { useState, useEffect } from 'react';
import { X, Layers, AlertCircle, Check } from 'lucide-react';
import { Masa, MasaStats } from '../types';

interface MasaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: MasaStats | null;
}

export const MasaModal: React.FC<MasaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [nome, setNome] = useState('');
  const [nEventi, setNEventi] = useState(6);
  const [eventiAttesi, setEventiAttesi] = useState(4);
  const [capitale, setCapitale] = useState(100);
  const [defaultQuota, setDefaultQuota] = useState(1.80);
  const [masa1, setMasa1] = useState(0);
  const [masa2, setMasa2] = useState(0);
  const [attivo, setAttivo] = useState(1);
  const [autoGenerateSteps, setAutoGenerateSteps] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNome(initialData.nome);
      setNEventi(initialData.n_eventi);
      setEventiAttesi(initialData.eventi_attesi);
      setCapitale(initialData.capitale);
      setMasa1(initialData.masa1 || 0);
      setMasa2(initialData.masa2 || 0);
      setAttivo(initialData.attivo);
      setAutoGenerateSteps(false);
    } else {
      setNome('');
      setNEventi(6);
      setEventiAttesi(4);
      setCapitale(100);
      setDefaultQuota(1.80);
      setMasa1(0);
      setMasa2(0);
      setAttivo(1);
      setAutoGenerateSteps(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('Inserisci un nome descrittivo per il Masaniello');
      return;
    }
    if (nEventi <= 0) {
      setError('Il numero di eventi totali deve essere maggiore di 0');
      return;
    }
    if (eventiAttesi <= 0 || eventiAttesi > nEventi) {
      setError('Gli eventi attesi devono essere compresi tra 1 e il totale eventi');
      return;
    }
    if (capitale <= 0) {
      setError('Il capitale iniziale deve essere positivo');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        nome: nome.trim(),
        n_eventi: Number(nEventi),
        eventi_attesi: Number(eventiAttesi),
        capitale: Number(capitale),
        masa1: Number(masa1),
        masa2: Number(masa2),
        attivo: Number(attivo),
        autoGenerateSteps,
        defaultQuota: Number(defaultQuota),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore nel salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!initialData;
  const erroriConsentiti = Math.max(0, nEventi - eventiAttesi);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-900/30 border border-red-500/40 text-red-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isEditing ? 'Modifica Masaniello' : 'Nuovo Masaniello'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">Configurazione piano matematico e budget</p>
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

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nome / Descrizione Masa
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="es. Champions League 4/6, Quota 1.90"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
              required
            />
          </div>

          {/* Eventi Totali & Attesi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Eventi Totali (N)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={nEventi}
                onChange={(e) => setNEventi(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Eventi Vincenti Attesi (K)
              </label>
              <input
                type="number"
                min="1"
                max={nEventi}
                value={eventiAttesi}
                onChange={(e) => setEventiAttesi(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Info pill on errors permitted */}
          <div className="text-[11px] px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-400 font-mono flex items-center justify-between">
            <span>Tolleranza massima errori:</span>
            <span className="font-semibold text-amber-400 font-mono">
              {erroriConsentiti} {erroriConsentiti === 1 ? 'errore consentito' : 'errori consentiti'}
            </span>
          </div>

          {/* Capitale Iniziale & Quota Default */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Capitale Stanziato (€)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={capitale}
                onChange={(e) => setCapitale(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
                required
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Quota Media Indicativa
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="1.05"
                  value={defaultQuota}
                  onChange={(e) => setDefaultQuota(parseFloat(e.target.value) || 1.80)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-mono focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Advanced fields: masa1, masa2, attivo */}
          <div className="pt-2 border-t border-zinc-800">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1 font-mono">Masa Param 1</label>
                <input
                  type="number"
                  value={masa1}
                  onChange={(e) => setMasa1(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1 font-mono">Masa Param 2</label>
                <input
                  type="number"
                  value={masa2}
                  onChange={(e) => setMasa2(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1 font-mono">Stato</label>
                <select
                  value={attivo}
                  onChange={(e) => setAttivo(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
                >
                  <option value={1}>Attivo</option>
                  <option value={0}>Archiviato</option>
                </select>
              </div>
            </div>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoGenerate"
                checked={autoGenerateSteps}
                onChange={(e) => setAutoGenerateSteps(e.target.checked)}
                className="rounded bg-zinc-950 border-zinc-800 text-red-600 focus:ring-0 w-4 h-4"
              />
              <label htmlFor="autoGenerate" className="text-xs text-zinc-300 select-none">
                Pre-genera automaticamente la tabella con tutti gli {nEventi} eventi
              </label>
            </div>
          )}

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
              {isSubmitting ? 'Salvataggio...' : isEditing ? 'Aggiorna' : 'Crea Masaniello'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
