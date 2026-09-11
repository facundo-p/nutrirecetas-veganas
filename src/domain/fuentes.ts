import type { SeedIndex } from '../seed';
import type { Ingredient, IngredientNutrientKey, Line, Nutrient, Recipe } from '../seed/schema';
import { midpoint } from './interval';
import { enSuBase, hasReportableValue, per100g, type NutrientResult, type RecipeNutrition } from './nutrition';

/**
 * Quién aporta qué. Es el reverso de la ficha de receta: en vez de "qué tiene
 * esto", "dónde consigo esto".
 *
 * Nadie entra al ranking sin dato reportable — el invariante 5 llevado al orden:
 * una receta de la que no sabemos nada no merece un puesto, ni siquiera el
 * último, porque el último se lee como "esta casi no tiene".
 */

export interface FuenteReceta {
  receta: Recipe;
  /** Punto medio del aporte por porción, o por 100 g si no define porciones. */
  cantidad: number;
  resultado: NutrientResult;
}

export interface FuenteIngrediente {
  ingrediente: Ingredient;
  /** Punto medio del aporte cada 100 g. */
  cantidad: number;
}

export function recetasQueMasAportan(
  idx: SeedIndex,
  nutriente: Nutrient,
  nutricionDe: (recetaId: string) => RecipeNutrition,
): FuenteReceta[] {
  const fuentes: FuenteReceta[] = [];
  for (const receta of idx.seed.recetas) {
    // una variante aparece bajo su madre en el recetario; acá compiten entre sí
    // y ganarían tres veces el mismo plato
    if (receta.variante_de !== undefined) continue;

    const base = enSuBase(nutricionDe(receta.id)).medida;
    const resultado = base.por_nutriente[nutriente.clave_ingrediente];
    if (resultado === undefined || !hasReportableValue(resultado)) continue;

    const cantidad = midpoint(resultado.intervalo);
    if (cantidad <= 0) continue;
    fuentes.push({ receta, cantidad, resultado });
  }
  // el desempate por nombre mantiene el orden estable entre renders
  return fuentes.sort((a, b) => b.cantidad - a.cantidad || a.receta.nombre.localeCompare(b.receta.nombre, 'es'));
}

export function ingredientesQueMasAportan(idx: SeedIndex, nutriente: Nutrient): FuenteIngrediente[] {
  const fuentes: FuenteIngrediente[] = [];
  for (const ingrediente of idx.seed.ingredientes) {
    const valor = ingrediente.nutrientes[nutriente.clave_ingrediente as keyof Ingredient['nutrientes']];
    if (!valor) continue;

    const cantidad = midpoint(valor.intervalo);
    if (cantidad <= 0) continue;
    fuentes.push({ ingrediente, cantidad });
  }
  return fuentes.sort(
    (a, b) => b.cantidad - a.cantidad || a.ingrediente.nombre.localeCompare(b.ingrediente.nombre, 'es'),
  );
}

export interface AporteDeLinea {
  nombre: string;
  /** Punto medio de lo que trae esa línea, en la unidad del nutriente. */
  cantidad: number;
}

/**
 * Qué líneas de una receta traen un nutriente, de más a menos. Recibe las
 * líneas y no la receta: así sirve también para la receta escalada o con un
 * sustituto puesto. Un preparado aporta lo suyo por gramo, como en el motor.
 */
export function lineasQueAportan(
  idx: SeedIndex,
  lineas: Line[],
  clave: IngredientNutrientKey,
  nutricionDe: (recetaId: string) => RecipeNutrition,
): AporteDeLinea[] {
  const aportes: AporteDeLinea[] = [];
  for (const linea of lineas) {
    let nombre: string;
    let cada100g: number | undefined;
    if (linea.ref.tipo === 'ingrediente') {
      const ingrediente = idx.ingredientById.get(linea.ref.id);
      if (!ingrediente) continue;
      nombre = ingrediente.nombre;
      const valor = ingrediente.nutrientes[clave];
      cada100g = valor ? midpoint(valor.intervalo) : undefined;
    } else {
      const preparado = idx.recipeById.get(linea.ref.id);
      if (!preparado) continue;
      nombre = preparado.nombre;
      const resultado = per100g(nutricionDe(preparado.id)).por_nutriente[clave];
      cada100g = hasReportableValue(resultado) ? midpoint(resultado.intervalo) : undefined;
    }
    if (cada100g === undefined) continue;
    const cantidad = (cada100g * linea.g_aprox) / 100;
    if (cantidad > 0) aportes.push({ nombre, cantidad });
  }
  return aportes.sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, 'es'));
}
