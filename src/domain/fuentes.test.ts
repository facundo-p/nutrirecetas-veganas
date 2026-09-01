import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../seed';
import { computeNutrition } from './nutrition';
import { ingredientesQueMasAportan, recetasQueMasAportan } from './fuentes';

const idx = getSeedIndex();
const nutricionDe = (id: string) => computeNutrition(id, idx);
const hierro = idx.nutrientById.get('hierro')!;
const b12 = idx.nutrientById.get('b12')!;

describe('recetas que más aportan un nutriente', () => {
  const porHierro = () => recetasQueMasAportan(idx, hierro, nutricionDe);

  test('vienen ordenadas de mayor a menor aporte por porción', () => {
    const cantidades = porHierro().map((f) => f.cantidad);
    expect(cantidades.length).toBeGreaterThan(5);
    for (let i = 1; i < cantidades.length; i++) {
      expect(cantidades[i - 1]!).toBeGreaterThanOrEqual(cantidades[i]!);
    }
  });

  test('una receta sin dato reportable no entra: no se rankea lo que no se sabe', () => {
    // el invariante 5 llevado al ranking: sin dato no hay puesto, ni al final
    for (const f of porHierro()) expect(f.cantidad).toBeGreaterThan(0);
  });

  test('las variantes no compiten con su madre', () => {
    for (const f of porHierro()) expect(f.receta.variante_de).toBeUndefined();
  });

  test('los preparados sí entran: un queso de maní es una fuente aunque no sea un plato', () => {
    const todas = recetasQueMasAportan(idx, hierro, nutricionDe);
    expect(todas.some((f) => f.receta.es_preparado === true)).toBe(true);
  });

  test('cada fuente trae su cobertura e IC para poder leerla con pinzas', () => {
    const primera = porHierro()[0]!;
    expect(primera.resultado.cobertura_pct).toBeGreaterThan(0);
    expect(primera.resultado.ic).not.toBeNull();
  });
});

describe('ingredientes que más aportan un nutriente', () => {
  test('vienen ordenados por aporte cada 100 g', () => {
    const cantidades = ingredientesQueMasAportan(idx, hierro).map((f) => f.cantidad);
    expect(cantidades.length).toBeGreaterThan(5);
    for (let i = 1; i < cantidades.length; i++) {
      expect(cantidades[i - 1]!).toBeGreaterThanOrEqual(cantidades[i]!);
    }
  });

  test('solo entra el que declara el nutriente con valor', () => {
    for (const f of ingredientesQueMasAportan(idx, hierro)) expect(f.cantidad).toBeGreaterThan(0);
  });

  test('un nutriente que casi ningún vegetal trae devuelve poco, no basura', () => {
    // b12: la semilla no tiene fuentes vegetales confiables
    const fuentes = ingredientesQueMasAportan(idx, b12);
    expect(fuentes.length).toBeLessThan(10);
  });
});
