import { INGREDIENT_NUTRIENT_KEYS, type Ingredient, type IngredientNutrientKey, type Nutrient } from '../seed/schema';
import { B12_ALERT_INGREDIENT, type NutrientResult } from './nutrition';
import { porcentajeAfirmableSolo, type ObjetivosDeReferencia } from './objetivos';

/**
 * El color por nutriente: qué nutrientes tienen color, y cuáles se dibujan en
 * la barra de cada receta.
 *
 * Tienen color los que importan para un vegano —más proteína y fibra— y además
 * tienen dato en suficientes ingredientes como para que un casillero diga algo.
 * El yodo es crítico y queda afuera: con dato en 3 de 158 ingredientes, su
 * casillero estaría vacío en 70 de 72 recetas, y vacío se lee "no tiene" cuando
 * la verdad es "no sabemos" (#169). B12 y vitamina D no vienen de la comida.
 *
 * El orden es canónico —minerales, vitaminas, macro y grasas— y no cambia: la
 * barra se lee igual aunque sus seis nutrientes cambien de receta en receta.
 * Magnesio va antes que zinc para que los dos violetas no queden pegados.
 */
export const ORDEN_BARRA = [
  'hierro',
  'calcio',
  'magnesio',
  'zinc',
  'selenio',
  'vita',
  'vitc',
  'folato',
  'proteina',
  'fibra',
  'omega3',
] as const;
export type NutrienteDeBarra = (typeof ORDEN_BARRA)[number];

export const CASILLEROS = 6;

export const NOMBRE_CORTO: Record<NutrienteDeBarra, string> = {
  hierro: 'hierro',
  calcio: 'calcio',
  magnesio: 'magnesio',
  zinc: 'zinc',
  selenio: 'selenio',
  vita: 'vitamina A',
  vitc: 'vitamina C',
  folato: 'folato',
  proteina: 'proteína',
  fibra: 'fibra',
  omega3: 'omega 3',
};

export type GrupoDelPanel = 'Minerales' | 'Vitaminas' | 'Macro y grasas';

export const GRUPOS_DEL_PANEL: readonly GrupoDelPanel[] = ['Minerales', 'Vitaminas', 'Macro y grasas'];

/**
 * Cómo se agrupan los veinte en el panel de la ficha. La colina va con las
 * vitaminas: se comporta como una aunque no lo sea.
 */
export const GRUPO_DEL_PANEL: Readonly<Record<string, GrupoDelPanel>> = {
  hierro: 'Minerales',
  calcio: 'Minerales',
  magnesio: 'Minerales',
  zinc: 'Minerales',
  selenio: 'Minerales',
  yodo: 'Minerales',
  potasio: 'Minerales',
  vita: 'Vitaminas',
  vitc: 'Vitaminas',
  folato: 'Vitaminas',
  b12: 'Vitaminas',
  vitd: 'Vitaminas',
  b2: 'Vitaminas',
  b6: 'Vitaminas',
  vite: 'Vitaminas',
  vitk: 'Vitaminas',
  colina: 'Vitaminas',
  proteina: 'Macro y grasas',
  fibra: 'Macro y grasas',
  omega3: 'Macro y grasas',
};

export function esNutrienteDeBarra(id: string): id is NutrienteDeBarra {
  return (ORDEN_BARRA as readonly string[]).includes(id);
}

/** Qué porcentaje del día cubre cada nutriente de barra. `null`: no hay dato que afirmar. */
export type Porcentajes = Record<NutrienteDeBarra, number | null>;

/** Resultados por clave de la semilla: los de una porción, o los de 100 g de un ingrediente. */
export type ResultadosPorClave = Partial<Record<IngredientNutrientKey, NutrientResult>>;

/**
 * Los porcentajes que se dibujan. Un casillero no tiene dónde mostrar la banda,
 * así que va `porcentajeAfirmableSolo`: un punto medio cuyo rango arranca en
 * cero no se pinta.
 */
