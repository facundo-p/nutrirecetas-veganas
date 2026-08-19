import type { Ingredient, Line, Recipe, Seed } from '../seed/schema';

/**
 * Escalado de porciones. Todo escala lineal por `g_aprox` (decisión de Facu),
 * pero la cocina no es lineal: la sal y las especias se ajustan a gusto, los
 * tiempos no se multiplican, y una torta al doble no entra en el mismo molde.
 * Por eso el escalado devuelve avisos junto con las líneas.
 */

export type TipoAviso = 'ajustar_a_gusto' | 'revisar_tiempo' | 'horneado';

export interface AvisoEscalado {
  tipo: TipoAviso;
  mensaje: string;
  ingredientes?: string[];
}

export const FACTOR_MIN = 0.25;
export const FACTOR_MAX = 4;

/** Categorías que no escalan lineal: el gusto manda sobre la regla de tres. */
const CATEGORIAS_A_GUSTO = new Set(['especia', 'condimento']);

/** Ids puntuales que tampoco escalan lineal aunque su categoría sea otra. */
const IDS_A_GUSTO = new Set([
  'sal_yodada',
  'levadura_fresca',
  'polvo_hornear',
  'bicarbonato',
  'masa_madre',
  'kala_namak',
]);

function noEscalaLineal(ingrediente: Ingredient): boolean {
  return CATEGORIAS_A_GUSTO.has(ingrediente.categoria) || IDS_A_GUSTO.has(ingrediente.id);
}

/** Una receta que va al horno: duplicarla no es llenar más el molde. */
export function esHorneada(recipe: Recipe): boolean {
  if (recipe.tipo === 'pan' || recipe.tipo === 'dulce') return true;
  return recipe.utensilios.some(
    (u) =>
      (u.tipo === 'equipo' && (u.id === 'placa_horno' || u.id === 'budinera_muffinera')) ||
      (u.tipo === 'equipo_libre' && /horno|budinera|molde|placa/i.test(u.nombre)),
  );
}

export function escalarLineas(lineas: Line[], factor: number): Line[] {
  return lineas.map((linea) => ({
    ...linea,
    cantidad: linea.cantidad * factor,
    g_aprox: linea.g_aprox * factor,
  }));
}

export function avisosDeEscalado(recipe: Recipe, factor: number, seed: Seed): AvisoEscalado[] {
  if (factor === 1) return [];
  const avisos: AvisoEscalado[] = [];
  const ingredientById = new Map(seed.ingredientes.map((i) => [i.id, i]));

  const aGusto = recipe.lineas
    .filter((l) => l.ref.tipo === 'ingrediente')
    .map((l) => ingredientById.get(l.ref.id))
    .filter((i): i is Ingredient => i !== undefined && noEscalaLineal(i));

  if (aGusto.length > 0) {
    avisos.push({
      tipo: 'ajustar_a_gusto',
      mensaje: 'Estos no escalan lineal: ajustalos a gusto y probá antes de sumar más.',
      ingredientes: [...new Set(aGusto.map((i) => i.nombre))],
    });
  }

  if (recipe.tiempo_coccion_min > 0) {
    avisos.push({
      tipo: 'revisar_tiempo',
      mensaje: `El tiempo de cocción no se escala, pero con más volumen cambia: revisá el punto antes de los ${recipe.tiempo_coccion_min} min.`,
    });
  }

  if (esHorneada(recipe) && factor > 1) {
    avisos.push({
      tipo: 'horneado',
      mensaje:
        'Es una receta de horno: el doble de masa en el mismo molde no se cocina igual. Mejor hacer tandas o usar un múltiplo real del molde.',
    });
  }

  return avisos;
}

export function escalarReceta(
  recipe: Recipe,
  factor: number,
  seed: Seed,
): { lineas: Line[]; avisos: AvisoEscalado[]; porciones: number | null } {
  return {
    lineas: escalarLineas(recipe.lineas, factor),
    avisos: avisosDeEscalado(recipe, factor, seed),
    porciones: recipe.porciones_num === null ? null : recipe.porciones_num * factor,
  };
}
