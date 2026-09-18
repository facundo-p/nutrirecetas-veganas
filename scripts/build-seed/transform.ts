import type {
  Equivalences,
  GlossaryTerm,
  Ingredient,
  Line,
  Nutrient,
  NutrientValue,
  Recipe,
  SeasonalityItem,
  StorageItem,
} from '../../src/seed/schema';
import {
  ADDED_LINES,
  APORTE_NULO_IDS,
  CURATED_LAMINAS,
  CURATED_PORTIONS,
  CURATED_STEPS,
  CURATED_TYPES,
  CURATED_YIELDS,
  DE_FACTO_PREPARADOS,
  NUTRIENT_DESCRIPTIONS,
  NUTRIENT_INGREDIENT_KEY,
  NUTRIENT_NAME_OVERRIDES,
  PASO_DE_CADA_LINEA,
  PHANTOM_LINES,
  RECETAS_CON_PASOS_TOKENIZADOS,
  STORAGE_GROUPS,
  VEGAN_FACTORS_FROM_PROSE,
} from './curated-tables';
import type { RawData, RawIngredient, RawLine, RawNutrient, RawNutrientValue, RawRecipe } from './load';
import { canonizeRda } from './rda';
import { tokensDePaso } from '../../src/domain/pasos';
import { unidadDecible } from '../../src/domain/unidades-decibles';
import type { LaminaId } from '../../src/seed/laminas';

// ---------- valores ----------

export function toNutrientValue(raw: RawNutrientValue): NutrientValue | undefined {
  if (raw === null) return undefined; // null explícito = sin dato, jamás cero en silencio
  if (typeof raw === 'number') return { intervalo: { min: raw, max: raw } };
  const { min, max, nota } = raw; // `tipico` se descarta: el punto medio es (min+max)/2
  return nota === undefined ? { intervalo: { min, max } } : { intervalo: { min, max }, nota };
}

// ---------- ingredientes ----------

export function transformIngredient(raw: RawIngredient): Ingredient {
  const nutrientes: Ingredient['nutrientes'] = {};
  for (const [clave, valor] of Object.entries(raw.nutrientes ?? {})) {
    const value = toNutrientValue(valor);
    if (value !== undefined) nutrientes[clave as keyof Ingredient['nutrientes']] = value;
  }
  const kcal = raw.kcal !== undefined ? toNutrientValue(raw.kcal) : undefined;
  return {
    id: raw.id,
    nombre: raw.nombre,
    sinonimos: raw.sinonimos ?? [],
    categoria: raw.categoria as Ingredient['categoria'],
    ...(raw.base !== undefined ? { base: raw.base } : {}),
    ...(kcal !== undefined ? { kcal } : {}),
    nutrientes,
    ...(APORTE_NULO_IDS.includes(raw.id) ? { aporte_nulo: true as const } : {}),
    ...(raw.destacados !== undefined ? { destacados: raw.destacados } : {}),
    ic: raw.confianza,
    fuentes: raw.fuentes ?? [],
    ...(raw.notas !== undefined ? { notas: raw.notas } : {}),
    ...(raw.origen !== undefined ? { origen: raw.origen } : {}),
    ...(raw.sustituto_local !== undefined ? { sustituto_local: raw.sustituto_local } : {}),
  };
}

// ---------- nutrientes ----------

