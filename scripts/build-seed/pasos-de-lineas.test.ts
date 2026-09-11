import { beforeAll, describe, expect, test } from 'vitest';
import { PASO_DE_CADA_LINEA } from './curated-tables';
import { loadRawData } from './load';
import { asignarPasos, transformRecipes } from './transform';
import type { Recipe } from '../../src/seed/schema';

let recetas: Recipe[];

beforeAll(() => {
  const raw = loadRawData();
  const equipmentIds = new Set((raw.utensilios.equipos as Array<{ id: string }>).map((e) => e.id));
  recetas = transformRecipes(raw, equipmentIds);
});

describe('el paso de cada línea (T14)', () => {
  test('las 84 recetas lo tienen, y cada línea cae en un paso que existe', () => {
    expect(Object.keys(PASO_DE_CADA_LINEA)).toHaveLength(recetas.length);
    for (const r of recetas) {
      for (const [i, l] of r.lineas.entries()) {
        expect(l.paso === null || (l.paso >= 0 && l.paso < r.pasos.length), `${r.id}, línea ${i}`).toBe(true);
      }
    }
  });

  test('ningún imprescindible queda sin paso', () => {
    const sinPaso = recetas.flatMap((r) => r.lineas.filter((l) => l.imprescindible && l.paso === null).map(() => r.id));
    expect(sinPaso).toEqual([]);
  });
});

describe('la guarda del build (T14)', () => {
  const linea = (imprescindible = false) => ({
    ref: { tipo: 'ingrediente' as const, id: 'garbanzos' },
    cantidad: 100,
    unidad_display: 'g',
    g_aprox: 100,
    sustitutos: [],
    ...(imprescindible ? { imprescindible } : {}),
  });
  const pasos = ['Remojar.', 'Cocinar.'];

  test('la tabla cuenta desde 1; la semilla guarda el índice', () => {
    const lineas = asignarPasos('x', [linea(), linea()], pasos, { x: [2, null] });
    expect(lineas.map((l) => l.paso)).toEqual([1, null]);
  });

  test('una receta sin mapeo rompe el build', () => {
    expect(() => asignarPasos('x', [linea()], pasos, {})).toThrow(/x sin el paso de cada línea/);
  });

  test('una posición de más o de menos rompe el build', () => {
    expect(() => asignarPasos('x', [linea()], pasos, { x: [1, 2] })).toThrow(/1 líneas y 2 posiciones/);
  });

  test('un paso que no existe rompe el build', () => {
    expect(() => asignarPasos('x', [linea()], pasos, { x: [3] })).toThrow(/el paso 3 no existe/);
    expect(() => asignarPasos('x', [linea()], pasos, { x: [0] })).toThrow(/el paso 0 no existe/);
  });

  test('un imprescindible sin paso rompe el build', () => {
    expect(() => asignarPasos('x', [linea(true)], pasos, { x: [null] })).toThrow(/imprescindible sin paso/);
  });
});
