import React, { useState } from 'react';
import { AndaCategory } from '../../types';
import { X, Plus, Trash2, Edit3, Check, FolderPlus, Pizza, Wheat, Utensils, Cake, FlaskConical, ChefHat } from 'lucide-react';
import { api } from '../../services/api';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: AndaCategory[];
  onRefresh: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onRefresh,
}) => {
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('ChefHat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (cat: AndaCategory) => {
    setEditingCatId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setIcon(cat.icon || 'ChefHat');
  };

  const handleCancelEdit = () => {
    setEditingCatId(null);
    setName('');
    setDescription('');
    setIcon('ChefHat');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      if (editingCatId) {
        await api.updateAndaCategory(editingCatId, {
          name: name.trim(),
          description: description.trim(),
          icon,
        });
      } else {
        await api.createAndaCategory({
          name: name.trim(),
          description: description.trim(),
          icon,
        });
      }
      handleCancelEdit();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Errore nel salvataggio categoria');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa categoria?')) return;
    setLoading(true);
    try {
      await api.deleteAndaCategory(id);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Errore nella cancellazione categoria');
    } finally {
      setLoading(false);
    }
  };

  const availableIcons = ['Pizza', 'Wheat', 'Utensils', 'Cake', 'FlaskConical', 'ChefHat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-mono">
              Gestione Categorie AnDa
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs font-mono">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300">
              {error}
            </div>
          )}

          {/* Form Crea / Modifica */}
          <form onSubmit={handleSave} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              {editingCatId ? <Edit3 className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-amber-400" />}
              <span>{editingCatId ? 'Modifica Categoria' : 'Crea Nuova Categoria'}</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold block">Nome Categoria *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Pasticceria Secca"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold block">Descrizione</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrizione o tipologie..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-bold block">Icona Categoria</label>
              <div className="flex gap-2">
                {availableIcons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`p-2 rounded-xl border text-xs flex items-center justify-center transition-all ${
                      icon === ic
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingCatId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Annulla
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow"
              >
                {loading ? 'Salvataggio...' : editingCatId ? 'Aggiorna' : 'Aggiungi'}
              </button>
            </div>
          </form>

          {/* List of existing categories */}
          <div className="space-y-2">
            <h3 className="font-bold text-zinc-400">Categorie Esistenti ({categories.length})</h3>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                      <ChefHat className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">{cat.name}</div>
                      {cat.description && (
                        <div className="text-[10px] text-zinc-500">{cat.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {cat.recipe_count || 0} ricette
                    </span>
                    <button
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      title="Modifica categoria"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 rounded-lg hover:bg-red-950 text-zinc-400 hover:text-red-400"
                      title="Elimina categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
