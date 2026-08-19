import type { IngredientCategory, Predicate, Rule } from '../../src/seed/schema';
import { RULE_CONCEPTS } from './curated-tables';
import type { RawRule } from './load';

/**
 * Compila las `condicion` semi-estructuradas de R1–R15 a un AST canónico de
 * predicados tipados (auditoría §2.1). Clave o target desconocido = falla el
 * build, nunca el runtime. Semántica: los predicados de una regla se conjugan
 * con AND; dentro de `contiene_ingrediente`/`contiene_categoria`, la lista es
 * "alguno de".
 */

export interface RuleContext {
  ingredientIds: Set<string>;
  categories: Set<string>;
  nutrientIds: Set<string>;
  ingredientNutrientKeys: Set<string>;
}

const RULE_TYPES = ['potenciador', 'inhibidor', 'sugerencia', 'tecnica', 'correccion', 'precaucion', 'dato'] as const;

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [v];
}

function resolveIngredientTargets(
  ruleId: string,
  targets: unknown[],
  ctx: RuleContext,
): { ids: string[]; calificador?: string } {
  const ids = new Set<string>();
  const calificadores = new Set<string>();
  for (const target of targets) {
    if (typeof target !== 'string') throw new Error(`${ruleId}: target no-string ${JSON.stringify(target)}`);
    if (ctx.ingredientIds.has(target)) {
      ids.add(target);
      continue;
    }
    const concept = RULE_CONCEPTS[target];
    if (!concept) {
      throw new Error(`${ruleId}: target "${target}" no es id de ingrediente ni concepto curado (T6)`);
    }
    for (const id of concept.ids ?? []) {
      if (!ctx.ingredientIds.has(id)) throw new Error(`${ruleId}: concepto "${target}" expande a id inexistente "${id}"`);
      ids.add(id);
    }
    if (concept.calificador) calificadores.add(concept.calificador);
  }
  if (calificadores.size > 1) {
    throw new Error(`${ruleId}: targets con calificadores mixtos (${[...calificadores].join(', ')})`);
  }
  const calificador = [...calificadores][0];
  return calificador === undefined ? { ids: [...ids] } : { ids: [...ids], calificador };
}

