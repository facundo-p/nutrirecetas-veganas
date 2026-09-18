import { describe, expect, test } from 'vitest';
import { unidadDecible } from './unidades-decibles';

describe('qué unidades se saben decir en un paso', () => {
  test('la cabeza manda: lo que sigue describe, no mide', () => {
    expect(unidadDecible('taza_cocidos_calientes')?.plural).toBe('tazas');
    expect(unidadDecible('g_cocidos_enjuagados')?.plural).toBe('g');
    expect(unidadDecible('cdta_ahumado')?.singular).toBe('cucharadita');
    expect(unidadDecible('taza_base + 1.25 relleno')?.singular).toBe('taza');
  });

  test('la abreviatura del dataset se dice con la palabra', () => {
    expect(unidadDecible('cda')?.plural).toBe('cucharadas');
    expect(unidadDecible('cucharadas')?.singular).toBe('cucharada');
    expect(unidadDecible('gr')?.singular).toBe('g');
    expect(unidadDecible('cc')?.singular).toBe('ml');
  });

  /**
   * Las piezas descriptivas quedan afuera a propósito: la unidad es el adjetivo
   * («1 mediana» de cebolla) y el sustantivo que habría que pluralizar está en
   * la prosa. Para esas, el paso no dice la cantidad y la dice la lista.
   */
  test('las piezas descriptivas no se saben decir', () => {
    for (const unidad of ['mediana', 'grande', 'jugo_de_1', 'maduras', 'rallada', 'unidad']) {
      expect(unidadDecible(unidad), unidad).toBeNull();
    }
  });
});