export function transformNutrient(raw: RawNutrient): Nutrient {
  const clave = NUTRIENT_INGREDIENT_KEY[raw.id];
  if (!clave) throw new Error(`Nutriente "${raw.id}" sin clave de ingrediente mapeada`);
  const descripcion = NUTRIENT_DESCRIPTIONS[raw.id];
  if (!descripcion) throw new Error(`Nutriente "${raw.id}" sin descripción curada (T10)`);
  const desdeProsa = VEGAN_FACTORS_FROM_PROSE[raw.id];
  return {
    id: raw.id,
    nombre: NUTRIENT_NAME_OVERRIDES[raw.id] ?? raw.nombre,
    descripcion: descripcion.texto,
    grupo: raw.grupo as Nutrient['grupo'],
    unidad: raw.unidad,
    clave_ingrediente: clave as Nutrient['clave_ingrediente'],
    rda: canonizeRda(raw.id, raw.rda),
    ...(raw.ajuste_vegano !== undefined
      ? {
          ajuste_vegano: {
            ...(raw.ajuste_vegano.factor !== undefined
              ? { factor: raw.ajuste_vegano.factor }
              : desdeProsa !== undefined
                ? { factor: desdeProsa.factor, factor_de_prosa: true as const }
                : {}),
            descripcion: raw.ajuste_vegano.descripcion,
            ...(raw.ajuste_vegano.confianza !== undefined ? { ic: raw.ajuste_vegano.confianza } : {}),
          },
        }
      : {}),
    ul: raw.ul ?? null,
    ...(raw.ul_nota !== undefined ? { ul_nota: raw.ul_nota } : {}),
    ventana: raw.ventana_evaluacion as Nutrient['ventana'],
    ...(raw.ventana_nota !== undefined ? { ventana_nota: raw.ventana_nota } : {}),
    ic: raw.confianza_rda,
    ...(raw.notas !== undefined
      ? {
          notas: raw.notas.map((n) => ({
            texto: n.texto,
            ...(n.confianza !== undefined ? { ic: n.confianza } : {}),
          })),
        }
      : {}),
  };
}

// ---------- recetas ----------

const FUENTE_KEYS = new Set(['ref', 'ref_secundaria', 'titulo_original', 'receta_original_num', 'pagina_pdf', 'nota']);
const RULE_REF_RE = /^([RU]\d+)(?:_(.+))?$/;

function transformLine(recipeId: string, raw: RawLine, ingredientIds: Set<string>): LineaSinPaso {
  const phantom = PHANTOM_LINES.find(
    (p) => p.receta_id === recipeId && p.ingrediente_id === raw.ingrediente_id && p.unidad === raw.unidad,
  );
  const sustitutos = [...(raw.sustitutos ?? []), ...(phantom?.sustitutos_id ?? [])].map((s) => ({
    tipo: ingredientIds.has(s) ? ('id' as const) : ('texto' as const),
    valor: s,
  }));
  return {
    ref: phantom ? { tipo: 'receta', id: phantom.ref_receta_id } : { tipo: 'ingrediente', id: raw.ingrediente_id },
    cantidad: raw.cantidad,
    unidad_display: raw.unidad,
    g_aprox: raw.g_aprox,
    ...(raw.funcion !== undefined ? { funcion: raw.funcion } : {}),
    ...(raw.imprescindible !== undefined ? { imprescindible: raw.imprescindible } : {}),
    sustitutos,
    ...(raw.nota !== undefined ? { nota: raw.nota } : {}),
    ...(phantom?.nota !== undefined ? { nota: phantom.nota } : {}),
  };
}

/**
 * T12 pisa el tipo derivado. Una entrada que repite lo que el dataset ya dice
 * es una corrección que dejó de corregir: rompe el build en vez de quedar
 * escrita sin efecto.
 */
export function aplicarTipoCurado(
  id: string,
  tipoDerivado: Recipe['tipo'],
  tabla: Record<string, { tipo: Recipe['tipo'] }> = CURATED_TYPES,
): Recipe['tipo'] {
  const curado = tabla[id];
  if (!curado) return tipoDerivado;
  if (curado.tipo === tipoDerivado) {
    throw new Error(`T12: ${id} ya sale "${tipoDerivado}" del dataset; la entrada no corrige nada`);
  }
  return curado.tipo;
}

/**
 * T15: la lámina de la ficha. Una variante sin entrada propia hereda la de su
 * madre; una entrada que repite lo que ya heredaría no cambia nada y rompe el
 * build, como en T12.
 */
export function laminaDeReceta(
  id: string,
  varianteDe: string | undefined,
  tabla: Record<string, LaminaId> = CURATED_LAMINAS,
): { lamina?: LaminaId } {
  const propia = tabla[id];
  const heredada = varianteDe !== undefined ? tabla[varianteDe] : undefined;
  if (propia !== undefined && propia === heredada) {
    throw new Error(`T15: ${id} ya hereda "${heredada}" de ${varianteDe}; la entrada no cambia nada`);
  }
  const lamina = propia ?? heredada;
  return lamina !== undefined ? { lamina } : {};
}

/** Una línea antes de saber en qué paso entra. */
type LineaSinPaso = Omit<Line, 'paso'>;

