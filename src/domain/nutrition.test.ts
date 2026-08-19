import { describe, expect, test } from 'vitest';
import type { Ingredient, Recipe } from '../seed/schema';
import { midpoint } from './interval';
import { computeNutrition, per100g, perPortion, type NutritionSource } from './nutrition';

// ---------- fixtures sintéticos ----------

function ing(id: string, extra: Partial<Ingredient>): Ingredient {
  return {
    id,
    nombre: id,
    sinonimos: [],
    categoria: 'legumbre',
    nutrientes: {},
    ic: 8,
    fuentes: [],
    ...extra,
  };
}

function rec(id: string, extra: Partial<Recipe>): Recipe {
  return {
    id,
    nombre: id,
    tipo: 'salada',
    es_preparado: false,
    porciones_num: 2,
    porciones_display: '2 porciones',
    estado: 'probada',
    ic: 8,
    set_origen: 'P',
    usa_preparados: [],
    dificultad: 'fácil',
    tiempo_prep_min: 5,
    tiempo_coccion_min: 5,
    lineas: [],
    pasos: ['x'],
    secretos_chef: [],
    reglas: [],
    utensilios: [],
    ...extra,
  };
}

function linea(refId: string, g: number, tipo: 'ingrediente' | 'receta' = 'ingrediente') {
  return { ref: { tipo, id: refId }, cantidad: g, unidad_display: 'g', g_aprox: g, sustitutos: [] };
}

function source(ingredients: Ingredient[], recipes: Recipe[]): NutritionSource {
  return {
    ingredientById: new Map(ingredients.map((i) => [i.id, i])),
    recipeById: new Map(recipes.map((r) => [r.id, r])),
  };
}

const conHierro = ing('lentejas', {
  kcal: { intervalo: { min: 116, max: 116 } },
  nutrientes: { hierro_mg: { intervalo: { min: 3, max: 3 } } },
  ic: 8,
});
const sinDatos = ing('especia_x', {});
const conRango = ing('alga_x', {
  nutrientes: { yodo_ug: { intervalo: { min: 16, max: 43 } } },
  ic: 5,
});

