import type { LineRef, Recipe, Seed } from '../seed/schema';
import { computeNutrition, type NutritionSource, type RecipeNutrition } from './nutrition';
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
    agregada: true,
  };
}

/** Nutrición de lo que efectivamente va a la olla: solo las líneas activas. */
export function nutricionSesion(
  lineas: LineaSesion[],
  recipe: Recipe,
  porciones: number,
  source: NutritionSource & { seed?: Seed },
): RecipeNutrition {
  const sintetica: Recipe = {
    ...recipe,
    id: `${recipe.id}__sesion`,
    porciones_num: porciones,
    lineas: lineas
      .filter((l) => l.activa)
      .map((l) => ({
        ref: l.ref,
        cantidad: l.cantidad,
        unidad_display: l.unidad_display,
        g_aprox: l.g_aprox,
        sustitutos: [],
      })),
  };
  const recipeById = new Map(source.recipeById);
  recipeById.set(sintetica.id, sintetica);
  return computeNutrition(sintetica.id, { ...source, recipeById });
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
