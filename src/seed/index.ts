import seedJson from './seed.json';
import {
  seedSchema,
  type Ingredient,
  type Nutrient,
  type Recipe,
  type SeasonalityItem,
  type Seed,
  type StorageItem,
} from './schema';

/**
 * Carga tipada de la semilla + índices por id. La semilla ya viene validada
 * del build; en desarrollo se re-parsea con Zod como red de seguridad extra.
 */

export interface SeedIndex {
  seed: Seed;
  ingredientById: Map<string, Ingredient>;
  recipeById: Map<string, Recipe>;
  nutrientById: Map<string, Nutrient>;
  seasonalityByIngredient: Map<string, SeasonalityItem>;
  /** variantes (variante_de → hijas) de una receta */
  variantsOf: (recipeId: string) => Recipe[];
  /** recetas cuyas líneas consumen un preparado */
  consumersOf: (recipeId: string) => Recipe[];
  /** items de conservación aplicables a un ingrediente (por id o categoría) */
  storageFor: (ingredient: Ingredient) => StorageItem[];
  /** recetas que usan un ingrediente (directo, sin recursión) */
  recipesWithIngredient: (ingredientId: string) => Recipe[];
}

function isDev(): boolean {
  return typeof import.meta.env !== 'undefined' && Boolean(import.meta.env.DEV);
}

let cachedIndex: SeedIndex | null = null;

export function getSeedIndex(): SeedIndex {
  if (cachedIndex) return cachedIndex;
  const seed: Seed = isDev() ? seedSchema.parse(seedJson) : (seedJson as unknown as Seed);

  const ingredientById = new Map(seed.ingredientes.map((i) => [i.id, i]));
  const recipeById = new Map(seed.recetas.map((r) => [r.id, r]));
  const nutrientById = new Map(seed.nutrientes.map((n) => [n.id, n]));
  const seasonalityByIngredient = new Map(seed.estacionalidad.map((s) => [s.ingrediente_id, s]));

  const variantsMap = new Map<string, Recipe[]>();
  const consumersMap = new Map<string, Recipe[]>();
  const ingredientUse = new Map<string, Recipe[]>();
  for (const receta of seed.recetas) {
    if (receta.variante_de !== undefined) {
      const list = variantsMap.get(receta.variante_de) ?? [];
      list.push(receta);
      variantsMap.set(receta.variante_de, list);
    }
    for (const linea of receta.lineas) {
      const map = linea.ref.tipo === 'receta' ? consumersMap : ingredientUse;
      const list = map.get(linea.ref.id) ?? [];
      if (!list.includes(receta)) list.push(receta);
      map.set(linea.ref.id, list);
    }
  }

  cachedIndex = {
    seed,
    ingredientById,
    recipeById,
    nutrientById,
    seasonalityByIngredient,
    variantsOf: (id) => variantsMap.get(id) ?? [],
    consumersOf: (id) => consumersMap.get(id) ?? [],
    recipesWithIngredient: (id) => ingredientUse.get(id) ?? [],
    storageFor: (ingredient) =>
      seed.conservacion.filter(
        (item) =>
          (item.aplica.tipo === 'ingrediente' && item.aplica.ids.includes(ingredient.id)) ||
          (item.aplica.tipo === 'categoria' && item.aplica.categorias.includes(ingredient.categoria)),
      ),
  };
  return cachedIndex;
}
