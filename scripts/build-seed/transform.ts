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
  CURATED_PORTIONS,
  CURATED_YIELDS,
  DE_FACTO_PREPARADOS,
  NUTRIENT_INGREDIENT_KEY,
  PHANTOM_LINES,
  STORAGE_GROUPS,
} from './curated-tables';
import type { RawData, RawIngredient, RawLine, RawNutrient, RawNutrientValue, RawRecipe } from './load';
import { canonizeRda } from './rda';

/** Avisos no fatales que van al reporte del gate de datos. */
export interface TransformNotes {
  descartes_estacionalidad: string[];
}

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
  return {
    id: raw.id,
    nombre: raw.nombre,
    grupo: raw.grupo as Nutrient['grupo'],
    unidad: raw.unidad,
    clave_ingrediente: clave as Nutrient['clave_ingrediente'],
    rda: canonizeRda(raw.id, raw.rda),
    ...(raw.ajuste_vegano !== undefined
      ? {
          ajuste_vegano: {
            ...(raw.ajuste_vegano.factor !== undefined ? { factor: raw.ajuste_vegano.factor } : {}),
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

function transformLine(recipeId: string, raw: RawLine, ingredientIds: Set<string>): Line {
  const phantom = PHANTOM_LINES.find(
    (p) => p.receta_id === recipeId && p.ingrediente_id === raw.ingrediente_id && p.unidad === raw.unidad,
  );
  const sustitutos = (raw.sustitutos ?? []).map((s) => ({
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

  // tipo: el set 1 no lo trae → salada (set fundacional salado)
  const tipo = (setKey === 1 ? 'salada' : raw.tipo) as Recipe['tipo'];
  if (tipo === undefined) throw new Error(`${id}: sin tipo`);

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

  // líneas: fantasmas T3 + agregadas
  const lineas: Line[] = raw.ingredientes.map((l) => transformLine(id, l, ingredientIds));
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
    usa_preparados: raw.usa_preparados ?? [],
    ...(raw.indulgente !== undefined ? { indulgente: raw.indulgente } : {}),
    ...(raw.candidata_clasica !== undefined ? { candidata_clasica: raw.candidata_clasica } : {}),
    dificultad: raw.dificultad as Recipe['dificultad'],
    tiempo_prep_min: raw.tiempo_prep_min,
    tiempo_coccion_min: raw.tiempo_coccion_min,
    lineas,
    pasos: raw.pasos,
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
  };
}

export function transformRecipes(raw: RawData, equipmentIds: Set<string>): Recipe[] {
  const ingredientIds = new Set(raw.ingredientes.map((i) => i.id));
  const setKeys = [1, 2, 3, 'P'] as const;
  return setKeys.flatMap((key) => raw.sets[key].map((r) => transformRecipe(r, key, ingredientIds, equipmentIds)));
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