describe('computeNutrition — casos sintéticos', () => {
  test('suma por 100 g → g_aprox, y la masa sin dato baja la cobertura', () => {
    const receta = rec('x', { lineas: [linea('lentejas', 200), linea('especia_x', 200)] });
    const n = computeNutrition('x', source([conHierro, sinDatos], [receta]));
    expect(n.masa_total_g).toBe(400);
    expect(n.por_nutriente.hierro_mg.intervalo).toEqual({ min: 6, max: 6 });
    expect(n.por_nutriente.hierro_mg.cobertura_pct).toBe(50);
    expect(n.por_nutriente.hierro_mg.ic).toBe(8);
    // nadie aporta zinc: intervalo cero pero con cobertura 0 e IC null (jamás cero en silencio)
    expect(n.por_nutriente.zinc_mg.cobertura_pct).toBe(0);
    expect(n.por_nutriente.zinc_mg.ic).toBeNull();
  });

  test('los rangos se propagan como intervalos', () => {
    const receta = rec('x', { lineas: [linea('alga_x', 50)] });
    const n = computeNutrition('x', source([conRango], [receta]));
    expect(n.por_nutriente.yodo_ug.intervalo).toEqual({ min: 8, max: 21.5 });
    expect(n.por_nutriente.yodo_ug.ic).toBe(5);
  });

  test('IC ponderado por masa entre ingredientes que aportan', () => {
    const otro = ing('otro', { nutrientes: { hierro_mg: { intervalo: { min: 1, max: 1 } } }, ic: 4 });
    const receta = rec('x', { lineas: [linea('lentejas', 300), linea('otro', 100)] });
    const n = computeNutrition('x', source([conHierro, otro], [receta]));
    // (8·300 + 4·100) / 400 = 7
    expect(n.por_nutriente.hierro_mg.ic).toBe(7);
  });

  test('recursión de preparados: usa rendimiento_g, no la masa de insumos', () => {
    // preparado: 400 g de lentejas rinden 200 g → por 100 g de preparado hay 6 mg de hierro
    const prep = rec('prep', { es_preparado: true, rendimiento_g: 200, lineas: [linea('lentejas', 400)] });
    const consumidora = rec('y', { lineas: [linea('prep', 50, 'receta')] });
    const n = computeNutrition('y', source([conHierro], [prep, consumidora]));
    expect(n.por_nutriente.hierro_mg.intervalo).toEqual({ min: 3, max: 3 });
    expect(n.por_nutriente.hierro_mg.cobertura_pct).toBe(100);
    expect(n.masa_total_g).toBe(50);
  });

  test('la cobertura parcial de un preparado se hereda proporcionalmente', () => {
    const prep = rec('prep', {
      es_preparado: true,
      rendimiento_g: 400,
      lineas: [linea('lentejas', 200), linea('especia_x', 200)],
    });
    const consumidora = rec('y', { lineas: [linea('prep', 100, 'receta')] });
    const n = computeNutrition('y', source([conHierro, sinDatos], [prep, consumidora]));
    expect(n.por_nutriente.hierro_mg.cobertura_pct).toBe(50);
  });

  test('alerta B12 se dispara directa y vía preparado', () => {
    const levadura = ing('levadura_nutricional', {
      nutrientes: { b12_ug: { intervalo: { min: 0, max: 100 } } },
    });
    const directa = rec('a', { lineas: [linea('levadura_nutricional', 10)] });
    const prep = rec('prep', { es_preparado: true, rendimiento_g: 100, lineas: [linea('levadura_nutricional', 10)] });
    const indirecta = rec('b', { lineas: [linea('prep', 50, 'receta')] });
    const sinLev = rec('c', { lineas: [linea('lentejas', 100)] });
    const s = source([levadura, conHierro], [directa, prep, indirecta, sinLev]);
    expect(computeNutrition('a', s).alerta_b12).toBe(true);
    expect(computeNutrition('b', s).alerta_b12).toBe(true);
    expect(computeNutrition('c', s).alerta_b12).toBe(false);
  });

  test('un ciclo artificial revienta con mensaje claro', () => {
    const a = rec('a', { es_preparado: true, rendimiento_g: 100, lineas: [linea('b', 50, 'receta')] });
    const b = rec('b', { es_preparado: true, rendimiento_g: 100, lineas: [linea('a', 50, 'receta')] });
    expect(() => computeNutrition('a', source([], [a, b]))).toThrow(/Ciclo de preparados/);
  });

  test('perPortion divide por porciones; per100g usa rendimiento o masa', () => {
    const receta = rec('x', { porciones_num: 4, lineas: [linea('lentejas', 400)] });
    const n = computeNutrition('x', source([conHierro], [receta]));
    const porcion = perPortion(n)!;
    expect(porcion.por_nutriente.hierro_mg.intervalo).toEqual({ min: 3, max: 3 });
    expect(porcion.kcal.intervalo.min).toBeCloseTo(116);
    const cien = per100g(n);
    expect(cien.por_nutriente.hierro_mg.intervalo.min).toBeCloseTo(3);
    const libre = rec('libre', { porciones_num: null, lineas: [linea('lentejas', 100)] });
    expect(perPortion(computeNutrition('libre', source([conHierro], [libre])))).toBeNull();
  });

  test('propiedad: escalar una receta ×2 duplica el intervalo', () => {
    const receta1 = rec('x1', { lineas: [linea('alga_x', 50)] });
    const receta2 = rec('x2', { lineas: [linea('alga_x', 100)] });
    const s = source([conRango], [receta1, receta2]);
    const n1 = computeNutrition('x1', s);
    const n2 = computeNutrition('x2', s);
    expect(n2.por_nutriente.yodo_ug.intervalo.min).toBeCloseTo(n1.por_nutriente.yodo_ug.intervalo.min * 2);
    expect(n2.por_nutriente.yodo_ug.intervalo.max).toBeCloseTo(n1.por_nutriente.yodo_ug.intervalo.max * 2);
    expect(midpoint(n2.por_nutriente.yodo_ug.intervalo)).toBeCloseTo(midpoint(n1.por_nutriente.yodo_ug.intervalo) * 2);
  });
});
