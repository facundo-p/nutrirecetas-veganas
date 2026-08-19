import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Carga de los JSON crudos de `.artifacts/` (read-only, jamás se editan).
 * Tipos "raw" deliberadamente laxos: la forma final la garantiza el Zod de la
 * semilla en validate.ts; acá solo se tipa lo que el transformador necesita tocar.
 */

const ARTIFACTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.artifacts');

export interface RawLine {
  ingrediente_id: string;
  cantidad: number;
  unidad: string;
  g_aprox: number;
  funcion?: string;
  imprescindible?: boolean;
  sustitutos?: string[];
  nota?: string;
}

export interface RawRecipe {
  id: string;
  nombre: string;
  tipo?: string;
  porciones: number | string;
  tiempo_prep_min: number;
  tiempo_coccion_min: number;
  dificultad: string;
  estado?: string;
  confianza?: number;
  estado_sugerido?: string;
  confianza_adaptacion?: number;
  fuente?: Record<string, unknown>;
  ingredientes: RawLine[];
  pasos: string[];
  secretos_chef?: string[];
  guarda?: { heladera_dias?: number; freezer?: boolean | string };
  reglas_disparadas?: string[];
  utensilio_recomendado?: string[];
  perfil_nutricional_porcion_aprox?: unknown; // descartado (auditoría §2.4)
  variante_de?: string;
  familia?: string;
  usa_preparados?: string[];
  indulgente?: boolean;
  candidata_clasica?: boolean;
  objetivo?: string;
  objetivo_nutricional?: string;
  nota?: string;
}

export type RawNutrientValue =
  | number
  | null // null explícito = sin dato (se omite; la cobertura lo reporta)
  | { min: number; max: number; tipico?: number; nota?: string };

export interface RawIngredient {
  id: string;
  nombre: string;
  sinonimos?: string[];
  categoria: string;
  base?: string;
  kcal?: RawNutrientValue;
  nutrientes?: Record<string, RawNutrientValue>;
  destacados?: string[];
  confianza: number;
  fuentes?: string[];
  notas?: string;
  origen?: string;
  sustituto_local?: string;
}

export interface RawNutrient {
  id: string;
  nombre: string;
  grupo: string;
  unidad: string;
  rda: Record<string, number>;
  ajuste_vegano?: { factor?: number; descripcion: string; confianza?: number; fuentes?: unknown };
  ul?: number | null;
  ul_nota?: string;
  ventana_evaluacion: string;
  ventana_nota?: string;
  confianza_rda: number;
  fuentes?: unknown;
  notas?: Array<{ texto: string; confianza?: number; fuentes?: unknown }>;
}

export interface RawRule {
  id: string;
  tipo: string;
  condicion: Record<string, unknown>;
  mensaje: string;
  confianza: number;
  fuentes?: unknown;
  confianza_mate?: unknown;
}

export interface RawData {
  sets: { 1: RawRecipe[]; 2: RawRecipe[]; 3: RawRecipe[]; P: RawRecipe[] };
  ingredientes: RawIngredient[];
  nutrientes: RawNutrient[];
  reglas: RawRule[];
  equivalencias: Record<string, unknown>;
  estacionalidad: Array<Record<string, unknown>>;
  conservacion: Array<Record<string, unknown>>;
  glosario: Array<Record<string, unknown>>;
  utensilios: Record<string, unknown>;
}

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(ARTIFACTS_DIR, file), 'utf8')) as T;
}

export function loadRawData(): RawData {
  const set1 = loadJson<{ recetas: RawRecipe[] }>('recetas.json');
  const set2 = loadJson<{ recetas: RawRecipe[] }>('recetas-set2.json');
  const set3 = loadJson<{ recetas: RawRecipe[] }>('recetas-set3.json');
  const setP = loadJson<{ recetas: RawRecipe[] }>('recetas-personales.json');
  const ingredientes = loadJson<{ ingredientes: RawIngredient[] }>('ingredientes-v1.3.json');
  const nutrientes = loadJson<{ nutrientes: RawNutrient[]; reglas_combinacion: RawRule[] }>(
    'nutrientes-veganos-v1.1.json',
  );

  return {
    sets: { 1: set1.recetas, 2: set2.recetas, 3: set3.recetas, P: setP.recetas },
    ingredientes: ingredientes.ingredientes,
    nutrientes: nutrientes.nutrientes,
    reglas: nutrientes.reglas_combinacion,
    equivalencias: loadJson('equivalencias.json'),
    estacionalidad: loadJson<{ items: Array<Record<string, unknown>> }>('estacionalidad.json').items,
    conservacion: loadJson<{ items: Array<Record<string, unknown>> }>('conservacion.json').items,
    glosario: loadJson<{ terminos: Array<Record<string, unknown>> }>('glosario.json').terminos,
    utensilios: loadJson('utensilios.json'),
  };
}
