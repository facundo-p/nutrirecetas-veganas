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

/**
 * Unidad para CANTIDADES absolutas, derivada de la clave del ingrediente.
 * La `unidad` del catálogo expresa la RDA (proteína: "g/kg") y no sirve para
 * rotular un valor por porción.
 */
export function amountUnit(clave: string): string {
  if (clave === 'vita_ug_rae') return 'µg RAE';
  if (clave.endsWith('_ug')) return 'µg';
  if (clave.endsWith('_mg')) return 'mg';
  return 'g';
}

/** Dificultad → cantidad de llamas (1-3) según el enum ordenado de 5. */
export function difficultyFlames(dificultad: string): 1 | 2 | 3 {
  if (dificultad === 'trivial' || dificultad === 'muy fácil') return 1;
  if (dificultad === 'fácil' || dificultad === 'media') return 2;
  return 3;
}

/** IC 1-10 → brotes 1-3 (bajo ≤4, medio 5-7, alto ≥8). */
export function icSprouts(ic: number): 1 | 2 | 3 {
  if (ic <= 4) return 1;
  if (ic <= 7) return 2;
  return 3;
}
