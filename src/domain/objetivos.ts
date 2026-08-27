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