export function porcentajesDeAporte(
  resultados: ResultadosPorClave,
  objetivos: ObjetivosDeReferencia,
  nutrientes: Nutrient[],
): Porcentajes {
  const claveDe = new Map(nutrientes.map((n) => [n.id, n.clave_ingrediente]));
  const porcentajes = {} as Porcentajes;
  for (const id of ORDEN_BARRA) {
    const clave = claveDe.get(id);
    porcentajes[id] =
      clave === undefined ? null : porcentajeAfirmableSolo(resultados[clave], objetivos.porNutriente.get(id));
  }
  return porcentajes;
}

/** Los 100 g de un ingrediente como resultados: dato de la ficha, cobertura total y su IC. */
export function resultadosDeIngrediente(ingrediente: Ingredient): ResultadosPorClave {
  const resultados: ResultadosPorClave = {};
  for (const clave of INGREDIENT_NUTRIENT_KEYS) {
    const valor = ingrediente.nutrientes[clave];
    if (valor) resultados[clave] = { intervalo: valor.intervalo, cobertura_pct: 100, ic: ingrediente.ic };
  }
  return resultados;
}

export type Franja = { nutriente: NutrienteDeBarra; porcentaje: number; relleno: number } | { nutriente: null };

/**
 * Los casilleros de la barra: los seis nutrientes que más cubre, redibujados en
 * orden canónico. Un nutriente sin dato no recibe casillero —el último puesto
 * se lee "casi no tiene" (invariante 5)—: si hay menos de seis con dato, los que
 * sobran van vacíos y sin nombre. El relleno se corta en 100.
 */
export function franjasDeAporte(porcentajes: Porcentajes): Franja[] {
  const conDato = ORDEN_BARRA.filter((id) => porcentajes[id] !== null);
  // sort es estable: en un empate queda el que va antes en el canon
  const elegidos = new Set([...conDato].sort((a, b) => porcentajes[b]! - porcentajes[a]!).slice(0, CASILLEROS));
  const franjas: Franja[] = ORDEN_BARRA.filter((id) => elegidos.has(id)).map((id) => {
    const porcentaje = porcentajes[id]!;
    return { nutriente: id, porcentaje, relleno: Math.min(100, porcentaje) };
  });
  while (franjas.length < CASILLEROS) franjas.push({ nutriente: null });
  return franjas;
}

/** El nutriente que más cubre, para nombrarlo con su porcentaje. `null` si ninguno tiene dato. */
export function fuerteDeAporte(porcentajes: Porcentajes): { nutriente: NutrienteDeBarra; porcentaje: number } | null {
  let fuerte: { nutriente: NutrienteDeBarra; porcentaje: number } | null = null;
  for (const id of ORDEN_BARRA) {
    const porcentaje = porcentajes[id];
    if (porcentaje !== null && (fuerte === null || porcentaje > fuerte.porcentaje)) fuerte = { nutriente: id, porcentaje };
  }
  return fuerte;
}

/** El punto de un ingrediente en la lista: el nutriente de barra que más cubren sus 100 g. */
export type PuntoDeIngrediente = NutrienteDeBarra | 'ninguno' | 'condicional';

/**
 * La levadura nutricional es aporte condicional aunque traiga otros nutrientes:
 * su B12 existe solo si la marca está fortificada, y el punto hueco es lo que lo
 * dice en la lista de ingredientes (invariante 6).
 */
export function puntoDeIngrediente(
  ingrediente: Ingredient,
  objetivos: ObjetivosDeReferencia,
  nutrientes: Nutrient[],
): PuntoDeIngrediente {
  if (ingrediente.id === B12_ALERT_INGREDIENT) return 'condicional';
  const porcentajes = porcentajesDeAporte(resultadosDeIngrediente(ingrediente), objetivos, nutrientes);
  return fuerteDeAporte(porcentajes)?.nutriente ?? 'ninguno';
}

/** Cómo se lo nombra en la app: el nombre corto si tiene color, el del catálogo si no. */
export function nombreDeNutriente(nutriente: Pick<Nutrient, 'id' | 'nombre'>): string {
  if (esNutrienteDeBarra(nutriente.id)) return NOMBRE_CORTO[nutriente.id];
  return nutriente.nombre.charAt(0).toLowerCase() + nutriente.nombre.slice(1);
}