/**
 * T14: en qué paso entra cada línea. La tabla cuenta los pasos desde 1, como
 * se leen; la semilla guarda el índice en `pasos`. Forma desconocida rompe el
 * build: una receta sin mapeo, una posición de más o de menos, un paso que no
 * existe, un imprescindible sin paso.
 */
export function asignarPasos(
  id: string,
  lineas: LineaSinPaso[],
  pasos: string[],
  tabla: Record<string, ReadonlyArray<number | null>> = PASO_DE_CADA_LINEA,
): Line[] {
  const posiciones = tabla[id];
  if (posiciones === undefined) throw new Error(`T14: ${id} sin el paso de cada línea`);
  if (posiciones.length !== lineas.length) {
    throw new Error(`T14: ${id} tiene ${lineas.length} líneas y ${posiciones.length} posiciones`);
  }
  return lineas.map((linea, i) => {
    const paso = posiciones[i] ?? null;
    if (paso !== null && (!Number.isInteger(paso) || paso < 1 || paso > pasos.length)) {
      throw new Error(`T14: ${id}, línea ${i}: el paso ${paso} no existe (hay ${pasos.length})`);
    }
    if (paso === null && linea.imprescindible) throw new Error(`T14: ${id}, línea ${i}: imprescindible sin paso`);
    return { ...linea, paso: paso === null ? null : paso - 1 };
  });
}

/** Números del paso que no son cantidades: «20 a 25 minutos», «180 °C». */
const TIEMPO_O_TEMPERATURA = /^\s*(?:a\s*\d+(?:[,.]\d+)?\s*)?(?:min|hora|segundo|°|grados?)/i;

const NUMERO_SUELTO = /(?<![\d,.])\d+(?:[,.]\d+)?(?![\d,.])/g;

/**
 * Cualquier medida escrita, sea o no de una línea: «600 ml de agua» no escala
 * aunque el agua no figure en la receta, y al doble el paso pide la mitad de lo
 * que hace falta. Lo que se mide va como token o se dice sin número («hasta
 * cubrir»).
 */
const MEDIDA_ESCRITA =
  /(?<![\d,.])\d+(?:[,.]\d+)?\s*(?:gr?|gramos?|ml|cc|tazas?|cdas?|cucharadas?|cdtas?|cucharaditas?|dientes?|hojas?|ramas?|rebanadas?|pizcas?|chorritos?|gotas?|puñados?|latas?|paquetes?|atados?|vasos?|bloques?|cubitos?|tiras?)\b/gi;

/**
 * T9/#200: una receta tokenizada dice sus cantidades con `{ingrediente}` y no
 * con un número escrito. Un número fijo en la prosa miente en cuanto se ajustan
 * las porciones —la lista decía 800 g y el paso 400—, y este es el único lugar
 * donde se puede impedir de una vez.
 */
export function validarPasos(
  id: string,
  pasos: string[],
  lineas: Line[],
  tokenizada: boolean = RECETAS_CON_PASOS_TOKENIZADOS.has(id),
): void {
  pasos.forEach((texto, indice) => {
    const enElPaso = lineas.filter((linea) => linea.paso === indice);
    const donde = `T9: ${id}, paso ${indice + 1}`;

    for (const token of tokensDePaso(texto)) {
      if (!tokenizada) throw new Error(`${donde}: ${token.crudo} pero la receta no está en RECETAS_CON_PASOS_TOKENIZADOS`);
      const candidatas = enElPaso.filter((linea) => linea.ref.id === token.id);
      if (candidatas.length > 1 && token.ocurrencia === 1 && !token.crudo.includes('#')) {
        throw new Error(`${donde}: ${token.crudo} es ambiguo, el paso tiene ${candidatas.length} líneas de ${token.id}`);
      }
      const elegida = candidatas[token.ocurrencia - 1];
      if (elegida === undefined) throw new Error(`${donde}: ${token.crudo} no es una línea de ese paso`);
      if (unidadDecible(elegida.unidad_display) === null) {
        throw new Error(`${donde}: ${token.crudo} mide en "${elegida.unidad_display}", que no se sabe decir en prosa`);
      }
    }

    if (!tokenizada) return;
    const cantidades = new Set(
      enElPaso.flatMap((linea) => [linea.cantidad, linea.g_aprox, Math.round(linea.g_aprox)].map(String)),
    );
    const medida = MEDIDA_ESCRITA.exec(texto);
    MEDIDA_ESCRITA.lastIndex = 0;
    if (medida !== null) {
      throw new Error(`${donde}: "${medida[0]}" es una medida escrita; va como token o sin número`);
    }

    for (const match of texto.matchAll(NUMERO_SUELTO)) {
      const valor = String(Number(match[0].replace(',', '.')));
      const sigue = texto.slice(match.index + match[0].length);
      if (cantidades.has(valor) && !TIEMPO_O_TEMPERATURA.test(sigue)) {
        throw new Error(`${donde}: el ${match[0]} es una cantidad de ese paso y quedó escrito; va como token`);
      }
    }
  });
}

