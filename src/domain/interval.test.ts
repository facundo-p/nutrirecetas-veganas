import { describe, expect, test } from 'vitest';
import { add, interval, midpoint, scale, sum } from './interval';

describe('aritmética de intervalos (arquitectura §5)', () => {
  test('un valor puntual colapsa a min === max', () => {
    expect(interval(42)).toEqual({ min: 42, max: 42 });
  });

  test('sumar intervalos suma extremo a extremo', () => {
    expect(add({ min: 1, max: 3 }, { min: 10, max: 20 })).toEqual({ min: 11, max: 23 });
  });

  test('escalar ×k multiplica ambos extremos (×2 duplica el intervalo)', () => {
    expect(scale({ min: 5, max: 8 }, 2)).toEqual({ min: 10, max: 16 });
    expect(scale(interval(7), 0.5)).toEqual({ min: 3.5, max: 3.5 });
  });

  test('punto medio', () => {
    expect(midpoint({ min: 380, max: 520 })).toBe(450);
    expect(midpoint(interval(9))).toBe(9);
  });

  test('sum agrega una lista (vacía = intervalo cero)', () => {
    expect(sum([interval(1), { min: 2, max: 4 }, interval(3)])).toEqual({ min: 6, max: 8 });
    expect(sum([])).toEqual({ min: 0, max: 0 });
  });

  // property checks tabulados (sin dependencia extra):
  test('propiedad: el punto medio de la suma = suma de los puntos medios', () => {
    const casos = [
      [{ min: 0, max: 10 }, { min: 5, max: 5 }, { min: 2, max: 8 }],
      [{ min: 1.5, max: 2.5 }, { min: 0, max: 0.1 }],
      [{ min: 100, max: 300 }, { min: 50, max: 70 }, { min: 0, max: 0 }, { min: 3, max: 9 }],
    ];
    for (const xs of casos) {
      const esperado = xs.reduce((acc, x) => acc + midpoint(x), 0);
      expect(midpoint(sum(xs))).toBeCloseTo(esperado, 10);
    }
  });

  test('propiedad: escalar ×2 duplica el ancho de banda', () => {
    const casos = [
      { min: 0, max: 10 },
      { min: 3, max: 3 },
      { min: 1.2, max: 9.9 },
    ];
    for (const x of casos) {
      const doble = scale(x, 2);
      expect(doble.max - doble.min).toBeCloseTo((x.max - x.min) * 2, 10);
      expect(midpoint(doble)).toBeCloseTo(midpoint(x) * 2, 10);
    }
  });
});
