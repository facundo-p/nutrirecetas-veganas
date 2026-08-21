import type { Line } from '../seed/schema';

/**
 * Criterio de sentido común para las cantidades escaladas. La regla de tres da
 * 0,8333 cebollas medianas y 208,33 g de lentejas: números que nadie puede
 * seguir en una cocina. Cada unidad se redondea según lo que significa, y la
 * cantidad redondeada manda: los gramos se derivan de ella, así lo que se lee,
 * lo que se cocina y lo que calcula la nutrición son el mismo número.
 */

export type FamiliaDeUnidad = 'peso' | 'medida' | 'pieza' | 'a_ojo';

/** `unidad_display` es texto libre (296 valores); la unidad real es la cabeza. */
const CABEZA = /^[^\s_(+/]+/;

const UNIDADES_DE_PESO = new Set(['g', 'gr', 'gramo', 'gramos', 'ml', 'cc']);

const MEDIDAS_DE_COCINA = new Set([
  'cda', 'cdas', 'cucharada', 'cucharadas',
  'cdta', 'cdtas', 'cucharadita', 'cucharaditas',
  'taza', 'tazas', 'vaso', 'vasos',
]);

/** Cantidades que la receta deja al ojo: partirlas en cuartos no significa nada. */
const CANTIDADES_A_OJO = new Set([
  'pizca', 'pizcas',
  'chorrito', 'chorritos', 'chorro', 'chorros',
  'gota', 'gotas',
  'puñado', 'puñados', 'punado', 'punados',
  'poquita', 'poquito',
  'cn',
]);

export function familiaDeUnidad(unidadDisplay: string): FamiliaDeUnidad {
  const cabeza = (CABEZA.exec(unidadDisplay.trim().toLowerCase())?.[0] ?? '').replace(/[.,;:]$/, '');
  if (UNIDADES_DE_PESO.has(cabeza)) return 'peso';
  if (MEDIDAS_DE_COCINA.has(cabeza)) return 'medida';
  if (CANTIDADES_A_OJO.has(cabeza)) return 'a_ojo';
  return 'pieza';
}

const CUARTO = 0.25;

function aMultiplo(valor: number, paso: number): number {
  return Math.round(valor / paso) * paso;
}

/**
 * El escalón de peso crece con la magnitud para que el error relativo se
 * mantenga acotado: de a 10 arriba de 100 g, de a 5 arriba de 50, y entero
 * hasta ahí. Debajo del gramo se conserva un decimal — un azafrán de 0,2 g
 * redondeado a entero desaparecería, y un cero es una afirmación falsa.
 *
 * El escalón solo entra cuando la cuenta dejó decimales: la mitad de 250 g es
 * 125 g, no 130. Sin esa salida, escalar por un factor exacto ensuciaba un
 * número que ya estaba limpio.
 */
function redondearPeso(bruto: number): number {
  const valor = aMultiplo(bruto, 0.001); // el error de coma flotante no es un decimal real
  if (valor <= 0) return 0;
  if (Number.isInteger(valor)) return valor;
  if (valor >= 100) return aMultiplo(valor, 10);
  if (valor >= 50) return aMultiplo(valor, 5);
  if (valor >= 1) return Math.round(valor);
  return Math.max(0.1, aMultiplo(valor, 0.1));
}

/**
 * Los cuartos importan cuando son pocas: nadie dice "10¾ hojas de albahaca".
 * De ahí la escalera — cuartos, medios, enteros — a medida que crece la cuenta.
 */
function redondearPieza(valor: number): number {
  if (valor <= 0) return 0;
  if (valor >= 10) return Math.round(valor);
  if (valor >= 3) return aMultiplo(valor, 0.5);
  return Math.max(CUARTO, aMultiplo(valor, CUARTO));
}

export function redondearCantidad(valor: number, familia: FamiliaDeUnidad): number {
  if (familia === 'peso') return redondearPeso(valor);
  if (familia === 'a_ojo') return valor <= 0 ? 0 : Math.max(1, Math.round(valor));
  if (familia === 'medida') return valor <= 0 ? 0 : Math.max(CUARTO, aMultiplo(valor, CUARTO));
  return redondearPieza(valor);
}

export function redondearLinea(escalada: Line, base: Line): Line {
  const cantidad = redondearCantidad(escalada.cantidad, familiaDeUnidad(base.unidad_display));
  const gramosDerivados =
    base.cantidad > 0 ? base.g_aprox * (cantidad / base.cantidad) : escalada.g_aprox;
  return { ...escalada, cantidad, g_aprox: redondearPeso(gramosDerivados) };
}
