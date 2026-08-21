import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../seed';
import { escalarLineas } from './scaling';

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
