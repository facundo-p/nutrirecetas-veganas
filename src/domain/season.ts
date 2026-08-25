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

export interface EstacionDeReceta {
  /** Ingredientes de la receta que están en pico este mes. */
  enPico: number;
  /** Qué fracción del peso de la receta aportan esos ingredientes. */
  proporcion: number;
}

/**
 * Cuánto de la receta, **en gramos**, está en su mejor momento. El booleano de
 * arriba alcanza para filtrar pero no para ordenar, y contar ingredientes
 * tampoco: una receta con un puñado de perejil en pico saldría igual que una
 * hecha de verdura de estación. El gramo es la unidad canónica del proyecto
 * (invariante 1) y acá también es lo único que ordena bien.
 *
 * El denominador es el peso de todas las líneas de ingrediente, no solo el de
 * las que tienen dato: si no, una receta de lentejas con una hoja de laurel en
 * pico daría 100 %.
 *
 * `null` cuando ningún ingrediente tiene dato de estacionalidad: no sabemos, y
 * un cero ahí sería afirmar que está fuera de temporada.
 */
export function estacionDeReceta(idx: SeedIndex, recipe: Recipe, mes: number): EstacionDeReceta | null {
  let enPico = 0;
  let gramosEnPico = 0;
  let gramosTotales = 0;
  let hayDato = false;

  for (const linea of recipe.lineas) {
    if (linea.ref.tipo !== 'ingrediente') continue;
    gramosTotales += linea.g_aprox;
    if (!idx.seasonalityByIngredient.has(linea.ref.id)) continue;
    hayDato = true;
    if (ingredientInSeason(idx, linea.ref.id, mes)) {
      enPico += 1;
      gramosEnPico += linea.g_aprox;
    }
  }

  if (!hayDato) return null;
  return { enPico, proporcion: gramosTotales === 0 ? 0 : gramosEnPico / gramosTotales };
}
