import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { INGREDIENT_CATEGORIES, INGREDIENT_NUTRIENT_KEYS, type Seed } from '../../src/seed/schema';
import { loadRawData } from './load';
import { compileRule } from './rules-ast';
import {
  transformEquivalences,
  transformGlossary,
  transformIngredient,
  transformNutrient,
  transformRecipes,
  transformSeasonality,
  transformStorage,
} from './transform';
import { finalizeSeed } from './validate';

const SEED_SCHEMA_VERSION = '1.0.0';
const SEED_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'seed', 'seed.json');

export function buildSeed(): { seed: Seed; notes: string[] } {
  const raw = loadRawData();
  const notes: string[] = [];

  const ingredientes = raw.ingredientes.map(transformIngredient);
  const nutrientes = raw.nutrientes.map(transformNutrient);

  const ruleCtx = {
    ingredientIds: new Set(ingredientes.map((i) => i.id)),
    categories: new Set<string>(INGREDIENT_CATEGORIES),
    nutrientIds: new Set(nutrientes.map((n) => n.id)),
    ingredientNutrientKeys: new Set<string>(INGREDIENT_NUTRIENT_KEYS),
  };
  const reglas = raw.reglas.map((r) => compileRule(r, ruleCtx));

  const utensiliosRaw = raw.utensilios as {
    equipos: Seed['utensilios']['equipos'];
    reglas_utensilio: Seed['utensilios']['reglas_utensilio'];
  };
  const utensilios = { equipos: utensiliosRaw.equipos, reglas_utensilio: utensiliosRaw.reglas_utensilio };

  const recetas = transformRecipes(raw, new Set(utensilios.equipos.map((e) => e.id)));

  const seasonality = transformSeasonality(raw.estacionalidad, ruleCtx.ingredientIds);
  for (const id of seasonality.descartados) {
    notes.push(`estacionalidad: "${id}" descartado (sin ficha de ingrediente) — pregunta abierta del gate`);
  }

  const seedSinHash: Omit<Seed, 'content_hash'> = {
    seed_schema_version: SEED_SCHEMA_VERSION,
    dataset_version: '1.0',
    ingredientes,
    nutrientes,
    reglas,
    recetas,
    equivalencias: transformEquivalences(raw.equivalencias),
    estacionalidad: seasonality.items,
    conservacion: transformStorage(raw.conservacion, ruleCtx.ingredientIds),
    glosario: transformGlossary(raw.glosario),
    utensilios,
  };

  const previous: Seed | null = existsSync(SEED_PATH)
    ? (JSON.parse(readFileSync(SEED_PATH, 'utf8')) as Seed)
    : null;

  return { seed: finalizeSeed(seedSinHash, previous), notes };
}

function main(): void {
  const { seed, notes } = buildSeed();
  writeFileSync(SEED_PATH, JSON.stringify(seed, null, 1) + '\n');
  const kb = Math.round(Buffer.byteLength(JSON.stringify(seed)) / 1024);
  console.log(
    `✔ semilla v${seed.seed_schema_version} (${seed.content_hash.slice(0, 12)}…) — ` +
      `${seed.recetas.length} recetas, ${seed.ingredientes.length} ingredientes, ` +
      `${seed.nutrientes.length} nutrientes, ${seed.reglas.length} reglas — ${kb} KB`,
  );
  for (const note of notes) console.log(`  ⚠ ${note}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
