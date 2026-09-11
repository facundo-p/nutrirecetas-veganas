import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../seed';
import { escalarLineas, FACTOR_MAX, FACTOR_MIN, factorDesdeLinea, lineaAGusto } from './scaling';

const idx = getSeedIndex();
const r04 = idx.recipeById.get('r04')!; // boloñesa: 6 porciones, mezcla las cuatro familias de unidad

describe('escalarLineas redondea con criterio (issue #46)', () => {
  test('sin cambio de factor las líneas son las mismas: la semilla no se toca', () => {
    expect(escalarLineas(r04.lineas, 1)).toEqual(r04.lineas);
  });

  test('bajar de 6 a 5 porciones no deja un solo decimal de gramo', () => {
    for (const linea of escalarLineas(r04.lineas, 5 / 6)) {
      if (linea.g_aprox >= 1) expect(linea.g_aprox % 1).toBe(0);
    }
  });

  test('las piezas se parten en cuartos, no en tercios', () => {
    const mediana = r04.lineas.findIndex((l) => l.unidad_display === 'mediana');
    expect(escalarLineas(r04.lineas, 5 / 6)[mediana]!.cantidad).toBe(0.75);
  });

  test('los gramos siguen a la cantidad redondeada, no al lineal', () => {
    const i = r04.lineas.findIndex((l) => l.unidad_display === 'mediana');
    const base = r04.lineas[i]!;
    const escalada = escalarLineas(r04.lineas, 5 / 6)[i]!;
    expect(escalada.g_aprox).toBeLessThanOrEqual(base.g_aprox * 0.8);
  });

  test('la cucharada se mueve de a cuartos', () => {
    const i = r04.lineas.findIndex((l) => l.unidad_display === 'cda');
    expect(escalarLineas(r04.lineas, 5 / 6)[i]!.cantidad).toBe(1.75);
  });

  test('duplicar sigue dando el doble en las líneas de la receta base', () => {
    const dobles = escalarLineas(r04.lineas, 2);
    for (const [i, linea] of dobles.entries()) {
      expect(linea.cantidad).toBe(r04.lineas[i]!.cantidad * 2);
    }
  });
});

describe('escalar desde un ingrediente (#161)', () => {
  const base = r04.lineas.find((l) => l.cantidad > 0)!;

  test('el factor es lo nuevo sobre lo que pedía la receta, en la unidad de la línea', () => {
    expect(factorDesdeLinea(base, base.cantidad * 2)).toBeCloseTo(2, 10);
    expect(factorDesdeLinea(base, base.cantidad / 2)).toBeCloseTo(0.5, 10);
  });

  test('queda dentro de lo que admite el selector de porciones', () => {
    expect(factorDesdeLinea(base, base.cantidad * 10)).toBe(FACTOR_MAX);
    expect(factorDesdeLinea(base, base.cantidad / 10)).toBe(FACTOR_MIN);
  });

  test('un valor que no sirve no da factor', () => {
    for (const valor of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) expect(factorDesdeLinea(base, valor)).toBeNull();
    expect(factorDesdeLinea({ ...base, cantidad: 0 }, 5)).toBeNull();
  });

  test('van a gusto las especias y los ids puntuales; una legumbre o un preparado, no', () => {
    const conRef = (ref: typeof base.ref) => ({ ...base, ref });
    const especia = idx.seed.ingredientes.find((i) => i.categoria === 'especia')!;
    const legumbre = idx.seed.ingredientes.find((i) => i.categoria === 'legumbre')!;
    expect(lineaAGusto(conRef({ tipo: 'ingrediente', id: especia.id }), idx.ingredientById)).toBe(true);
    // levadura_fresca no es especia ni condimento: entra por su id
    expect(lineaAGusto(conRef({ tipo: 'ingrediente', id: 'levadura_fresca' }), idx.ingredientById)).toBe(true);
    expect(lineaAGusto(conRef({ tipo: 'ingrediente', id: legumbre.id }), idx.ingredientById)).toBe(false);
    expect(lineaAGusto(conRef({ tipo: 'receta', id: 'p04' }), idx.ingredientById)).toBe(false);
  });
});
