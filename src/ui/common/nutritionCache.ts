import { computeNutrition, type RecipeNutrition } from '../../domain/nutrition';
import type { SeedIndex } from '../../seed';

/** La semilla es inmutable durante la sesión: el cálculo por receta se memoiza. */
const cache = new Map<string, RecipeNutrition>();

export function nutritionOf(idx: SeedIndex, recipeId: string): RecipeNutrition {
  let n = cache.get(recipeId);
  if (!n) {
    n = computeNutrition(recipeId, idx);
    cache.set(recipeId, n);
  }
  return n;
}
