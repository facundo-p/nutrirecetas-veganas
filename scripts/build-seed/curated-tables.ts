import type { IngredientCategory } from '../../src/seed/schema';

/**
 * TODAS las decisiones de datos tomadas a mano viven acá, en un solo lugar,
 * para que Facu las revise en el gate de datos de Fase 1
 * (docs/plan/fase1-gate-datos.md). Cada `estimada: true` es una propuesta,
 * no un dato del recetario.
 */

// ---------- T1: porciones string → número (34 recetas del set P) ----------

export interface PortionsEntry {
  /** null = sin porciones definidas: la nutrición se muestra por 100 g */
  porciones_num: number | null;
  estimada: boolean;
  base?: string;
}

export const CURATED_PORTIONS: Record<string, PortionsEntry> = {
  // preparados: su nutrición va por 100 g vía rendimiento_g
  p01: { porciones_num: null, estimada: false, base: 'preparado' },
  p02: { porciones_num: null, estimada: false, base: 'preparado' },
  p03: { porciones_num: null, estimada: false, base: 'preparado' },
  p04: { porciones_num: null, estimada: false, base: 'preparado' },
  p05: { porciones_num: null, estimada: false, base: 'preparado' },
  p06: { porciones_num: null, estimada: false, base: 'preparado' },
  p07: { porciones_num: null, estimada: false, base: 'preparado' },
  p16: { porciones_num: null, estimada: false, base: 'preparado' },
  p26: { porciones_num: null, estimada: false, base: 'preparado' },
  p27: { porciones_num: null, estimada: false, base: 'preparado' },
  // número explícito entre paréntesis = confiable
  p19: { porciones_num: 6, estimada: false, base: 'bandeja 28x22 (6 porciones)' },
  p22: { porciones_num: 6, estimada: false, base: '1 tarta mediana (6 porciones)' },
  p23: { porciones_num: 9, estimada: false, base: 'punto medio de "8-10 porciones fiesta"' },
  p31: { porciones_num: 10, estimada: false, base: 'molde 22-25 cm (10 porciones)' },
  p32: { porciones_num: 12, estimada: false, base: '1 placa (12)' },
  p33: { porciones_num: 12, estimada: false, base: '1 placa (12)' },
  p37: { porciones_num: 9, estimada: false, base: 'fuente chica (9)' },
  p39: { porciones_num: 8, estimada: false, base: 'molde 28 cm (8)' },
  p42: { porciones_num: 12, estimada: false, base: '1 placa (12)' },
  p44: { porciones_num: 5, estimada: false, base: '5 bollos (1 pizza c/u)' },
  // propuestas para revisar con Facu
  p10: { porciones_num: 4, estimada: false, base: '~8 milanesas, 2 por porción (Facu)' },
  p11: { porciones_num: null, estimada: false, base: '"libre": se muestra por 100 g (Facu)' },
  p17: { porciones_num: 3, estimada: false, base: '~15 unidades, 5 por porción (Facu)' },
  p18: { porciones_num: 3, estimada: false, base: '3 rolls, 1 por porción (Facu)' },
  p21: { porciones_num: 4, estimada: false, base: '~7 medallones, 2 por porción (Facu)' },
  p28: { porciones_num: 2, estimada: false, base: '4 panqueques, 2 por porción (Facu)' },
  p29: { porciones_num: 8, estimada: false, base: '1 budinera = 16 rodajas, 2 por porción (Facu)' },
  p30: { porciones_num: 8, estimada: false, base: '1 budinera = 16 rodajas, 2 por porción (Facu)' },
  p34: { porciones_num: 8, estimada: false, base: '1 molde chico = 8 brownies (Facu)' },
  p36: { porciones_num: 12, estimada: false, base: 'molde 24 cm = 12 porciones (Facu)' },
  p38: { porciones_num: 6, estimada: false, base: '~12 bocaditos, 2 por porción (Facu)' },
  p41: { porciones_num: 8, estimada: false, base: '1 budinera = 16 rodajas, 2 por porción (Facu)' },
  p43: { porciones_num: 8, estimada: false, base: '1 budinera = 16 rodajas, 2 por porción (Facu)' },
  p45: { porciones_num: null, estimada: false, base: '1 frasco grande: se muestra por 100 g (Facu)' },
};

// ---------- T2: rendimiento en gramos de los 11 preparados ----------

export interface YieldEntry {
  rendimiento_g: number;
  estimada: boolean;
  base: string;
}

