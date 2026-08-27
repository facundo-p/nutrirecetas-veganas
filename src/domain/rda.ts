import type { Nutrient } from '../seed/schema';
import { midpoint } from './interval';
import { per100g, perPortion, type RecipeNutrition } from './nutrition';

/**
 * Resolución de RDA canónicas por perfil. En Fase 1 la UI solo usa la
 * referencia genérica (filtro "rica en"); la resolución personalizada queda
 * lista para el perfil real de Fase 2.
 */

export interface RdaResolution {
  valor: number;
  /** true si no hubo ventana exacta de sexo+edad y se usó la más cercana */
  aproximada?: true;
}

const REFERENCE_WEIGHT_KG = 70;

export function resolveRda(
  nutrient: Nutrient,
  sexo: 'masculino' | 'femenino',
  edad: number,
  peso_kg?: number,
): RdaResolution {
  const compatible = nutrient.rda.filter((e) => e.sexo === undefined || e.sexo === sexo);
  if (compatible.length === 0) throw new Error(`RDA de "${nutrient.id}" sin entradas para sexo ${sexo}`);

  const enVentana = compatible.filter((e) => edad >= e.edad_min && edad <= e.edad_max);
  // más específico primero: con sexo declarado, después ventana más angosta
  enVentana.sort((a, b) => {
    const bySex = Number(b.sexo !== undefined) - Number(a.sexo !== undefined);
    if (bySex !== 0) return bySex;
    return a.edad_max - a.edad_min - (b.edad_max - b.edad_min);
  });

  let entry = enVentana[0];
  let aproximada = false;
  if (!entry) {
    // sin ventana exacta: la entrada con borde de edad más cercano
    const byDistance = [...compatible].sort((a, b) => {
      const da = Math.min(Math.abs(edad - a.edad_min), Math.abs(edad - a.edad_max));
      const db = Math.min(Math.abs(edad - b.edad_min), Math.abs(edad - b.edad_max));
      return da - db;
    });
    entry = byDistance[0]!;
    aproximada = true;
  }

  const valor = entry.por_kg ? entry.valor * (peso_kg ?? REFERENCE_WEIGHT_KG) : entry.valor;
  return aproximada ? { valor, aproximada: true } : { valor };
}

/** Factor vegano aplicable: solo donde el dataset trae número (no se inventan factores). */
export function veganFactor(nutrient: Nutrient): number {
  return nutrient.ajuste_vegano?.factor ?? 1;
}

/**
 * RDA de referencia genérica para el filtro "rica en" del recetario:
 * el máximo entre las entradas adultas × factor vegano (proteína: 70 kg).
 * NO es el semáforo personalizado (eso llega con el perfil en Fase 2).
 */
export function genericReferenceRda(nutrient: Nutrient): number {
  const valores = nutrient.rda.map((e) => (e.por_kg ? e.valor * REFERENCE_WEIGHT_KG : e.valor));
  return Math.max(...valores) * veganFactor(nutrient);
}

const RICH_THRESHOLD = 0.2;

/**
 * "Rica en X": ≥20 % de la RDA de referencia genérica por porción
 * (o por 100 g si la receta no define porciones).
 *
 * Es una afirmación suelta —el filtro mete la receta en una lista sin banda, ni
 * cobertura, ni IC a la vista—, así que rige la misma regla que el motivo de
 * una recomendación: un punto medio cuyo rango arranca en cero no se afirma.
 * Sin eso, una receta cuya B12 va "de 0 a 12,7 µg" aparecería como rica en B12.
 */
export function isRichIn(nutrition: RecipeNutrition, nutrient: Nutrient): boolean {
  const base = perPortion(nutrition) ?? per100g(nutrition);
  const result = base.por_nutriente[nutrient.clave_ingrediente];
  if (result.ic === null) return false; // sin datos no se afirma nada
  if (result.intervalo.min <= 0) return false;
  return midpoint(result.intervalo) >= RICH_THRESHOLD * genericReferenceRda(nutrient);
}
