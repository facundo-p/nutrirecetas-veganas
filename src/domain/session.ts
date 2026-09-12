import type { SeedIndex } from '../seed';
import type { LineRef, Recipe, Seed } from '../seed/schema';
import { fuerteDeAporte, porcentajesDeAporte, type NutrienteDeBarra } from './aporte';
import { nutricionConLineas, type NutritionSource, type RecipeNutrition } from './nutrition';
import type { ObjetivosDeReferencia } from './objetivos';
import { escalarLineas } from './scaling';

/**
 * La sesión de cocina: las líneas de la receta tal como van a ir a la olla hoy,
 * después de desmarcar lo que no hay, sustituir lo que se cambia y agregar lo
 * que se suma. La nutrición se recalcula sobre las líneas efectivas, así que se
 * mueve en vivo mientras se personaliza.
 */

export interface LineaSesion {
  /** Identifica la línea dentro de la sesión (las refs pueden repetirse). */
  key: string;
  ref: LineRef;
  nombre: string;
  cantidad: number;
  unidad_display: string;
  g_aprox: number;
  activa: boolean;
  imprescindible?: boolean;
  funcion?: string;
  sustitutos: Array<{ tipo: 'id' | 'texto'; valor: string }>;
  /** El de la receta, que un sustituto hereda. Lo agregado no entra en ningún paso. */
  paso: number | null;
  /** Si se sustituyó, la referencia original queda registrada para el diario. */
  original?: { ref: LineRef; nombre: string };
  agregada?: true;
}

function nombreDe(ref: LineRef, seed: Seed): string {
  if (ref.tipo === 'ingrediente') {
    return seed.ingredientes.find((i) => i.id === ref.id)?.nombre ?? ref.id;
  }
  return seed.recetas.find((r) => r.id === ref.id)?.nombre ?? ref.id;
}

export function lineasIniciales(recipe: Recipe, factor: number, seed: Seed): LineaSesion[] {
  return escalarLineas(recipe.lineas, factor).map((linea, i) => ({
    key: `${i}`,
    ref: linea.ref,
    nombre: nombreDe(linea.ref, seed),
    cantidad: linea.cantidad,
    unidad_display: linea.unidad_display,
    g_aprox: linea.g_aprox,
    activa: true,
    ...(linea.imprescindible !== undefined ? { imprescindible: linea.imprescindible } : {}),
    ...(linea.funcion !== undefined ? { funcion: linea.funcion } : {}),
    sustitutos: linea.sustitutos,
    paso: linea.paso,
  }));
}

/**
 * Desmarcar un ingrediente imprescindible no se bloquea, se explica: la receta
 * dice para qué está, y esa razón es el mejor argumento.
 */
export function advertenciaDesmarcar(linea: LineaSesion): string | null {
  if (!linea.imprescindible) return null;
  return linea.funcion
    ? `${linea.nombre} es imprescindible acá: es ${linea.funcion}. Sin eso la receta cambia de plato.`
    : `${linea.nombre} es imprescindible en esta receta: sin eso cambia de plato.`;
}

export function sustituirLinea(linea: LineaSesion, nuevaRef: LineRef, seed: Seed): LineaSesion {
  return {
    ...linea,
    ref: nuevaRef,
    nombre: nombreDe(nuevaRef, seed),
    original: linea.original ?? { ref: linea.ref, nombre: linea.nombre },
  };
}

export function lineaAgregada(ref: LineRef, gramos: number, seed: Seed, key: string): LineaSesion {
  return {
    key,
    ref,
    nombre: nombreDe(ref, seed),
    cantidad: gramos,
    unidad_display: 'g',
    g_aprox: gramos,
    activa: true,
    sustitutos: [],
    paso: null,
    agregada: true,
  };
}

/** Nutrición de lo que efectivamente va a la olla: solo las líneas activas. */
export function nutricionSesion(
  lineas: LineaSesion[],
  recipe: Recipe,
  porciones: number,
  source: NutritionSource,
): RecipeNutrition {
  const activas = lineas
    .filter((l) => l.activa)
    .map((l) => ({
      ref: l.ref,
      cantidad: l.cantidad,
      unidad_display: l.unidad_display,
      g_aprox: l.g_aprox,
      sustitutos: [],
      paso: l.paso,
    }));
  return nutricionConLineas(recipe, activas, porciones, source);
}

/**
 * El color de cada paso: el nutriente que más cubre lo que entra en él, tal
 * como va a la olla hoy. Se mide la olla entera porque el que gana no depende
 * de en cuántas porciones se sirva. `null`: no entra nada, o nada de lo que
 * entra trae uno de los once con dato.
 */
export function nutrientesDeLosPasos(
  lineas: LineaSesion[],
  recipe: Recipe,
  idx: SeedIndex,
  objetivos: ObjetivosDeReferencia,
): Array<NutrienteDeBarra | null> {
  return recipe.pasos.map((_, paso) => {
    const { por_nutriente } = nutricionSesion(lineas.filter((l) => l.paso === paso), recipe, 1, idx);
    return fuerteDeAporte(porcentajesDeAporte(por_nutriente, objetivos, idx.seed.nutrientes))?.nutriente ?? null;
  });
}

export interface VariacionDetectada {
  tipo: 'desmarcado' | 'sustituido' | 'agregado';
  nombre: string;
  detalle?: string;
}

/** Qué se cambió respecto de la receta original: va al registro de la cocción. */
export function variacionesDe(lineas: LineaSesion[]): VariacionDetectada[] {
  const variaciones: VariacionDetectada[] = [];
  for (const linea of lineas) {
    if (!linea.activa) {
      variaciones.push({ tipo: 'desmarcado', nombre: linea.original?.nombre ?? linea.nombre });
      continue;
    }
    if (linea.original) {
      variaciones.push({
        tipo: 'sustituido',
        nombre: linea.original.nombre,
        detalle: `por ${linea.nombre}`,
      });
    }
    if (linea.agregada) {
      variaciones.push({ tipo: 'agregado', nombre: linea.nombre, detalle: `${Math.round(linea.g_aprox)} g` });
    }
  }
  return variaciones;
}