export function transformRecipe(
  raw: RawRecipe,
  setKey: 1 | 2 | 3 | 'P',
  ingredientIds: Set<string>,
  equipmentIds: Set<string>,
): Recipe {
  const id = raw.id;

  // estado + ic: deriva de campos entre sets (auditoría §1)
  const estado = setKey === 'P' ? raw.estado : raw.estado_sugerido;
  const ic = setKey === 'P' ? raw.confianza : raw.confianza_adaptacion;
  if (estado === undefined || ic === undefined) throw new Error(`${id}: sin estado/confianza`);

  // tipo: el set 1 no lo trae → salada (set fundacional salado), salvo lo que corrija T12
  const tipoDerivado = (setKey === 1 ? 'salada' : raw.tipo) as Recipe['tipo'];
  if (tipoDerivado === undefined) throw new Error(`${id}: sin tipo`);
  const tipo = aplicarTipoCurado(id, tipoDerivado);

  // porciones: número directo o tabla curada T1
  let porciones_num: number | null;
  let porciones_display: string;
  if (typeof raw.porciones === 'number') {
    porciones_num = raw.porciones;
    porciones_display = `${raw.porciones} porciones`;
  } else {
    const curated = CURATED_PORTIONS[id];
    if (!curated) throw new Error(`${id}: porciones string "${raw.porciones}" sin entrada en T1`);
    porciones_num = curated.porciones_num;
    porciones_display = raw.porciones;
  }

  // preparados: T2 (incluye p08 de facto)
  const es_preparado = tipo === 'preparado' || DE_FACTO_PREPARADOS.includes(id);
  const yieldEntry = CURATED_YIELDS[id];
  if (es_preparado && !yieldEntry) throw new Error(`${id}: preparado sin rendimiento_g en T2`);
  if (!es_preparado && yieldEntry) throw new Error(`${id}: tiene rendimiento_g pero no es preparado`);

  const pasos = CURATED_STEPS[id]?.pasos ?? raw.pasos;

  // líneas: fantasmas T3 + agregadas
  const lineas: LineaSinPaso[] = raw.ingredientes.map((l) => transformLine(id, l, ingredientIds));
  for (const added of ADDED_LINES.filter((a) => a.receta_id === id)) {
    lineas.push({
      ref: { tipo: 'receta', id: added.ref_receta_id },
      cantidad: added.cantidad,
      unidad_display: added.unidad_display,
      g_aprox: added.g_aprox,
      ...(added.funcion !== undefined ? { funcion: added.funcion } : {}),
      sustitutos: [],
      ...(added.nota !== undefined ? { nota: added.nota } : {}),
    });
  }

  // referencias de reglas y utensilios (T5)
  const reglas: Recipe['reglas'] = [];
  const utensilios: Recipe['utensilios'] = [];
  for (const ref of raw.reglas_disparadas ?? []) {
    const match = RULE_REF_RE.exec(ref);
    if (!match || match[1] === undefined) throw new Error(`${id}: regla disparada ilegible "${ref}"`);
    const [, ruleId, calificador] = match;
    if (ruleId.startsWith('U')) {
      utensilios.push({ tipo: 'regla_utensilio', id: ruleId, ...(calificador !== undefined ? { calificador } : {}) });
    } else {
      reglas.push({ id: ruleId, ...(calificador !== undefined ? { calificador } : {}) });
    }
  }
  for (const ref of raw.utensilio_recomendado ?? []) {
    const match = RULE_REF_RE.exec(ref);
    if (match && match[1] !== undefined && match[1].startsWith('U')) {
      utensilios.push({
        tipo: 'regla_utensilio',
        id: match[1],
        ...(match[2] !== undefined ? { calificador: match[2] } : {}),
      });
    } else if (equipmentIds.has(ref)) {
      utensilios.push({ tipo: 'equipo', id: ref });
    } else {
      utensilios.push({ tipo: 'equipo_libre', nombre: ref });
    }
  }

  // fuente: passthrough con claves verificadas (forma desconocida = build falla)
  let fuente: Recipe['fuente'];
  if (raw.fuente !== undefined) {
    for (const key of Object.keys(raw.fuente)) {
      if (!FUENTE_KEYS.has(key)) throw new Error(`${id}: fuente con clave desconocida "${key}"`);
    }
    fuente = raw.fuente as Recipe['fuente'];
  }

  const lineasConPaso = asignarPasos(id, lineas, pasos);
  validarPasos(id, pasos, lineasConPaso);

  const objetivo = raw.objetivo ?? raw.objetivo_nutricional;

  return {
    id,
    nombre: raw.nombre,
    tipo,
    es_preparado,
    ...(yieldEntry ? { rendimiento_g: yieldEntry.rendimiento_g } : {}),
    porciones_num,
    porciones_display,
    estado: estado as Recipe['estado'],
    ic,
    ...(fuente !== undefined ? { fuente } : {}),
    set_origen: setKey,
    ...(raw.familia !== undefined ? { familia: raw.familia } : {}),
    ...(raw.variante_de !== undefined ? { variante_de: raw.variante_de } : {}),
    // Algunos quedan solo como enlace, sin línea, y está bien: p10→p01 consume
    // el okara y no la leche; p30→p02 ya desagrega la leche de coco en agua y
    // coco rallado; p44→p06 el queso va sobre la pizza armada, no en la masa.
    usa_preparados: raw.usa_preparados ?? [],
    ...(raw.indulgente !== undefined ? { indulgente: raw.indulgente } : {}),
    ...(raw.candidata_clasica !== undefined ? { candidata_clasica: raw.candidata_clasica } : {}),
    dificultad: raw.dificultad as Recipe['dificultad'],
    tiempo_prep_min: raw.tiempo_prep_min,
    tiempo_coccion_min: raw.tiempo_coccion_min,
    lineas: lineasConPaso,
    pasos,
    pasos_escalables: RECETAS_CON_PASOS_TOKENIZADOS.has(id),
    secretos_chef: raw.secretos_chef ?? [],
    ...(raw.guarda !== undefined
      ? {
          guarda: {
            ...(raw.guarda.heladera_dias !== undefined ? { heladera_dias: raw.guarda.heladera_dias } : {}),
            ...(typeof raw.guarda.freezer === 'string'
              ? { freezer: true, freezer_nota: raw.guarda.freezer }
              : raw.guarda.freezer !== undefined
                ? { freezer: raw.guarda.freezer }
                : {}),
          },
        }
      : {}),
    reglas,
    utensilios,
    ...(objetivo !== undefined ? { objetivo } : {}),
    ...(raw.nota !== undefined ? { nota: raw.nota } : {}),
    ...laminaDeReceta(id, raw.variante_de),
  };
}