export const CURATED_YIELDS: Record<string, YieldEntry> = {
  p01: { rendimiento_g: 1800, estimada: false, base: '"~1.8 L", densidad ≈ leche' },
  p02: { rendimiento_g: 500, estimada: false, base: '"~500 ml"' },
  p03: { rendimiento_g: 200, estimada: false, base: '"~200 g"' },
  p04: { rendimiento_g: 500, estimada: false, base: '"~500 g"' },
  p05: { rendimiento_g: 350, estimada: false, base: '"~350 g"' },
  p06: { rendimiento_g: 480, estimada: false, base: '530 g de insumos menos merma de horno (confirmado)' },
  p07: { rendimiento_g: 370, estimada: false, base: 'suma de insumos, masa cruda (confirmado)' },
  p08: { rendimiento_g: 750, estimada: false, base: '375 g de masa de seitán + absorción de caldo (confirmado)' },
  p16: { rendimiento_g: 650, estimada: false, base: '322 g de insumos + hidratación de la texturizada (Facu)' },
  p26: { rendimiento_g: 700, estimada: false, base: '"~700 g"' },
  p27: { rendimiento_g: 500, estimada: false, base: '"~500 g"' },
};

/** p08 (bifecitos de seitán) es preparado de facto: p12 y p20 lo consumen. */
export const DE_FACTO_PREPARADOS = ['p08'];

// ---------- T3: líneas fantasma → referencia a receta ----------

export interface PhantomLineEntry {
  receta_id: string;
  ingrediente_id: string;
  /** `unidad` original: desambigua si la receta repite el ingrediente */
  unidad: string;
  ref_receta_id: string;
  flag_gate: boolean;
  nota?: string;
  /** ids de ingrediente que quedan como sustituto de la línea migrada (mismo peso) */
  sustitutos_id?: string[];
}

export const PHANTOM_LINES: PhantomLineEntry[] = [
  { receta_id: 'p12', ingrediente_id: 'gluten_trigo', unidad: 'g_seitan_en_cubos', ref_receta_id: 'p08', flag_gate: false, nota: 'seitán ya cocido' },
  { receta_id: 'p19', ingrediente_id: 'mani', unidad: 'g_como_queso_P04', ref_receta_id: 'p04', flag_gate: false },
  { receta_id: 'p20', ingrediente_id: 'gluten_trigo', unidad: 'g_seitan_SALSA', ref_receta_id: 'p08', flag_gate: false },
  {
    receta_id: 'p31',
    ingrediente_id: 'margarina',
    unidad: 'g',
    ref_receta_id: 'p03',
    flag_gate: false,
    nota: 'Facu usa su manteca vegana (p03); la margarina comprada sirve igual, al mismo peso',
    sustitutos_id: ['margarina'],
  },
  { receta_id: 'p34', ingrediente_id: 'porotos_negros', unidad: 'taza_de_crema_P26_sin_aceite_coco', ref_receta_id: 'p26', flag_gate: false },
  { receta_id: 'p39', ingrediente_id: 'porotos_alubia', unidad: 'g_como_crema_P27', ref_receta_id: 'p27', flag_gate: false },
  {
    receta_id: 'p39',
    ingrediente_id: 'margarina',
    unidad: 'g_masa + 150 crumble',
    ref_receta_id: 'p03',
    flag_gate: false,
    nota: 'ídem p31: la margarina comprada sirve igual, al mismo peso',
    sustitutos_id: ['margarina'],
  },
];

/**
 * Ingredientes que aportan cero de verdad, no "sin dato" (decisión de Facu en el
 * gate): el agua se cuenta como cobertura completa con valor 0, así una sopa no
 * reporta 17 % de cobertura por el peso del líquido. El caldo NO entra: depende
 * de con qué se hizo, así que sigue siendo "sin datos".
 */
export const APORTE_NULO_IDS = ['agua', 'agua_helada'];

/** Líneas que el dataset omite y hay que agregar (la tarta p22 no lista su masa). */
export interface AddedLineEntry {
  receta_id: string;
  ref_receta_id: string;
  cantidad: number;
  unidad_display: string;
  g_aprox: number;
  funcion?: string;
  nota?: string;
  flag_gate: boolean;
}

export const ADDED_LINES: AddedLineEntry[] = [
  {
    receta_id: 'p22',
    ref_receta_id: 'p07',
    cantidad: 1,
    unidad_display: 'masa entera',
    g_aprox: 370,
    funcion: 'base de la tarta',
    nota: 'línea agregada en la ingesta: el dataset lista solo el relleno',
    flag_gate: true,
  },
];

/**
 * usa_preparados que quedan como enlace navegacional (sin tocar líneas):
 * p10→p01 consume el okara (subproducto), no la leche; p30→p02 ya desagrega
 * la leche de coco en agua+coco rallado; p44→p06 el queso va sobre la pizza
 * armada, no dentro de la masa.
 */
export const NAV_ONLY_PREPARADOS: Array<{ receta_id: string; preparado_id: string }> = [
  { receta_id: 'p10', preparado_id: 'p01' },
  { receta_id: 'p30', preparado_id: 'p02' },
  { receta_id: 'p44', preparado_id: 'p06' },
];

