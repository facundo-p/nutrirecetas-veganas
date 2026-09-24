import type { BaseDeMedida } from '../../domain/nutrition';
import { cabezaDeUnidad } from '../../domain/rounding';
import { unidadDecible } from '../../domain/unidades-decibles';
import type { Line } from '../../seed/schema';

/** Utilidades de presentación compartidas (sin estado, sin datos). */

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return rest === 0 ? `${h} h` : `${h} h ${rest} min`;
}

/** minúsculas + sin tildes, para búsqueda tolerante */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function formatNumber(value: number, decimals = 1): string {
  const rounded = Number(value.toFixed(decimals));
  return String(rounded).replace('.', ',');
}

/** Un valor de la semilla para mostrar: `leche_de_coco` → «leche de coco». */
export function legible(valorDeSemilla: string): string {
  return valorDeSemilla.replaceAll('_', ' ');
}

const GLIFO_DE_CUARTO: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

/**
 * Cantidad de una línea de receta. Media cebolla se escribe ½, no 0,5: las
 * fracciones de cocina se leen de un vistazo y el decimal obliga a traducir.
 */
export function formatCantidad(valor: number): string {
  const entero = Math.floor(valor);
  const glifo = GLIFO_DE_CUARTO[String(Number((valor - entero).toFixed(2)))];
  if (glifo === undefined) return formatNumber(valor, 1);
  return entero === 0 ? glifo : `${entero}${glifo}`;
}

/**
 * La unidad de una línea para leerla en una lista: la medida en palabra
 * completa y lo que describe entre paréntesis. Abreviadas, «1½ cda jugo · 23 g»
 * y «1½ cdta manzana · 8 g» se distinguían por una letra y parecían gramos mal
 * calculados. Si la medida no se sabe decir (`mediana`, `en_gajos`), la unidad
 * entera es la descripción y va como la trae la receta.
 */
function unidadDeLinea(linea: Pick<Line, 'cantidad' | 'unidad_display'>): {
  medida: string;
  detalle: string;
} {
  const unidad = unidadDecible(linea.unidad_display);
  if (unidad === null) return { medida: legible(linea.unidad_display), detalle: '' };
  const plural = unidad.siemprePlural === true || linea.cantidad > 1;
  const resto = linea.unidad_display.trim().slice(cabezaDeUnidad(linea.unidad_display).length).replace(/^[.,;:]/, '');
  const [, sufijo = '', cola = ''] = /^(?:_([^\s(+/]*))?\s*(.*)$/.exec(resto) ?? [];
  const detalle = [sufijo && `(${legible(sufijo)})`, legible(cola)].filter(Boolean).join(' ');
  return { medida: plural ? unidad.plural : unidad.singular, detalle: detalle && ` ${detalle}` };
}

export function unidadCompleta(linea: Pick<Line, 'cantidad' | 'unidad_display'>): string {
  const { medida, detalle } = unidadDeLinea(linea);
  return `${medida}${detalle}`;
}

/** «1½ tazas (cruda)»: la cantidad de una línea con su unidad. */
export function cantidadConUnidad(linea: Pick<Line, 'cantidad' | 'unidad_display'>): string {
  return `${formatCantidad(linea.cantidad)} ${unidadCompleta(linea)}`;
}

/** «200 g (escurrido) · 200 g» dice dos veces lo mismo. */
export function gramosRedundantes(linea: Pick<Line, 'cantidad' | 'unidad_display' | 'g_aprox'>): boolean {
  return `${formatCantidad(linea.cantidad)} ${unidadDeLinea(linea).medida}` === `${formatGramos(linea.g_aprox)} g`;
}

const ARTICULO = {
  m: { singular: 'el', plural: 'los' },
  f: { singular: 'la', plural: 'las' },
} as const;

/**
 * La cantidad de una línea dicha dentro de un paso: «los 400 g», «la taza»,
 * «las 3 cucharadas». El 1 no se escribe, porque «la 1 taza» no lo dice nadie.
 * `null` cuando la unidad no se sabe decir — ahí el paso no lleva la cantidad.
 */
export function cantidadEnPalabras(
  linea: Pick<Line, 'cantidad' | 'unidad_display'>,
  conArticulo = true,
): string | null {
  const unidad = unidadDecible(linea.unidad_display);
  if (unidad === null) return null;
  const plural = unidad.siemprePlural === true || linea.cantidad > 1;
  const palabra = plural ? unidad.plural : unidad.singular;
  // El 1 se calla solo cuando hay artículo que lo sostenga: «la taza», pero
  // «1 taza de arroz» — «taza de arroz» a secas no es español.
  const sinNumero = conArticulo && linea.cantidad === 1 && unidad.siemprePlural !== true;
  const numero = sinNumero ? '' : `${formatCantidad(linea.cantidad)} `;
  const cantidad = `${numero}${palabra}`;
  return conArticulo ? `${ARTICULO[unidad.genero][plural ? 'plural' : 'singular']} ${cantidad}` : cantidad;
}

/** Debajo del gramo el entero miente: 0,5 g de azafrán no es 1 g. */
export function formatGramos(gramos: number): string {
  return formatNumber(gramos, gramos > 0 && gramos < 1 ? 1 : 0);
}

export const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

export function currentMonth(): number {
  return new Date().getMonth() + 1;
}

/** La unidad de cantidades vive en el dominio; acá solo se reexporta para la UI. */
export { amountUnitOf as amountUnit } from '../../domain/units';

/** IC 1-10 → brotes 1-3 (bajo ≤4, medio 5-7, alto ≥8). */
export function icSprouts(ic: number): 1 | 2 | 3 {
  if (ic <= 4) return 1;
  if (ic <= 7) return 2;
  return 3;
}

/** Un porcentaje del día: con un decimal debajo de 10, donde el decimal todavía cambia la lectura. */
export function formatPorcentaje(porcentaje: number): string {
  return `${formatNumber(porcentaje, porcentaje < 10 ? 1 : 0)} %`;
}

/** Cómo se nombra la base de un aporte: «qué aporta una porción», «147 kcal por porción». */
export const MEDIDA_DE_BASE: Record<BaseDeMedida, { sujeto: string; por: string }> = {
  porcion: { sujeto: 'una porción', por: 'por porción' },
  '100g': { sujeto: 'cada 100 g', por: 'cada 100 g' },
};

/** Lo que alguien tipea como cantidad, con coma o con punto. `null` si no es un número, o si está a medio tipear. */
export function leerNumero(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : null;
}

/** Una cantidad para un campo: con coma y sin glifos de fracción, que no se pueden tipear. */
export function cantidadEditable(valor: number): string {
  return formatNumber(valor, Number.isInteger(valor) ? 0 : 2);
}
