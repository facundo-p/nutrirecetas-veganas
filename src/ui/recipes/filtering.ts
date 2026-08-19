import { getSeedIndex, type SeedIndex } from '../../seed';
import type { Recipe } from '../../seed/schema';
import { computeNutrition, type RecipeNutrition } from '../../domain/nutrition';
import { isRichIn } from '../../domain/rda';
import { normalize } from '../common/format';
import { recipeInSeason } from '../common/season';

/** Lógica de filtrado del recetario, pura y testeable. */

export interface RecipeFiltersState {
  q: string;
  tipo: 'todas' | Recipe['tipo'] | 'preparados';
  dificultad: '' | Recipe['dificultad'];
  tiempoMax: number | null;
  familia: string;
  deEstacion: boolean;
  estado: '' | Recipe['estado'];
  ricaEn: string;
}

export const EMPTY_FILTERS: RecipeFiltersState = {
  q: '',
  tipo: 'todas',
  dificultad: '',
  tiempoMax: null,
  familia: '',
  deEstacion: false,
  estado: '',
  ricaEn: '',
};

const nutritionCache = new Map<string, RecipeNutrition>();

export function nutritionOf(idx: SeedIndex, recipeId: string): RecipeNutrition {
  let n = nutritionCache.get(recipeId);
  if (!n) {
    n = computeNutrition(recipeId, idx);
    nutritionCache.set(recipeId, n);
  }
  return n;
}

/** ids de ingredientes cuyo nombre o sinónimos matchean la búsqueda */
function matchingIngredientIds(idx: SeedIndex, q: string): Set<string> {
  const ids = new Set<string>();
  for (const ing of idx.seed.ingredientes) {
    if (normalize(ing.nombre).includes(q) || ing.sinonimos.some((s) => normalize(s).includes(q))) {
      ids.add(ing.id);
    }
  }
  return ids;
}

export function matchesFilters(idx: SeedIndex, recipe: Recipe, f: RecipeFiltersState): boolean {
  if (f.tipo === 'preparados') {
    if (!recipe.es_preparado) return false;
  } else if (f.tipo !== 'todas' && recipe.tipo !== f.tipo) {
    return false;
  }
  if (f.dificultad !== '' && recipe.dificultad !== f.dificultad) return false;
  if (f.tiempoMax !== null && recipe.tiempo_prep_min + recipe.tiempo_coccion_min > f.tiempoMax) return false;
  if (f.familia !== '' && recipe.familia !== f.familia) return false;
  if (f.estado !== '' && recipe.estado !== f.estado) return false;
  if (f.deEstacion && !recipeInSeason(idx, recipe)) return false;
  if (f.ricaEn !== '') {
    const nutrient = idx.nutrientById.get(f.ricaEn);
    if (!nutrient || !isRichIn(nutritionOf(idx, recipe.id), nutrient)) return false;
  }
  const q = normalize(f.q.trim());
  if (q !== '') {
    const byName = normalize(recipe.nombre).includes(q);
    if (!byName) {
      const ids = matchingIngredientIds(idx, q);
      const byIngredient = recipe.lineas.some((l) => l.ref.tipo === 'ingrediente' && ids.has(l.ref.id));
      if (!byIngredient) return false;
    }
  }
  return true;
}

export interface RecipeGroup {
  mother: Recipe;
  variants: Recipe[];
  motherMatches: boolean;
  matchingVariants: Recipe[];
}

/** Variantes agrupadas bajo su madre; el grupo aparece si la madre o alguna variante matchea. */
export function groupRecipes(f: RecipeFiltersState, idx = getSeedIndex()): RecipeGroup[] {
  const groups: RecipeGroup[] = [];
  for (const recipe of idx.seed.recetas) {
    if (recipe.variante_de !== undefined) continue; // aparece bajo su madre
    const variants = idx.variantsOf(recipe.id);
    const motherMatches = matchesFilters(idx, recipe, f);
    const matchingVariants = variants.filter((v) => matchesFilters(idx, v, f));
    if (motherMatches || matchingVariants.length > 0) {
      groups.push({ mother: recipe, variants, motherMatches, matchingVariants });
    }
  }
  return groups;
}

export function allFamilies(idx = getSeedIndex()): string[] {
  return [...new Set(idx.seed.recetas.map((r) => r.familia).filter((x): x is string => x !== undefined))].sort();
}
