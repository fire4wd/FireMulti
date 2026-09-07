import React, { useState, useEffect } from 'react';
import { AndaCategory, AndaRecipeDetail } from '../../types';
import { X, Plus, Trash2, ChefHat, Calculator, Clock, Flame, Sparkles } from 'lucide-react';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  categories: AndaCategory[];
  editingRecipe?: AndaRecipeDetail | null;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  editingRecipe,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [prepTime, setPrepTime] = useState<number>(30);
  const [cookTime, setCookTime] = useState<number>(15);
  const [difficulty, setDifficulty] = useState<string>('Media');
  const [isParametric, setIsParametric] = useState<boolean>(true);
  const [calculatorName, setCalculatorName] = useState<string>('Calcolatore Dosi');

  // Repeaters
  const [ingredients, setIngredients] = useState<Array<{
    phase: number;
    name: string;
    quantity: string;
    unit: string;
    notes: string;
  }>>([]);

  const [procedures, setProcedures] = useState<Array<{
    step_number: number;
    phase: number;
    description: string;
    timer_minutes: number;
  }>>([]);

  const [predefinedQuantities, setPredefinedQuantities] = useState<Array<{
    quantity_name: string;
    multiplier: number;
    base_value: number;
  }>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form if editing
  useEffect(() => {
    if (editingRecipe) {
      setName(editingRecipe.name || '');
      setCategoryId(editingRecipe.category_id || (categories[0]?.id ?? ''));
      setDescription(editingRecipe.description || '');
      setImageUrl(editingRecipe.image_url || '');
      setPrepTime(editingRecipe.prep_time ?? 30);
      setCookTime(editingRecipe.cook_time ?? 15);
      setDifficulty(editingRecipe.difficulty || 'Media');
      setIsParametric(Boolean(editingRecipe.is_parametric));
      setCalculatorName(editingRecipe.calculator_name || 'Calcolatore Dosi');

      setIngredients(
        editingRecipe.ingredients && editingRecipe.ingredients.length > 0
          ? editingRecipe.ingredients.map((ing) => ({
              phase: ing.phase || 1,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              notes: ing.notes || '',
            }))
          : [{ phase: 1, name: '', quantity: '', unit: 'g', notes: '' }]
      );

      setProcedures(
        editingRecipe.procedures && editingRecipe.procedures.length > 0
          ? editingRecipe.procedures.map((p, i) => ({
              step_number: p.step_number || i + 1,
              phase: p.phase || 1,
              description: p.description,
              timer_minutes: p.timer_minutes || 0,
            }))
          : [{ step_number: 1, phase: 1, description: '', timer_minutes: 0 }]
      );

      setPredefinedQuantities(
        editingRecipe.predefined_quantities && editingRecipe.predefined_quantities.length > 0
          ? editingRecipe.predefined_quantities.map((pq) => ({
              quantity_name: pq.quantity_name,
              multiplier: pq.multiplier,
              base_value: pq.base_value,
            }))
          : [
              { quantity_name: '2 Porzioni', multiplier: 0.5, base_value: 2 },
              { quantity_name: '4 Porzioni', multiplier: 1.0, base_value: 4 },
              { quantity_name: '6 Porzioni', multiplier: 1.5, base_value: 6 },
            ]
      );
    } else {
      // Default new recipe
      setName('');
      setCategoryId(categories[0]?.id ?? '');
      setDescription('');
      setImageUrl('');
      setPrepTime(30);
      setCookTime(15);
      setDifficulty('Media');
      setIsParametric(true);
      setCalculatorName('Calcolatore Dosi');

      setIngredients([
        { phase: 1, name: 'Farina Tipo 0', quantity: '500', unit: 'g', notes: '' },
        { phase: 1, name: 'Acqua', quantity: '325', unit: 'ml', notes: '65% idratazione' },
        { phase: 1, name: 'Lievito di birra', quantity: '5', unit: 'g', notes: '' },
        { phase: 1, name: 'Sale fino', quantity: '12', unit: 'g', notes: '' },
      ]);

      setProcedures([
        { step_number: 1, phase: 1, description: 'Impastare farina e acqua, lasciare riposare.', timer_minutes: 15 },
        { step_number: 2, phase: 1, description: 'Aggiungere il sale e terminare incordatura.', timer_minutes: 10 },
      ]);

      setPredefinedQuantities([
        { quantity_name: '2 Porzioni / Panetti', multiplier: 0.5, base_value: 2 },
        { quantity_name: '4 Porzioni / Panetti [Standard]', multiplier: 1.0, base_value: 4 },
        { quantity_name: '6 Porzioni / Panetti', multiplier: 1.5, base_value: 6 },
        { quantity_name: '8 Porzioni / Panetti', multiplier: 2.0, base_value: 8 },
      ]);
    }
    setError(null);
  }, [editingRecipe, categories, isOpen]);

  if (!isOpen) return null;

  // Handlers for repeaters
  const addIngredient = () => {
    setIngredients((prev) => [...prev, { phase: 1, name: '', quantity: '', unit: 'g', notes: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, val: any) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const addProcedure = () => {
    setProcedures((prev) => [
      ...prev,
      { step_number: prev.length + 1, phase: 1, description: '', timer_minutes: 0 },
    ]);
  };

  const removeProcedure = (index: number) => {
    setProcedures((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProcedure = (index: number, field: string, val: any) => {
    setProcedures((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const addPredefined = () => {
    setPredefinedQuantities((prev) => [
      ...prev,
      { quantity_name: 'Nuovo Preset', multiplier: 1.0, base_value: 4 },
    ]);
  };

  const removePredefined = (index: number) => {
    setPredefinedQuantities((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePredefined = (index: number, field: string, val: any) => {
    setPredefinedQuantities((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Inserisci il nome della ricetta');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        category_id: categoryId || null,
        description: description.trim(),
        image_url: imageUrl.trim(),
        prep_time: Number(prepTime) || 0,
        cook_time: Number(cookTime) || 0,
        difficulty,
        is_parametric: isParametric ? 1 : 0,
        calculator_name: isParametric ? calculatorName : null,
        ingredients: ingredients.filter((i) => i.name && i.name.trim()),
        procedures: procedures.filter((p) => p.description && p.description.trim()),
        predefined_quantities: isParametric ? predefinedQuantities : [],
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore nel salvataggio della ricetta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-mono">
              {editingRecipe ? 'Modifica Ricetta AnDa' : 'Nuova Ricetta & Calcolatore AnDa'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-mono">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300">
              {error}
            </div>
          )}

          {/* Dati Base */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold block">Nome Ricetta *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Pizza Napoletana Contemporanea"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold block">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-zinc-400 font-bold block">Descrizione</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Breve introduzione alla ricetta, consistenza, idratazione..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-zinc-400 font-bold block">URL Immagine (Opzionale)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Prep. (Minuti)</span>
              </label>
              <input
                type="number"
                min={0}
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>Cottura (Minuti)</span>
              </label>
              <input
                type="number"
                min={0}
                value={cookTime}
                onChange={(e) => setCookTime(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold block">Difficoltà</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Facile">Facile</option>
                <option value="Media">Media</option>
                <option value="Difficile">Difficile</option>
                <option value="Avanzata">Avanzata</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold block">Calcolatore Parametrico</label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="parametric-toggle"
                  checked={isParametric}
                  onChange={(e) => setIsParametric(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-950 border-zinc-700"
                />
                <label htmlFor="parametric-toggle" className="text-zinc-300 font-sans cursor-pointer">
                  Abilita scaling dinamico dosi
                </label>
              </div>
            </div>

            {isParametric && (
              <div className="sm:col-span-2 space-y-1.5 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <label className="text-amber-400 font-bold block">Titolo Calcolatore</label>
                <input
                  type="text"
                  value={calculatorName}
                  onChange={(e) => setCalculatorName(e.target.value)}
                  placeholder="es. Calcolatore Impasto Panetti Pizza"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* PRESET MOLTIPLICATORI (se parametrico) */}
          {isParametric && (
            <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Calculator className="w-4 h-4" />
                  <span>Preset Dosi Predefinite (Moltiplicatori)</span>
                </div>
                <button
                  type="button"
                  onClick={addPredefined}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700"
                >
                  <Plus className="w-3 h-3" />
                  <span>Aggiungi Preset</span>
                </button>
              </div>

              <div className="space-y-2">
                {predefinedQuantities.map((pq, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                    <input
                      type="text"
                      value={pq.quantity_name}
                      onChange={(e) => updatePredefined(idx, 'quantity_name', e.target.value)}
                      placeholder="Nome preset (es. 4 Panetti)"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-white"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500">Mult:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={pq.multiplier}
                        onChange={(e) => updatePredefined(idx, 'multiplier', parseFloat(e.target.value) || 1)}
                        className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-white text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePredefined(idx)}
                      className="p-1.5 rounded-lg hover:bg-red-950 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INGREDIENTI REPEATER */}
          <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-200 font-bold">
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span>Elenco Ingredienti</span>
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700"
              >
                <Plus className="w-3 h-3" />
                <span>Aggiungi Ingrediente</span>
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                  <div className="w-14">
                    <input
                      type="number"
                      min={1}
                      value={ing.phase}
                      onChange={(e) => updateIngredient(idx, 'phase', parseInt(e.target.value, 10) || 1)}
                      title="Fase"
                      placeholder="Fase"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-center text-amber-400 font-bold"
                    />
                  </div>
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    placeholder="Nome ingrediente (es. Farina W300)"
                    className="flex-1 min-w-[140px] bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-white"
                  />
                  <input
                    type="text"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                    placeholder="Quantità"
                    className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-white text-right"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    placeholder="Unità (g, ml)"
                    className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-white text-center"
                  />
                  <input
                    type="text"
                    value={ing.notes}
                    onChange={(e) => updateIngredient(idx, 'notes', e.target.value)}
                    placeholder="Note opzionali"
                    className="flex-1 min-w-[100px] bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="p-1.5 rounded-lg hover:bg-red-950 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PROCEDURE REPEATER */}
          <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-200 font-bold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Passaggi del Procedimento &amp; Timer</span>
              </div>
              <button
                type="button"
                onClick={addProcedure}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700"
              >
                <Plus className="w-3 h-3" />
                <span>Aggiungi Passaggio</span>
              </button>
            </div>

            <div className="space-y-2">
              {procedures.map((proc, idx) => (
                <div key={idx} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">Step #{idx + 1}</span>
                      <span className="text-zinc-600">•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500">Fase:</span>
                        <input
                          type="number"
                          min={1}
                          value={proc.phase}
                          onChange={(e) => updateProcedure(idx, 'phase', parseInt(e.target.value, 10) || 1)}
                          className="w-12 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-center text-amber-400 font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-zinc-400">Timer (min):</span>
                        <input
                          type="number"
                          min={0}
                          value={proc.timer_minutes}
                          onChange={(e) => updateProcedure(idx, 'timer_minutes', parseInt(e.target.value, 10) || 0)}
                          className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-white text-center"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProcedure(idx)}
                        className="p-1 rounded hover:bg-red-950 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={proc.description}
                    onChange={(e) => updateProcedure(idx, 'description', e.target.value)}
                    placeholder="Descrivi dettagliatamente questo passaggio..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-sans focus:outline-none focus:border-amber-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
            >
              {loading ? 'Salvataggio...' : editingRecipe ? 'Aggiorna Ricetta' : 'Crea Ricetta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
