import {
  fuerteDeAporte,
  porcentajesDeAporte,
  puntoDeIngrediente,
  type Porcentajes,
  type PuntoDeIngrediente,
} from '../../domain/aporte';
import { computeNutrition, per100g, perPortion, type RecipeNutrition } from '../../domain/nutrition';
import type { ObjetivosDeReferencia } from '../../domain/objetivos';
import type { SeedIndex } from '../../seed';
import type { Line } from '../../seed/schema';

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

/**
 * El punto de una línea de receta. Un preparado se mira por sus 100 g, y va
 * hueco si adentro lleva levadura nutricional: así el aviso de la B12 no se
 * pierde cuando la levadura viene dentro de otra receta.
 */
export function puntoDeLinea(idx: SeedIndex, linea: Line, objetivos: ObjetivosDeReferencia): PuntoDeIngrediente {
  if (linea.ref.tipo === 'ingrediente') {
    const ingrediente = idx.ingredientById.get(linea.ref.id);
    return ingrediente ? puntoDeIngrediente(ingrediente, objetivos, idx.seed.nutrientes) : 'ninguno';
  }
  const preparado = nutritionOf(idx, linea.ref.id);
  if (preparado.alerta_b12) return 'condicional';
  const porcentajes = porcentajesDeAporte(per100g(preparado).por_nutriente, objetivos, idx.seed.nutrientes);
  return fuerteDeAporte(porcentajes)?.nutriente ?? 'ninguno';
}