export function transformRecipes(raw: RawData, equipmentIds: Set<string>): Recipe[] {
  const ingredientIds = new Set(raw.ingredientes.map((i) => i.id));
  const setKeys = [1, 2, 3, 'P'] as const;
  const recetas = setKeys.flatMap((key) =>
    raw.sets[key].map((r) => transformRecipe(r, key, ingredientIds, equipmentIds)),
  );

  // Una entrada de T9 que apunta a una receta inexistente es un typo que si no
  // rompe el build queda escrito sin efecto y nadie se entera.
  const ids = new Set(recetas.map((r) => r.id));
  const huerfanas = Object.keys(CURATED_STEPS).filter((id) => !ids.has(id));
  if (huerfanas.length > 0) throw new Error(`T9: pasos curados para recetas que no existen: ${huerfanas.join(', ')}`);
  const tiposHuerfanos = Object.keys(CURATED_TYPES).filter((id) => !ids.has(id));
  if (tiposHuerfanos.length > 0) {
    throw new Error(`T12: tipo curado para recetas que no existen: ${tiposHuerfanos.join(', ')}`);
  }

  const pasosHuerfanos = Object.keys(PASO_DE_CADA_LINEA).filter((id) => !ids.has(id));
  if (pasosHuerfanos.length > 0) {
    throw new Error(`T14: paso de cada línea para recetas que no existen: ${pasosHuerfanos.join(', ')}`);
  }

  const tokenizadasHuerfanas = [...RECETAS_CON_PASOS_TOKENIZADOS].filter((id) => !ids.has(id));
  if (tokenizadasHuerfanas.length > 0) {
    throw new Error(`T9: pasos tokenizados para recetas que no existen: ${tokenizadasHuerfanas.join(', ')}`);
  }

  const laminasHuerfanas = Object.keys(CURATED_LAMINAS).filter((id) => !ids.has(id));
  if (laminasHuerfanas.length > 0) {
    throw new Error(`T15: lámina curada para recetas que no existen: ${laminasHuerfanas.join(', ')}`);
  }

  return recetas;
}