export function compileRule(raw: RawRule, ctx: RuleContext): Rule {
  const pending = new Map(Object.entries(raw.condicion));
  const take = (key: string): unknown => {
    const value = pending.get(key);
    pending.delete(key);
    return value;
  };
  const predicados: Predicate[] = [];

  if (pending.has('receta_rica_en')) {
    const nutrientes = asArray(take('receta_rica_en')).map(String);
    for (const n of nutrientes) {
      if (!ctx.nutrientIds.has(n)) throw new Error(`${raw.id}: receta_rica_en refiere nutriente inexistente "${n}"`);
    }
    const umbral = pending.has('umbral_mg_porcion') ? Number(take('umbral_mg_porcion')) : undefined;
    predicados.push(
      umbral === undefined
        ? { tipo: 'receta_rica_en', nutrientes }
        : { tipo: 'receta_rica_en', nutrientes, umbral_mg_porcion: umbral },
    );
  }

  if (pending.has('y_contiene_nutriente')) {
    const spec = take('y_contiene_nutriente') as Record<string, number>;
    for (const [clave, cantidad] of Object.entries(spec)) {
      if (!ctx.ingredientNutrientKeys.has(clave)) {
        throw new Error(`${raw.id}: y_contiene_nutriente usa clave desconocida "${clave}"`);
      }
      predicados.push({ tipo: 'contiene_nutriente_min', clave: clave as never, cantidad });
    }
  }

  if (pending.has('sin_nutriente')) {
    const nutriente = String(take('sin_nutriente'));
    if (!ctx.nutrientIds.has(nutriente)) throw new Error(`${raw.id}: sin_nutriente refiere "${nutriente}" inexistente`);
    predicados.push({ tipo: 'sin_nutriente', nutriente });
  }

  if (pending.has('contiene_ingrediente')) {
    const resolved = resolveIngredientTargets(raw.id, asArray(take('contiene_ingrediente')), ctx);
    predicados.push({ tipo: 'contiene_ingrediente', ...resolved });
  }

  if (pending.has('sin_ingrediente')) {
    const resolved = resolveIngredientTargets(raw.id, asArray(take('sin_ingrediente')), ctx);
    predicados.push({ tipo: 'sin_ingrediente', ids: resolved.ids });
  }

  if (pending.has('contiene_categoria')) {
    const targets = asArray(take('contiene_categoria')).map(String);
    const categorias: IngredientCategory[] = [];
    const ids: string[] = [];
    for (const target of targets) {
      if (ctx.categories.has(target)) {
        categorias.push(target as IngredientCategory);
      } else if (RULE_CONCEPTS[target]?.ids) {
        ids.push(...(RULE_CONCEPTS[target]?.ids ?? []));
      } else {
        throw new Error(`${raw.id}: contiene_categoria refiere "${target}" que no es categoría ni concepto`);
      }
    }
    predicados.push({
      tipo: 'contiene_categoria',
      ...(categorias.length > 0 ? { categorias } : {}),
      ...(ids.length > 0 ? { ids } : {}),
    });
  }

  if (pending.has('sin_grasa_agregada')) {
    take('sin_grasa_agregada');
    predicados.push({ tipo: 'sin_grasa_agregada' });
  }

  if (pending.has('calcio_simultaneo_mg')) {
    predicados.push({ tipo: 'calcio_simultaneo_mg', mg: Number(take('calcio_simultaneo_mg')) });
  }

  if (pending.has('ingrediente')) {
    const resolved = resolveIngredientTargets(raw.id, asArray(take('ingrediente')), ctx);
    const unidades = Number(take('cantidad_unidades_porcion_mayor_a'));
    const id = resolved.ids[0];
    if (resolved.ids.length !== 1 || id === undefined || Number.isNaN(unidades)) {
      throw new Error(`${raw.id}: predicado ingrediente+cantidad mal formado`);
    }
    predicados.push({ tipo: 'ingrediente_cantidad_mayor', id, unidades });
  }

  if (pending.has('suplementos_simultaneos')) {
    const nutrientes = asArray(take('suplementos_simultaneos')).map(String);
    for (const n of nutrientes) {
      if (!ctx.nutrientIds.has(n)) throw new Error(`${raw.id}: suplementos_simultaneos refiere "${n}" inexistente`);
    }
    predicados.push({ tipo: 'suplementos_simultaneos', nutrientes });
  }

  if (pending.has('suplemento')) {
    const nutriente = String(take('suplemento'));
    if (!ctx.nutrientIds.has(nutriente)) throw new Error(`${raw.id}: suplemento refiere "${nutriente}" inexistente`);
    predicados.push({ tipo: 'suplemento', nutriente });
  }

  if (pending.has('uso_habitual_aceite')) {
    predicados.push({ tipo: 'uso_habitual_aceite', aceites: asArray(take('uso_habitual_aceite')).map(String) });
  }

  if (pending.size > 0) {
    throw new Error(`${raw.id}: claves de condicion sin compilar: ${[...pending.keys()].join(', ')} — formalizar el predicado en rules-ast.ts`);
  }
  if (predicados.length === 0) throw new Error(`${raw.id}: condicion vacía`);
  if (!(RULE_TYPES as readonly string[]).includes(raw.tipo)) {
    throw new Error(`${raw.id}: tipo de regla desconocido "${raw.tipo}"`);
  }

  return {
    id: raw.id,
    tipo: raw.tipo as Rule['tipo'],
    predicados,
    condicion_original: raw.condicion,
    mensaje: raw.mensaje,
    ic: raw.confianza,
  };
}
