import React, { useState, useEffect, useCallback } from 'react';
import { AndaCategory, AndaRecipe, AndaRecipeDetail, AndaOverview } from '../../types';
import { api } from '../../services/api';
import { RecipeCard } from './RecipeCard';
import { RecipeDetailView } from './RecipeDetailView';
import { RecipeModal } from './RecipeModal';
import { CategoryModal } from './CategoryModal';
import {
  ChefHat,
  Search,
  Plus,
  Filter,
  Calculator,
  FolderPlus,
  RefreshCw,
  Sparkles,
  Layers,
  Utensils,
  Flame,
  AlertCircle
} from 'lucide-react';

interface AndaDashboardProps {
  isAdmin?: boolean;
  onRefreshSystemStatus?: () => void;
}

export const AndaDashboard: React.FC<AndaDashboardProps> = ({
  isAdmin = true,
  onRefreshSystemStatus,
}) => {
  const [overview, setOverview] = useState<AndaOverview | null>(null);
  const [categories, setCategories] = useState<AndaCategory[]>([]);
  const [recipes, setRecipes] = useState<AndaRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected recipe for detail view
  const [selectedRecipe, setSelectedRecipe] = useState<AndaRecipeDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filter state
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [onlyParametric, setOnlyParametric] = useState<boolean>(false);

  // Modals
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<AndaRecipeDetail | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [ov, cats, recs] = await Promise.all([
        api.getAndaOverview(),
        api.getAndaCategories(),
        api.getAndaRecipes(),
      ]);
      setOverview(ov);
      setCategories(cats);
      setRecipes(recs);
    } catch (err: any) {
      console.error('Errore nel caricamento AnDa:', err);
      setError(err.message || 'Errore nel caricamento del ricettario AnDa');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open recipe detail
  const handleSelectRecipe = async (recipe: AndaRecipe) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getAndaRecipeDetail(recipe.id);
      setSelectedRecipe(detail);
    } catch (err: any) {
      alert(err.message || 'Errore nel caricamento della ricetta');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open Edit Recipe
  const handleOpenEditRecipe = async (recipe: AndaRecipe, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const detail = await api.getAndaRecipeDetail(recipe.id);
      setEditingRecipe(detail);
      setIsRecipeModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Errore nel recupero della ricetta');
    }
  };

  // Delete Recipe
  const handleDeleteRecipe = async (recipe: AndaRecipe, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Sei sicuro di voler eliminare la ricetta "${recipe.name}"?`)) return;

    try {
      await api.deleteAndaRecipe(recipe.id);
      if (selectedRecipe?.id === recipe.id) {
        setSelectedRecipe(null);
      }
      await loadData();
      if (onRefreshSystemStatus) onRefreshSystemStatus();
    } catch (err: any) {
      alert(err.message || 'Errore nella cancellazione ricetta');
    }
  };

  // Submit create or edit recipe
  const handleRecipeSubmit = async (formData: any) => {
    if (editingRecipe) {
      await api.updateAndaRecipe(editingRecipe.id, formData);
      // Reload selected detail if open
      if (selectedRecipe?.id === editingRecipe.id) {
        const updated = await api.getAndaRecipeDetail(editingRecipe.id);
        setSelectedRecipe(updated);
      }
    } else {
      await api.createAndaRecipe(formData);
    }
    await loadData();
    if (onRefreshSystemStatus) onRefreshSystemStatus();
  };

  // Filtered recipes
  const filteredRecipes = recipes.filter((r) => {
    if (selectedCategorySlug !== 'all') {
      if (r.category_slug !== selectedCategorySlug && r.category !== selectedCategorySlug) {
        return false;
      }
    }

    if (onlyParametric && !r.is_parametric) {
      return false;
    }

    if (difficultyFilter !== 'all' && r.difficulty !== difficultyFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      const matchCat = (r.category || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 gap-3 font-mono">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs">Caricamento ricettario e calcolatori AnDa...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-2xl text-red-300 max-w-lg mx-auto my-12 text-center space-y-3 font-mono">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="font-bold text-lg text-white font-sans">Errore modulo AnDa</h3>
        <p className="text-xs text-red-300">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow"
        >
          Riprova caricamento
        </button>
      </div>
    );
  }

  // If a recipe is actively open, display detail view
  if (selectedRecipe) {
    return (
      <RecipeDetailView
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
        onEdit={() => {
          setEditingRecipe(selectedRecipe);
          setIsRecipeModalOpen(true);
        }}
        onDelete={() => handleDeleteRecipe(selectedRecipe)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bento Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Recipes */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">Ricette Totali</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              {recipes.length}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">in archivio locale</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        {/* Parametric Recipes */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">Calcolatori Parametrici</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1">
              {recipes.filter((r) => r.is_parametric).length}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">con scaling dinamico</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">Categorie</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              {categories.length}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">pizze, impasti, dolci</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Action button card */}
        <div className="bg-gradient-to-br from-amber-950/30 to-zinc-900 border border-amber-500/30 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 block">Azioni AnDa</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => {
                setEditingRecipe(null);
                setIsRecipeModalOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono shadow-md shadow-amber-950/40 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuova Ricetta</span>
            </button>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white"
              title="Gestisci Categorie"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
          <button
            onClick={() => setSelectedCategorySlug('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
              selectedCategorySlug === 'all'
                ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-md'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
            }`}
          >
            Tutte le Ricette ({recipes.length})
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-md'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                <span>{cat.name}</span>
                {cat.recipe_count !== undefined && cat.recipe_count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-zinc-950/20 text-zinc-900 font-bold' : 'bg-zinc-900 text-zinc-500'
                  }`}>
                    {cat.recipe_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Sub-filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca ricetta per nome o ingrediente..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-zinc-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Difficoltà: Tutte</option>
              <option value="Facile">Facile</option>
              <option value="Media">Media</option>
              <option value="Difficile">Difficile</option>
              <option value="Avanzata">Avanzata</option>
            </select>

            {/* Parametric toggle button */}
            <button
              onClick={() => setOnlyParametric((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${
                onlyParametric
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Solo Parametriche</span>
            </button>
          </div>
        </div>
      </div>

      {/* RECIPES GRID */}
      {filteredRecipes.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-3">
          <ChefHat className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white font-mono">Nessuna ricetta trovata</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto font-mono">
            {searchQuery || selectedCategorySlug !== 'all' || onlyParametric
              ? 'Prova a modificare i filtri o il termine di ricerca.'
              : 'Inizia creando la tua prima ricetta o calcolatore parametrico.'}
          </p>
          <button
            onClick={() => {
              setEditingRecipe(null);
              setIsRecipeModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs font-mono shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crea Nuova Ricetta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={handleSelectRecipe}
              onEdit={handleOpenEditRecipe}
              onDelete={handleDeleteRecipe}
            />
          ))}
        </div>
      )}

      {/* Recipe Modal (Create / Edit) */}
      <RecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setEditingRecipe(null);
        }}
        onSubmit={handleRecipeSubmit}
        categories={categories}
        editingRecipe={editingRecipe}
      />

      {/* Category Manager Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onRefresh={loadData}
      />
    </div>
  );
};
