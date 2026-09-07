import React from 'react';
import { AndaRecipe } from '../../types';
import { Clock, Flame, Calculator, Sparkles, ChefHat, Pizza, Wheat, Utensils, Cake, FlaskConical, Edit3, Trash2 } from 'lucide-react';

interface RecipeCardProps {
  recipe: AndaRecipe;
  onSelect: (recipe: AndaRecipe) => void;
  onEdit: (recipe: AndaRecipe, e: React.MouseEvent) => void;
  onDelete: (recipe: AndaRecipe, e: React.MouseEvent) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Pizza':
        return <Pizza className="w-3.5 h-3.5 text-amber-400" />;
      case 'Wheat':
        return <Wheat className="w-3.5 h-3.5 text-amber-300" />;
      case 'Utensils':
        return <Utensils className="w-3.5 h-3.5 text-red-400" />;
      case 'Cake':
        return <Cake className="w-3.5 h-3.5 text-pink-400" />;
      case 'FlaskConical':
        return <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <ChefHat className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case 'Facile':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      case 'Media':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      case 'Difficile':
      case 'Avanzata':
        return 'bg-red-950/60 text-red-400 border-red-800/60';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div
      onClick={() => onSelect(recipe)}
      className="group bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer shadow-lg hover:shadow-amber-950/20 flex flex-col justify-between"
    >
      <div>
        {/* Card Header Image / Placeholder */}
        <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-600 gap-2">
              <ChefHat className="w-12 h-12 text-amber-500/40" />
              <span className="text-xs font-mono">Ricetta AnDa</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40" />

          {/* Category Pill Top Left */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-700/60 text-xs font-mono text-white">
            {getCategoryIcon(recipe.category_icon)}
            <span>{recipe.category_name || recipe.category || 'Generale'}</span>
          </div>

          {/* Parametric badge */}
          {Boolean(recipe.is_parametric) && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/90 text-zinc-950 text-[11px] font-mono font-bold shadow-md">
              <Calculator className="w-3 h-3" />
              <span>Parametrica</span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
              {recipe.name}
            </h3>
            {recipe.description && (
              <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                {recipe.description}
              </p>
            )}
          </div>

          {/* Meta specs row */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {recipe.prep_time !== undefined && recipe.prep_time > 0 && (
              <span className="flex items-center gap-1 text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800" title="Tempo di preparazione">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Prep: {recipe.prep_time}m</span>
              </span>
            )}
            {recipe.cook_time !== undefined && recipe.cook_time > 0 && (
              <span className="flex items-center gap-1 text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800" title="Tempo di cottura">
                <Flame className="w-3 h-3 text-red-400" />
                <span>Cottura: {recipe.cook_time}m</span>
              </span>
            )}
            {recipe.difficulty && (
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getDifficultyColor(recipe.difficulty)}`}>
                {recipe.difficulty}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between font-mono text-xs text-zinc-500">
        <div className="flex items-center gap-2 text-[11px]">
          <span>{recipe.ingredients_count || 0} ingr.</span>
          <span>•</span>
          <span>{recipe.procedures_count || 0} passaggi</span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => onEdit(recipe, e)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Modifica ricetta"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onDelete(recipe, e)}
            className="p-1.5 rounded-lg hover:bg-red-950/50 text-zinc-400 hover:text-red-400 transition-colors"
            title="Elimina ricetta"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
