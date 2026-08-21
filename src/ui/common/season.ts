import type { SeedIndex } from '../../seed';
import type { Recipe } from '../../seed/schema';
import { currentMonth } from './format';

/** Estacionalidad (AMBA): pico si el mes actual está en meses_pico. */

export function ingredientInSeason(idx: SeedIndex, ingredientId: string, month = currentMonth()): boolean {
  const item = idx.seasonalityByIngredient.get(ingredientId);
  return item !== undefined && item.meses_pico.includes(month);
}

/** Una receta es "de estación" si al menos un ingrediente fresco está en pico. */
export function recipeInSeason(idx: SeedIndex, recipe: Recipe, month = currentMonth()): boolean {
  return recipe.lineas.some((l) => l.ref.tipo === 'ingrediente' && ingredientInSeason(idx, l.ref.id, month));
}