// ---------- T6: conceptos usados por reglas R que no son ids/categorías reales ----------

export interface ConceptEntry {
  ids?: string[];
  categorias?: IngredientCategory[];
  calificador?: string;
}

export const RULE_CONCEPTS: Record<string, ConceptEntry> = {
  cereal_integral: {
    ids: ['avena', 'arroz_integral', 'harina_integral', 'burgol', 'cebada', 'quinoa', 'trigo_sarraceno'],
  },
  tomate_cocido: { ids: ['tomate', 'tomate_triturado', 'salsa_tomate', 'extracto_tomate'], calificador: 'cocido' },
  zanahoria_cocida: { ids: ['zanahoria'], calificador: 'cocido' },
  castana_para: { ids: ['castanas_para'] },
  lino_entero: { ids: ['lino'], calificador: 'entero' },
};

// ---------- T7: items de conservación que son grupos, no ids ----------

export type StorageMapping =
  | { tipo: 'ids'; ids: string[] }
  | { tipo: 'categorias'; categorias: IngredientCategory[] }
  | { tipo: 'estado'; descripcion: string };

export const STORAGE_GROUPS: Record<string, StorageMapping> = {
  legumbres_secas: { tipo: 'categorias', categorias: ['legumbre'] },
  legumbres_cocidas: { tipo: 'categorias', categorias: ['legumbre'] },
  granos_pastas_arroz: { tipo: 'categorias', categorias: ['cereal', 'pseudocereal'] },
  arroz_granos_cocidos: { tipo: 'categorias', categorias: ['cereal', 'pseudocereal'] },
  azucar_sal_cacao: { tipo: 'ids', ids: ['azucar', 'azucar_impalpable', 'azucar_mascabo', 'sal_yodada', 'cacao_amargo'] },
  especias_molidas: { tipo: 'categorias', categorias: ['especia'] },
  especias_enteras: { tipo: 'categorias', categorias: ['especia'] },
  fruta_seca: { tipo: 'categorias', categorias: ['fruta_seca'] },
  frutos_secos: { tipo: 'categorias', categorias: ['fruto_seco'] },
  semillas_peladas: { tipo: 'categorias', categorias: ['semilla'] },
  algas: { tipo: 'categorias', categorias: ['alga'] },
  lino_entero: { tipo: 'ids', ids: ['lino'] },
  lino_molido: { tipo: 'ids', ids: ['lino'] },
  tofu_abierto: { tipo: 'ids', ids: ['tofu_firme'] },
  tempeh_abierto: { tipo: 'ids', ids: ['tempeh'] },
  bebida_vegetal_abierta: { tipo: 'ids', ids: ['bebida_vegetal_fortificada', 'bebida_soja'] },
  leche_coco_abierta: { tipo: 'ids', ids: ['leche_coco'] },
  extracto_tomate_abierto: { tipo: 'ids', ids: ['extracto_tomate'] },
  hierbas_frescas: { tipo: 'ids', ids: ['albahaca', 'cilantro', 'perejil', 'menta'] },
  hojas_verdes_frescas: { tipo: 'categorias', categorias: ['verdura_hoja', 'crucifera'] },
  raices: { tipo: 'ids', ids: ['zanahoria', 'remolacha', 'batata', 'papa', 'mandioca'] },
  palta_madura: { tipo: 'ids', ids: ['palta'] },
  banana_muy_madura: { tipo: 'ids', ids: ['banana'] },
  aquafaba: { tipo: 'estado', descripcion: 'líquido de cocción de garbanzos' },
  guisos_sopas: { tipo: 'estado', descripcion: 'guisos y sopas ya cocidos' },
  caldo_casero: { tipo: 'estado', descripcion: 'caldo casero' },
  hamburguesas_crudas: { tipo: 'estado', descripcion: 'medallones crudos formados' },
  panificados: { tipo: 'estado', descripcion: 'panes y masas horneadas' },
};

// ---------- catálogo de nutrientes → clave en ingredientes ----------

export const NUTRIENT_INGREDIENT_KEY: Record<string, string> = {
  b12: 'b12_ug',
  vitd: 'vitd_ug',
  hierro: 'hierro_mg',
  zinc: 'zinc_mg',
  calcio: 'calcio_mg',
  yodo: 'yodo_ug',
  selenio: 'selenio_ug',
  omega3: 'ala_g',
  proteina: 'prot_g',
  vitc: 'vitc_mg',
  vita: 'vita_ug_rae',
  folato: 'folato_ug',
  b2: 'b2_mg',
  vite: 'vite_mg',
  vitk: 'vitk_ug',
  b6: 'b6_mg',
  magnesio: 'magnesio_mg',
  potasio: 'potasio_mg',
  fibra: 'fibra_g',
  colina: 'colina_mg',
};
