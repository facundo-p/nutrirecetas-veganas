import type { Ingredient, Interval, Recipe } from '../seed/schema';
import { INGREDIENT_NUTRIENT_KEYS, type IngredientNutrientKey } from '../seed/schema';
import { interval, scale, sum } from './interval';

/**
 * Motor nutricional puro (sin React/DOM/IndexedDB). La nutrición de una receta
 * SIEMPRE se calcula desde sus ingredientes vía `g_aprox`; los preparados se
 * resuelven recursivamente con su `rendimiento_g` (arquitectura §5).
 * Nulos jamás son cero en silencio: cada nutriente lleva su cobertura.
 */

export interface NutrientResult {
  intervalo: Interval;
  /** % de la masa de la receta cuyos ingredientes tienen dato de este nutriente */
  cobertura_pct: number;
  /** IC promedio ponderado por masa de los ingredientes que aportan (null = nadie aporta) */
  ic: number | null;
}

export interface RecipeNutrition {
  masa_total_g: number;
  kcal: NutrientResult;
  por_nutriente: Record<IngredientNutrientKey, NutrientResult>;
  /** true si la receta (o un preparado que consume) usa levadura nutricional */
  alerta_b12: boolean;
  porciones_num: number | null;
  rendimiento_g: number | undefined;
}

/** Lo mínimo que el motor necesita de la semilla (mantiene el dominio puro y testeable). */
export interface NutritionSource {
  ingredientById: Map<string, Ingredient>;
  recipeById: Map<string, Recipe>;
}

const MAX_DEPTH = 3;
const B12_ALERT_INGREDIENT = 'levadura_nutricional';

interface Accumulator {
  valor: Interval;
  masa_cubierta_g: number;
  ic_ponderado: number; // Σ ic·masa de lo que aporta
}

type AccMap = Record<string, Accumulator>;

function newAcc(): Accumulator {
  return { valor: interval(0), masa_cubierta_g: 0, ic_ponderado: 0 };
}

const ACC_KEYS: readonly string[] = [...INGREDIENT_NUTRIENT_KEYS, 'kcal'];

function computeTotals(
  recipe: Recipe,
  source: NutritionSource,
  visited: Set<string>,
  depth: number,
): { acc: AccMap; masa: number; alertaB12: boolean } {
  if (visited.has(recipe.id)) {
    throw new Error(`Ciclo de preparados en "${recipe.id}" — la semilla validada no debería permitirlo`);
  }
  if (depth > MAX_DEPTH) {
    throw new Error(`Cadena de preparados más profunda que ${MAX_DEPTH} en "${recipe.id}"`);
  }
  visited.add(recipe.id);

  const acc: AccMap = {};
  for (const key of ACC_KEYS) acc[key] = newAcc();
  let masa = 0;
  let alertaB12 = false;

  for (const linea of recipe.lineas) {
    const m = linea.g_aprox;
    masa += m;
    if (m === 0) continue;

    if (linea.ref.tipo === 'ingrediente') {
      const ing = source.ingredientById.get(linea.ref.id);
      if (!ing) throw new Error(`${recipe.id}: ingrediente "${linea.ref.id}" fuera de la semilla`);
      if (ing.id === B12_ALERT_INGREDIENT) alertaB12 = true;
      for (const key of ACC_KEYS) {
        const value = key === 'kcal' ? ing.kcal : ing.nutrientes[key as IngredientNutrientKey];
        // Sin dato: la masa queda fuera de la cobertura. Salvo el agua y compañía,
        // que aportan cero de verdad (`aporte_nulo`) y sí cuentan como cubiertas:
        // si no, una sopa reportaría cobertura ínfima por el peso del líquido.
        if (value === undefined && !ing.aporte_nulo) continue;
        const slot = acc[key]!;
        if (value !== undefined) slot.valor = sum([slot.valor, scale(value.intervalo, m / 100)]);
        slot.masa_cubierta_g += m;
        slot.ic_ponderado += ing.ic * m;
      }
    } else {
      const prep = source.recipeById.get(linea.ref.id);
      if (!prep) throw new Error(`${recipe.id}: preparado "${linea.ref.id}" fuera de la semilla`);
      if (prep.rendimiento_g === undefined) {
        throw new Error(`${recipe.id}: preparado "${prep.id}" sin rendimiento_g`);
      }
      const inner = computeTotals(prep, source, visited, depth + 1);
      if (inner.alertaB12) alertaB12 = true;
      // total del preparado → por gramo de preparado → por los m gramos usados
      const factor = m / prep.rendimiento_g;
      for (const key of ACC_KEYS) {
        const innerAcc = inner.acc[key]!;
        if (innerAcc.masa_cubierta_g === 0) continue;
        const slot = acc[key]!;
        slot.valor = sum([slot.valor, scale(innerAcc.valor, factor)]);
        // la cobertura del preparado se hereda proporcionalmente
        const coberturaPrep = innerAcc.masa_cubierta_g / inner.masa;
        slot.masa_cubierta_g += m * coberturaPrep;
        slot.ic_ponderado += (innerAcc.ic_ponderado / innerAcc.masa_cubierta_g) * m * coberturaPrep;
      }
    }
  }

  visited.delete(recipe.id);
  return { acc, masa, alertaB12 };
}

