import type { Ingredient, Recipe } from '../seed/schema';

/**
 * Sin ningún nutriente cargado y sin estar declarado como que no aporta (el
 * agua): no es cero, es que no sabemos.
 */
export function ingredienteSinDato(ingrediente: Ingredient): boolean {
  return Object.keys(ingrediente.nutrientes).length === 0 && !ingrediente.aporte_nulo;
}

export interface SustitutoTextual {
  valor: string;
  recetas: string[];
}

export interface SustitutosDeIngrediente {
  /** Ids de ingrediente, sin repetir. */
  resolubles: string[];
  /** Texto libre: las cantidades son de esa receta, por eso viaja con sus nombres. */
  textuales: SustitutoTextual[];
}

/**
 * Los sustitutos viven en cada línea de receta, no en el ingrediente: se juntan
 * de todas las recetas que lo usan.
 */
export function sustitutosDeIngrediente(recetas: Recipe[], ingredienteId: string): SustitutosDeIngrediente {
  const resolubles = new Set<string>();
  const textuales = new Map<string, Set<string>>();
  for (const receta of recetas) {
    for (const linea of receta.lineas) {
      if (linea.ref.tipo !== 'ingrediente' || linea.ref.id !== ingredienteId) continue;
      for (const sustituto of linea.sustitutos) {
        if (sustituto.tipo === 'id') {
          if (sustituto.valor !== ingredienteId) resolubles.add(sustituto.valor);
        } else {
          const nombres = textuales.get(sustituto.valor) ?? new Set<string>();
          nombres.add(receta.nombre);
          textuales.set(sustituto.valor, nombres);
        }
      }
    }
  }
  return {
    resolubles: [...resolubles],
    textuales: [...textuales].map(([valor, nombres]) => ({
      valor,
      recetas: [...nombres],
    })),
  };
}
