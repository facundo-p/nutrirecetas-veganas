import type { Perfil } from '../db/schema';
import type { Nutrient } from '../seed/schema';
import { midpoint } from './interval';
import { hasReportableValue, type NutrientResult } from './nutrition';
import { objetivosDelPerfil, type ObjetivoNutriente } from './profile';
import { genericReferenceRda } from './rda';
import { amountUnitOf } from './units';

/**
 * La dosis diaria contra la que se informa un porcentaje. Es el único lugar del
 * que la UI saca objetivos: con perfil son los tuyos, sin perfil los de una
 * referencia adulta genérica, y la misma forma en los dos casos — así ninguna
 * pantalla tiene que preguntar si hay perfil antes de mostrar un número.
 *
 * `fuente` existe para poder decirlo. Un porcentaje que no aclara contra qué se
 * mide es un número sin significado, y este proyecto no muestra esos.
 */

export type FuenteDeObjetivo = 'perfil' | 'referencia-generica';

export interface ObjetivosDeReferencia {
  fuente: FuenteDeObjetivo;
  porNutriente: Map<string, ObjetivoNutriente>;
}

function objetivosGenericos(nutrientes: Nutrient[]): Map<string, ObjetivoNutriente> {
  const objetivos = new Map<string, ObjetivoNutriente>();
  for (const nutriente of nutrientes) {
    objetivos.set(nutriente.id, {
      nutriente_id: nutriente.id,
      nombre: nutriente.nombre,
      valor: genericReferenceRda(nutriente),
      unidad: amountUnitOf(nutriente.clave_ingrediente),
    });
  }
  return objetivos;
}

export function objetivosDeReferencia(
  perfil: Perfil | null,
  nutrientes: Nutrient[],
  hoy: Date,
): ObjetivosDeReferencia {
  if (perfil === null) {
    return { fuente: 'referencia-generica', porNutriente: objetivosGenericos(nutrientes) };
  }
  return { fuente: 'perfil', porNutriente: objetivosDelPerfil(perfil, nutrientes, hoy) };
}

/**
 * Qué porcentaje del objetivo aporta un resultado. **null** cuando no hay nada
 * que afirmar: sin dato reportable el invariante 5 pide decir "sin datos", no
 * pintar un 0 % que se lee como "no tiene".
 */
export function porcentajeDeObjetivo(
  resultado: NutrientResult | undefined,
  objetivo: ObjetivoNutriente | undefined,
): number | null {
  if (resultado === undefined || objetivo === undefined) return null;
  if (!hasReportableValue(resultado)) return null;
  if (objetivo.valor <= 0) return null;
  return (midpoint(resultado.intervalo) / objetivo.valor) * 100;
}

/**
 * Como `porcentajeDeObjetivo`, pero para cuando el número viaja **sin su banda
 * al lado**: el motivo de una recomendación, el filtro "rica en". Ahí no se
 * puede afirmar un punto medio cuyo rango arranca en cero.
 *
 * "El punto medio solo miente si escondés la banda" es principio del proyecto
 * desde la Fase 0. En la tabla de la receta y en el ranking del nutriente la
 * banda está a la vista, así que el punto medio no miente. En un motivo suelto
 * no hay dónde ponerla, y entonces sí.
 *
 * El caso que lo destapó: "aporta el 265 % de la dosis de vitamina B12" sobre
 * un intervalo **de 0 a 12,72 µg**. El 265 % es el punto medio de un rango que
 * incluye "no tiene nada" — que es exactamente lo que el invariante 6 obliga a
 * advertir de la levadura nutricional.
 *
 * No es un umbral de cobertura: se probó y era falso en las dos puntas. Una
 * cobertura baja solo puede subestimar (lo que falta suma, nunca resta), así
 * que dejaba afuera afirmaciones perfectas —21,64 g de proteína medidos exactos
 * sobre el 46 % del plato— y dejaba pasar bandas que tocan el cero con el 85 %.
 */
export function porcentajeAfirmableSolo(
  resultado: NutrientResult | undefined,
  objetivo: ObjetivoNutriente | undefined,
): number | null {
  if (resultado !== undefined && resultado.intervalo.min <= 0) return null;
  return porcentajeDeObjetivo(resultado, objetivo);
}
