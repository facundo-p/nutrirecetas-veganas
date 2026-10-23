import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeNutrition } from '../../src/domain/nutrition';
import { isRichIn } from '../../src/domain/rda';
import type { Seed } from '../../src/seed/schema';

/**
 * `npm run cobertura [-- otra/seed.json]` — cuántos ingredientes tienen dato de
 * cada crítico y cuántas recetas llegan al 20 % del día. Sale de la semilla para
 * que ningún texto escriba esas cifras a mano (#169).
 */

const CRITICOS = ['calcio', 'zinc', 'selenio', 'omega3', 'yodo'];
const SEED_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'seed', 'seed.json');

const seed = JSON.parse(readFileSync(process.argv[2] ?? SEED_PATH, 'utf8')) as Seed;
const source = {
  ingredientById: new Map(seed.ingredientes.map((i) => [i.id, i])),
  recipeById: new Map(seed.recetas.map((r) => [r.id, r])),
};
const recetas = seed.recetas.filter((r) => !r.es_preparado);
const nutricion = new Map(recetas.map((r) => [r.id, computeNutrition(r.id, source)]));

console.log(`nutriente  ingredientes con dato (de ${seed.ingredientes.length})  recetas ≥ 20 % (de ${recetas.length})`);
for (const id of CRITICOS) {
  const nutriente = seed.nutrientes.find((n) => n.id === id)!;
  const conDato = seed.ingredientes.filter((i) => i.nutrientes[nutriente.clave_ingrediente] !== undefined).length;
  const ricas = recetas.filter((r) => isRichIn(nutricion.get(r.id)!, nutriente)).length;
  console.log(`${id.padEnd(10)} ${String(conDato).padStart(4)}  ${String(ricas).padStart(4)}`);
}
