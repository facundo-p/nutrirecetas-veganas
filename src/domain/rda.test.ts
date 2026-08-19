import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../seed';
import { computeNutrition } from './nutrition';
import { genericReferenceRda, isRichIn, resolveRda } from './rda';

const idx = getSeedIndex();
const nutrient = (id: string) => idx.nutrientById.get(id)!;

describe('resolveRda (T4)', () => {
  test('hierro para mujer de 30: 18 mg (sin ajuste, que es aparte)', () => {
    expect(resolveRda(nutrient('hierro'), 'femenino', 30)).toEqual({ valor: 18 });
  });

  test('hierro para mujer de 60: ventana posmenopausia', () => {
    expect(resolveRda(nutrient('hierro'), 'femenino', 60)).toEqual({ valor: 8 });
  });

  test('calcio para hombre de 60: sin ventana exacta → aproximada', () => {
    const r = resolveRda(nutrient('calcio'), 'masculino', 60);
    expect(r.aproximada).toBe(true);
    expect(r.valor).toBeGreaterThan(0);
  });

  test('proteína es por kg de peso', () => {
    const r80 = resolveRda(nutrient('proteina'), 'masculino', 35, 80);
    const r60 = resolveRda(nutrient('proteina'), 'masculino', 35, 60);
    expect(r80.valor / r60.valor).toBeCloseTo(80 / 60);
  });
});

describe('genericReferenceRda', () => {
  test('hierro: máx adulto 18 × factor vegano 1.8 = 32.4', () => {
    expect(genericReferenceRda(nutrient('hierro'))).toBeCloseTo(32.4);
  });

  test('vitc no tiene factor vegano: queda el máximo adulto', () => {
    const vitc = nutrient('vitc');
    expect(genericReferenceRda(vitc)).toBe(Math.max(...vitc.rda.map((e) => e.valor)));
  });
});

describe('isRichIn contra la semilla real', () => {
  test('el curry de garbanzos y seitán (p12) es rico en proteína', () => {
    expect(isRichIn(computeNutrition('p12', idx), nutrient('proteina'))).toBe(true);
  });

  test('alguna receta del recetario es rica en hierro y ninguna afirma sin datos', () => {
    const hierro = nutrient('hierro');
    const ricas = idx.seed.recetas.filter((r) => isRichIn(computeNutrition(r.id, idx), hierro));
    expect(ricas.length).toBeGreaterThan(0);
    expect(ricas.length).toBeLessThan(84);
  });
});
