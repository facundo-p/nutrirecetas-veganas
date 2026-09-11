import { porcentajesDeAporte, type Porcentajes } from '../../domain/aporte';
import { computeNutrition, per100g, perPortion, type RecipeNutrition } from '../../domain/nutrition';
import type { ObjetivosDeReferencia } from '../../domain/objetivos';
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

export interface AporteDeReceta {
  porcentajes: Porcentajes;
  /** Una porción, o 100 g cuando la receta no define porciones (los preparados). */
  base: 'porcion' | '100g';
}

/** Lo que dibuja la barra de una receta. `base` existe para poder decir contra qué. */
export function aporteDeReceta(idx: SeedIndex, recipeId: string, objetivos: ObjetivosDeReferencia): AporteDeReceta {
  const total = nutritionOf(idx, recipeId);
  const porcion = perPortion(total);
  const medida = porcion ?? per100g(total);
  return {
    porcentajes: porcentajesDeAporte(medida.por_nutriente, objetivos, idx.seed.nutrientes),
    base: porcion ? 'porcion' : '100g',
  };
}