// ---------- datos de apoyo ----------

export function transformSeasonality(
  items: Array<Record<string, unknown>>,
  ingredientIds: Set<string>,
): { items: SeasonalityItem[]; descartados: string[] } {
  const result: SeasonalityItem[] = [];
  const descartados: string[] = [];
  for (const item of items) {
    const id = String(item.ingrediente_id);
    if (!ingredientIds.has(id)) {
      descartados.push(id); // ej. `uva` sin ficha de ingrediente (pregunta abierta del gate)
      continue;
    }
    result.push({
      ingrediente_id: id,
      meses_pico: item.meses_pico as number[],
      ...(item.disponible_todo_ano !== undefined ? { disponible_todo_ano: Boolean(item.disponible_todo_ano) } : {}),
      ic: Number(item.confianza),
      ...(item.nota !== undefined ? { nota: String(item.nota) } : {}),
    });
  }
  return { items: result, descartados };
}

export function transformStorage(
  items: Array<Record<string, unknown>>,
  ingredientIds: Set<string>,
): StorageItem[] {
  return items.map((item) => {
    const id = String(item.item);
    let aplica: StorageItem['aplica'];
    if (ingredientIds.has(id)) {
      aplica = { tipo: 'ingrediente', ids: [id] };
    } else {
      const group = STORAGE_GROUPS[id];
      if (!group) throw new Error(`Conservación: item "${id}" sin mapeo en T7`);
      aplica =
        group.tipo === 'ids'
          ? { tipo: 'ingrediente', ids: group.ids }
          : group.tipo === 'categorias'
            ? { tipo: 'categoria', categorias: group.categorias }
            : { tipo: 'estado', descripcion: group.descripcion };
    }
    return {
      item: id,
      aplica,
      ...(item.despensa_dias !== undefined ? { despensa_dias: Number(item.despensa_dias) } : {}),
      ...(item.heladera_dias !== undefined ? { heladera_dias: Number(item.heladera_dias) } : {}),
      ...(item.freezer_dias !== undefined ? { freezer_dias: Number(item.freezer_dias) } : {}),
      ...(item.seguridad_critica !== undefined ? { seguridad_critica: Boolean(item.seguridad_critica) } : {}),
      ic: Number(item.confianza),
      ...(item.nota !== undefined ? { nota: String(item.nota) } : {}),
    };
  });
}

export function transformGlossary(terms: Array<Record<string, unknown>>): GlossaryTerm[] {
  return terms.map((t) => ({
    id: String(t.id),
    termino: String(t.termino),
    ...(t.sinonimos !== undefined ? { sinonimos: t.sinonimos as string[] } : {}),
    categoria: t.categoria as GlossaryTerm['categoria'],
    definicion: String(t.definicion),
    ic: Number(t.confianza),
    ...(t.nota !== undefined ? { nota: String(t.nota) } : {}),
  }));
}

export function transformEquivalences(raw: Record<string, unknown>): Equivalences {
  const strip = <T extends object>(items: unknown, drop: string[]): T[] =>
    (items as Array<Record<string, unknown>>).map((item) => {
      const copy = { ...item };
      for (const key of drop) delete copy[key];
      return copy as T;
    });
  return {
    volumen_ml: raw.volumen_ml as Equivalences['volumen_ml'],
    peso_por_volumen: strip(raw.peso_por_volumen, []),
    peso_por_unidad: strip(raw.peso_por_unidad, []),
    conversion_seco_cocido: strip(raw.conversion_seco_cocido, []),
    envases_locales_ar: strip(raw.envases_locales_ar, []),
    horno_celsius: strip(raw.horno_celsius, []),
  };
}
