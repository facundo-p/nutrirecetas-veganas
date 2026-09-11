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

/** Lo que alguien tipea como cantidad, con coma o con punto. `null` si no es un número, o si está a medio tipear. */
export function leerNumero(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : null;
}

/** Una cantidad para un campo: con coma y sin glifos de fracción, que no se pueden tipear. */
export function cantidadEditable(valor: number): string {
  return formatNumber(valor, Number.isInteger(valor) ? 0 : 2);
}
