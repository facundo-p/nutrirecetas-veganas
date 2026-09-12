import type { SeedIndex } from '../seed';
import type { Recipe } from '../seed/schema';

/**
 * Estacionalidad (AMBA): un ingrediente está en pico si el mes está en sus
 * `meses_pico`. El mes entra por parámetro — el dominio no lee el reloj.
 */

export function ingredientInSeason(idx: SeedIndex, ingredientId: string, mes: number): boolean {
  const item = idx.seasonalityByIngredient.get(ingredientId);
  return item !== undefined && item.meses_pico.includes(mes);
}

/** Una receta es "de estación" si al menos un ingrediente fresco está en pico. */
export function recipeInSeason(idx: SeedIndex, recipe: Recipe, mes: number): boolean {
  return recipe.lineas.some((l) => l.ref.tipo === 'ingrediente' && ingredientInSeason(idx, l.ref.id, mes));
}

