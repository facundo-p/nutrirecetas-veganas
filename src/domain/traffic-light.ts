import type { Coccion, Consumo, Perfil } from '../db/schema';
import type { Interval, Nutrient } from '../seed/schema';
import { add, interval, midpoint, scale } from './interval';
import { hasReportableValue, type NutrientResult } from './nutrition';
import { objetivosDelPerfil, type ObjetivoNutriente } from './profile';
import { diasDeVentana, estaEnVentana, ventanaDe } from './windows';

/**
 * El semáforo: cómo viene cada nutriente en SU ventana. Nunca evalúa una comida
 * suelta (invariante 3), nunca comunica solo con color (la UI siempre pone
 * ícono + texto), y cuando no hay con qué afirmar dice "sin datos" en vez de
 * pintar un rojo falso.
 */

export type EstadoSemaforo =
  | 'cubierto'
  | 'parcial'
  | 'insuficiente'
  | 'cubierto_por_suplemento'
  | 'sin_datos';

export interface EstadoNutriente {
  nutriente_id: string;
  nombre: string;
  ventana: 'dia' | 'semana';
  estado: EstadoSemaforo;
  /** El punto medio decide el estado, pero la banda cruza un umbral. */
  al_borde: boolean;
  porcentaje: number;
  consumido: Interval;
  objetivo: number;
  unidad: string;
  objetivo_aproximado: boolean;
  origen_objetivo: ObjetivoNutriente['origen'];
  exceso_ul: boolean;
}

const UMBRAL_CUBIERTO = 90;
const UMBRAL_PARCIAL = 60;

function estadoPorPorcentaje(pct: number): EstadoSemaforo {
  if (pct >= UMBRAL_CUBIERTO) return 'cubierto';
  if (pct >= UMBRAL_PARCIAL) return 'parcial';
  return 'insuficiente';
}

/**
 * Suma lo consumido en una ventana. Usa la nutrición **congelada** en cada
 * cocción, no la semilla: el historial no cambia porque mañana cambie una receta.
 */
interface Acumulador {
  intervalo: Interval;
  /** Σ (cobertura × porciones) de los aportes que sí tenían dato. */
  coberturaPonderada: number;
  porcionesConDato: number;
  ic: number | null;
}

function acumular(previo: Acumulador | undefined, aporte: NutrientResult, porciones: number): Acumulador {
  const base = previo ?? { intervalo: interval(0), coberturaPonderada: 0, porcionesConDato: 0, ic: null };
  if (!hasReportableValue(aporte)) return base;
  return {
    intervalo: add(base.intervalo, scale(aporte.intervalo, porciones)),
    coberturaPonderada: base.coberturaPonderada + aporte.cobertura_pct * porciones,
    porcionesConDato: base.porcionesConDato + porciones,
    // el IC del conjunto es el del dato más flojo que lo compone
    ic: base.ic === null ? aporte.ic : aporte.ic === null ? base.ic : Math.min(base.ic, aporte.ic),
  };
}

function cerrar(a: Acumulador | undefined): NutrientResult | undefined {
  if (!a || a.porcionesConDato === 0) return undefined;
  return {
    intervalo: a.intervalo,
    cobertura_pct: a.coberturaPonderada / a.porcionesConDato,
    ic: a.ic,
  };
}

export interface ConsumoAcumulado {
  por_nutriente: Record<string, NutrientResult>;
  kcal: NutrientResult | undefined;
  /** Porciones registradas en la ventana: 0 significa "no registraste nada". */
  porciones: number;
}

export function consumoEnVentana(
  consumos: Consumo[],
  cocciones: Map<number, Coccion>,
  ventana: { desde: Date; hasta: Date },
): ConsumoAcumulado {
  const acumulado: Record<string, Acumulador> = {};
  let kcal: Acumulador | undefined;
  let porciones = 0;

  for (const consumo of consumos) {
    if (!estaEnVentana(consumo.fecha, ventana)) continue;
    const coccion = cocciones.get(consumo.coccion_id);
    if (!coccion) continue;
    const nutricion = coccion.nutricion_porcion;

    for (const [clave, aporte] of Object.entries(nutricion.por_nutriente)) {
      acumulado[clave] = acumular(acumulado[clave], aporte, consumo.porciones);
    }
    kcal = acumular(kcal, nutricion.kcal, consumo.porciones);
    porciones += consumo.porciones;
  }

  const por_nutriente: Record<string, NutrientResult> = {};
  for (const [clave, a] of Object.entries(acumulado)) {
    const resultado = cerrar(a);
    if (resultado) por_nutriente[clave] = resultado;
  }
  return { por_nutriente, kcal: cerrar(kcal), porciones };
}

export interface EntradaSemaforo {
  perfil: Perfil;
  nutrientes: Nutrient[];
  consumos: Consumo[];
  cocciones: Map<number, Coccion>;
  hoy: Date;
}

export function semaforo({ perfil, nutrientes, consumos, cocciones, hoy }: EntradaSemaforo): EstadoNutriente[] {
  const objetivos = objetivosDelPerfil(perfil, nutrientes, hoy);
  // una sola pasada por ventana: día y semana se calculan una vez cada una
  const acumuladoPorVentana = {
    dia: consumoEnVentana(consumos, cocciones, ventanaDe('dia', hoy)),
    semana: consumoEnVentana(consumos, cocciones, ventanaDe('semana', hoy)),
  };

  return nutrientes.map((nutriente) => {
    const objetivo = objetivos.get(nutriente.id)!;
    const acumulado = acumuladoPorVentana[nutriente.ventana];
    const resultado = acumulado.por_nutriente[nutriente.clave_ingrediente];
    const objetivoVentana = objetivo.valor * diasDeVentana(nutriente.ventana);

    const consumido = resultado?.intervalo ?? interval(0);
    const puntoMedio = midpoint(consumido);
    const porcentaje = objetivoVentana === 0 ? 0 : (puntoMedio / objetivoVentana) * 100;

    // Sin registros, o con registros que no dicen nada de este nutriente, no hay
    // nada que afirmar: "sin datos" antes que un rojo falso.
    const estado: EstadoSemaforo = objetivo.cubierto_por_suplemento
      ? 'cubierto_por_suplemento'
      : resultado === undefined
        ? 'sin_datos'
        : estadoPorPorcentaje(porcentaje);

    const pctMin = objetivoVentana === 0 ? 0 : (consumido.min / objetivoVentana) * 100;
    const pctMax = objetivoVentana === 0 ? 0 : (consumido.max / objetivoVentana) * 100;
    const al_borde =
      estado !== 'sin_datos' &&
      estado !== 'cubierto_por_suplemento' &&
      estadoPorPorcentaje(pctMin) !== estadoPorPorcentaje(pctMax);

    // El UL solo alerta si aplica a la comida: `ul_nota` marca los que son solo
    // de suplementos (magnesio, invariante 7).
    const exceso_ul =
      nutriente.ul !== null && nutriente.ul_nota === undefined && puntoMedio > nutriente.ul * diasDeVentana(nutriente.ventana);

    return {
      nutriente_id: nutriente.id,
      nombre: nutriente.nombre,
      ventana: nutriente.ventana,
      estado,
      al_borde,
      porcentaje,
      consumido,
      objetivo: objetivoVentana,
      unidad: objetivo.unidad,
      objetivo_aproximado: objetivo.aproximada === true,
      origen_objetivo: objetivo.origen,
      exceso_ul,
    };
  });
}
