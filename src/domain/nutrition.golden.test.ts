import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../seed';
import { midpoint } from './interval';
import { computeNutrition, hasReportableValue, perPortion } from './nutrition';

/**
 * Golden tests contra la semilla real. Los valores esperados fueron calculados
 * el 2026-08-19 con un script independiente (suma directa g_aprox × valor/100 g,
 * preparados vía rendimiento_g) — no con el motor. Si cambian, o cambió la
 * semilla o se rompió el motor: averiguar cuál antes de tocar el test.
 */

const idx = getSeedIndex();

describe('golden: r01 sopa de lentejas rojas (set 1, sin preparados)', () => {
  const n = computeNutrition('r01', idx);

  test('masa total y porciones', () => {
    expect(n.masa_total_g).toBe(2032);
    expect(n.porciones_num).toBe(4);
  });

  test('kcal por porción ≈ 244.4 con cobertura ~99.7 %', () => {
    const porcion = perPortion(n)!;
    expect(midpoint(porcion.kcal.intervalo)).toBeCloseTo(244.44, 1);
    expect(n.kcal.cobertura_pct).toBeCloseTo(99.7, 1);
  });

  test('hierro total 10.456 mg; la masa de agua/caldo sin dato mineral baja la cobertura a ~16.7 %', () => {
    expect(n.por_nutriente.hierro_mg.intervalo.min).toBeCloseTo(10.456, 3);
    expect(n.por_nutriente.hierro_mg.intervalo.max).toBeCloseTo(10.456, 3);
    expect(n.por_nutriente.hierro_mg.cobertura_pct).toBeCloseTo(16.73, 1);
  });

  test('sin alerta B12', () => {
    expect(n.alerta_b12).toBe(false);
  });
});

describe('golden: p19 pastel de papas (encadena p04 queso de maní y usa levadura)', () => {
  const n = computeNutrition('p19', idx);

  test('masa total incluye la línea migrada de 250 g de p04', () => {
    expect(n.masa_total_g).toBe(2058);
    expect(n.porciones_num).toBe(6);
  });

  test('kcal por porción ≈ 464 con banda (el rango viene de p04)', () => {
    const porcion = perPortion(n)!;
    expect(midpoint(porcion.kcal.intervalo)).toBeCloseTo(463.99, 1);
    expect(n.kcal.intervalo.min).toBeCloseTo(2741.93, 1);
    expect(n.kcal.intervalo.max).toBeCloseTo(2825.93, 1);
  });

  test('proteína total [172.57, 182.57] g con cobertura ~91.5 %', () => {
    expect(n.por_nutriente.prot_g.intervalo.min).toBeCloseTo(172.567, 2);
    expect(n.por_nutriente.prot_g.intervalo.max).toBeCloseTo(182.567, 2);
    // el agua del queso de maní (p04) cuenta como cubierta: aporta cero de verdad
    expect(n.por_nutriente.prot_g.cobertura_pct).toBeCloseTo(91.53, 1);
  });

  test('calcio total 243.55 mg con cobertura ~86.7 %', () => {
    // 2026-10-07 (#169): el calcio de USDA de la papa, la cebolla y el maní hizo
    // que el cero de antes —que era "sin datos"— pase a dato. Recalculado por
    // fuera del motor, con el mismo método del encabezado.
    const calcio = n.por_nutriente.calcio_mg;
    expect(calcio.intervalo.min).toBeCloseTo(243.545, 2);
    expect(calcio.intervalo.max).toBeCloseTo(243.545, 2);
    expect(calcio.cobertura_pct).toBeCloseTo(86.7, 1);
    expect(hasReportableValue(calcio)).toBe(true);
  });

  test('alerta B12: p19 usa levadura nutricional directa', () => {
    expect(n.alerta_b12).toBe(true);
  });
});

describe('golden: p44 masa de pizza (la sal yodada, por 100 g desde #169)', () => {
  // 24 g de sal yodada a 2500–4167 µg/100 g, en 5 porciones. Calculado por
  // fuera del motor el 2026-10-07; fija la corrección de unidad de T16.
  const n = computeNutrition('p44', idx);

  test('yodo por porción 120–200 µg', () => {
    const porcion = perPortion(n)!;
    expect(porcion.por_nutriente.yodo_ug.intervalo.min).toBeCloseTo(120, 1);
    expect(porcion.por_nutriente.yodo_ug.intervalo.max).toBeCloseTo(200.02, 1);
  });
});

describe('golden: preparados solos', () => {
  test('p04 (queso de maní) calcula por 100 g vía rendimiento 500 g', () => {
    const n = computeNutrition('p04', idx);
    expect(n.rendimiento_g).toBe(500);
    expect(n.porciones_num).toBeNull();
    expect(n.alerta_b12).toBe(true); // lleva levadura nutricional
  });

  test('las 84 recetas calculan sin excepción', () => {
    for (const receta of idx.seed.recetas) {
      const n = computeNutrition(receta.id, idx);
      expect(n.masa_total_g).toBeGreaterThan(0);
      expect(Number.isFinite(midpoint(n.kcal.intervalo))).toBe(true);
    }
  });
});
