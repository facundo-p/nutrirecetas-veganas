import { createHash } from 'node:crypto';
import { seedSchema, type Recipe, type Seed } from '../../src/seed/schema';

/**
 * Validación final de la semilla: integridad referencial, Zod, cadenas de
 * preparados (ciclos / profundidad) y diff contra la semilla anterior.
 * Contrato de ids: se depreca, no se renombra — un id que desaparece rompe el build.
 */

/** Referencias genéricas admitidas en peso_por_volumen (no son ingredientes). */
const GENERIC_VOLUME_IDS = new Set(['liquidos_acuosos', 'aceite', 'pan_rallado']);

const MAX_PREPARADO_DEPTH = 3;

export function validateIntegrity(seed: Omit<Seed, 'content_hash'>): void {
  const errors: string[] = [];
  const ingredientIds = new Set(seed.ingredientes.map((i) => i.id));
  const recipeById = new Map(seed.recetas.map((r) => [r.id, r]));

  for (const receta of seed.recetas) {
    for (const linea of receta.lineas) {
      if (linea.ref.tipo === 'ingrediente') {
        if (!ingredientIds.has(linea.ref.id)) errors.push(`${receta.id}: línea refiere ingrediente inexistente "${linea.ref.id}"`);
      } else {
        const target = recipeById.get(linea.ref.id);
        if (!target) errors.push(`${receta.id}: línea refiere receta inexistente "${linea.ref.id}"`);
        else if (!target.es_preparado) errors.push(`${receta.id}: línea refiere "${linea.ref.id}" que no es preparado`);
      }
      for (const s of linea.sustitutos) {
        if (s.tipo === 'id' && !ingredientIds.has(s.valor)) errors.push(`${receta.id}: sustituto id inexistente "${s.valor}"`);
      }
    }
    if (receta.variante_de !== undefined && !recipeById.has(receta.variante_de)) {
      errors.push(`${receta.id}: variante_de inexistente "${receta.variante_de}"`);
    }
    for (const p of receta.usa_preparados) {
      if (!recipeById.has(p)) errors.push(`${receta.id}: usa_preparados inexistente "${p}"`);
    }
    if (receta.es_preparado && receta.rendimiento_g === undefined) {
      errors.push(`${receta.id}: preparado sin rendimiento_g`);
    }
  }

  // cadenas de preparados: sin ciclos, profundidad acotada
  const depthOf = (recipe: Recipe, visited: Set<string>): number => {
    if (visited.has(recipe.id)) {
      errors.push(`ciclo de preparados detectado en "${recipe.id}"`);
      return 0;
    }
    visited.add(recipe.id);
    let max = 0;
    for (const linea of recipe.lineas) {
      if (linea.ref.tipo === 'receta') {
        const target = recipeById.get(linea.ref.id);
        if (target) max = Math.max(max, 1 + depthOf(target, visited));
      }
    }
    visited.delete(recipe.id);
    return max;
  };
  for (const receta of seed.recetas) {
    const depth = depthOf(receta, new Set());
    if (depth > MAX_PREPARADO_DEPTH) errors.push(`${receta.id}: cadena de preparados de profundidad ${depth} > ${MAX_PREPARADO_DEPTH}`);
  }

  for (const item of seed.estacionalidad) {
    if (!ingredientIds.has(item.ingrediente_id)) errors.push(`estacionalidad: ingrediente inexistente "${item.ingrediente_id}"`);
  }
  for (const item of seed.conservacion) {
    if (item.aplica.tipo === 'ingrediente') {
      for (const id of item.aplica.ids) {
        if (!ingredientIds.has(id)) errors.push(`conservación "${item.item}": ingrediente inexistente "${id}"`);
      }
    }
  }
  for (const entry of seed.equivalencias.peso_por_unidad) {
    if (!ingredientIds.has(entry.ingrediente_id)) errors.push(`peso_por_unidad: ingrediente inexistente "${entry.ingrediente_id}"`);
  }
  for (const entry of seed.equivalencias.peso_por_volumen) {
    if (!ingredientIds.has(entry.ingrediente_id) && !GENERIC_VOLUME_IDS.has(entry.ingrediente_id)) {
      errors.push(`peso_por_volumen: referencia desconocida "${entry.ingrediente_id}"`);
    }
  }
  for (const entry of seed.equivalencias.conversion_seco_cocido) {
    if (!ingredientIds.has(entry.ingrediente_id)) errors.push(`conversion_seco_cocido: ingrediente inexistente "${entry.ingrediente_id}"`);
  }

  const equipmentIds = new Set(seed.utensilios.equipos.map((e) => e.id));
  const utensilRuleIds = new Set(seed.utensilios.reglas_utensilio.map((r) => r.id));
  const ruleIds = new Set(seed.reglas.map((r) => r.id));
  for (const receta of seed.recetas) {
    for (const ref of receta.reglas) {
      if (!ruleIds.has(ref.id)) errors.push(`${receta.id}: regla inexistente "${ref.id}"`);
    }
    for (const u of receta.utensilios) {
      if (u.tipo === 'regla_utensilio' && !utensilRuleIds.has(u.id)) errors.push(`${receta.id}: regla de utensilio inexistente "${u.id}"`);
      if (u.tipo === 'equipo' && !equipmentIds.has(u.id)) errors.push(`${receta.id}: equipo inexistente "${u.id}"`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Integridad de la semilla rota (${errors.length}):\n  - ${errors.join('\n  - ')}`);
  }
}

/** Ids inmutables: comparar contra la semilla anterior si existe. */
export function diffAgainstPrevious(next: Omit<Seed, 'content_hash'>, previous: Seed | null): void {
  if (!previous) return;
  const errors: string[] = [];
  const check = (kind: string, prevIds: string[], nextIds: Set<string>) => {
    for (const id of prevIds) {
      if (!nextIds.has(id)) errors.push(`${kind} "${id}" desapareció de la semilla (contrato: se depreca, no se renombra)`);
    }
  };
  check('receta', previous.recetas.map((r) => r.id), new Set(next.recetas.map((r) => r.id)));
  check('ingrediente', previous.ingredientes.map((i) => i.id), new Set(next.ingredientes.map((i) => i.id)));
  check('nutriente', previous.nutrientes.map((n) => n.id), new Set(next.nutrientes.map((n) => n.id)));
  if (errors.length > 0) {
    throw new Error(`Diff contra semilla anterior falló:\n  - ${errors.join('\n  - ')}`);
  }
}

export function computeContentHash(seed: Omit<Seed, 'content_hash'>): string {
  return createHash('sha256').update(JSON.stringify(seed)).digest('hex');
}

export function finalizeSeed(seed: Omit<Seed, 'content_hash'>, previous: Seed | null): Seed {
  validateIntegrity(seed);
  diffAgainstPrevious(seed, previous);
  const full: Seed = { ...seed, content_hash: computeContentHash(seed) };
  return seedSchema.parse(full);
}