/** Cobertura desde la que un cero se puede afirmar como "no tiene", no como "no sabemos". */
const COBERTURA_PARA_AFIRMAR_CERO = 90;

/**
 * ¿Hay algo que informar, o corresponde decir "sin datos"? Un valor mayor a cero
 * siempre se informa (con su cobertura al lado, para que se lea con pinzas). Un
 * cero solo se afirma cuando casi toda la masa tiene dato: sin eso, "0 mg" sería
 * decir "no tiene" cuando lo cierto es "no sabemos".
 */
export function hasReportableValue(r: NutrientResult): boolean {
  if (r.ic === null) return false;
  if (r.intervalo.max > 0) return true;
  return r.cobertura_pct >= COBERTURA_PARA_AFIRMAR_CERO;
}

function toResult(a: Accumulator, masaTotal: number): NutrientResult {
  return {
    intervalo: a.valor,
    cobertura_pct: masaTotal === 0 ? 0 : (a.masa_cubierta_g / masaTotal) * 100,
    ic: a.masa_cubierta_g === 0 ? null : Math.floor(a.ic_ponderado / a.masa_cubierta_g),
  };
}

/** Nutrición total de la receta entera (todas sus porciones). */
export function computeNutrition(recipeId: string, source: NutritionSource): RecipeNutrition {
  const recipe = source.recipeById.get(recipeId);
  if (!recipe) throw new Error(`Receta "${recipeId}" fuera de la semilla`);
  const { acc, masa, alertaB12 } = computeTotals(recipe, source, new Set(), 0);

  const por_nutriente = {} as Record<IngredientNutrientKey, NutrientResult>;
  for (const key of INGREDIENT_NUTRIENT_KEYS) {
    por_nutriente[key] = toResult(acc[key]!, masa);
  }
  return {
    masa_total_g: masa,
    kcal: toResult(acc.kcal!, masa),
    por_nutriente,
    alerta_b12: alertaB12,
    porciones_num: recipe.porciones_num,
    rendimiento_g: recipe.rendimiento_g,
  };
}

function scaleNutrition(n: RecipeNutrition, factor: number): RecipeNutrition {
  const por_nutriente = {} as Record<IngredientNutrientKey, NutrientResult>;
  for (const key of INGREDIENT_NUTRIENT_KEYS) {
    const r = n.por_nutriente[key];
    por_nutriente[key] = { ...r, intervalo: scale(r.intervalo, factor) };
  }
  return {
    ...n,
    masa_total_g: n.masa_total_g * factor,
    kcal: { ...n.kcal, intervalo: scale(n.kcal.intervalo, factor) },
    por_nutriente,
  };
}

/** Nutrición por porción; null si la receta no define porciones (se usa per100g). */
export function perPortion(n: RecipeNutrition): RecipeNutrition | null {
  if (n.porciones_num === null) return null;
  return scaleNutrition(n, 1 / n.porciones_num);
}

/** Nutrición por 100 g: usa rendimiento_g si existe (preparados), sino la masa de insumos. */
export function per100g(n: RecipeNutrition): RecipeNutrition {
  const base = n.rendimiento_g ?? n.masa_total_g;
  if (base === 0) return n;
  return scaleNutrition(n, 100 / base);
}
