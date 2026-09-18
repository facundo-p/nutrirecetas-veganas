import { describe, expect, test } from 'vitest';
import { lineaDelToken, partirPaso, tokensDePaso, type LineaDePaso } from './pasos';

const tomate: LineaDePaso = { id: 'tomate', cantidad: 400, unidad_display: 'g' };
const ajo: LineaDePaso = { id: 'ajo', cantidad: 4, unidad_display: 'diente' };

describe('tokens de cantidad en un paso', () => {
  test('el texto se parte en prosa y cantidades', () => {
    expect(partirPaso('Agregar {tomate} de tomate y {ajo} de ajo.', [tomate, ajo])).toEqual([
      { tipo: 'texto', texto: 'Agregar ' },
      { tipo: 'cantidad', linea: tomate, articulo: true },
      { tipo: 'texto', texto: ' de tomate y ' },
      { tipo: 'cantidad', linea: ajo, articulo: true },
      { tipo: 'texto', texto: ' de ajo.' },
    ]);
  });

  test('un paso sin tokens es un solo trozo de texto', () => {
    expect(partirPaso('Bajar el fuego 20 minutos.', [tomate])).toEqual([
      { tipo: 'texto', texto: 'Bajar el fuego 20 minutos.' },
    ]);
  });

  test('`~` pide la cantidad sin artículo', () => {
    expect(tokensDePaso('con {~agua} de agua')[0]).toMatchObject({ id: 'agua', articulo: false });
    expect(tokensDePaso('con {agua} de agua')[0]).toMatchObject({ id: 'agua', articulo: true });
  });

  test('`#n` elige entre dos líneas del mismo ingrediente en un paso', () => {
    const primera: LineaDePaso = { id: 'aceitunas', cantidad: 100, unidad_display: 'g' };
    const segunda: LineaDePaso = { id: 'aceitunas', cantidad: 50, unidad_display: 'g' };
    const enElPaso = [primera, segunda];
    expect(lineaDelToken(tokensDePaso('{aceitunas}')[0]!, enElPaso)).toBe(primera);
    expect(lineaDelToken(tokensDePaso('{aceitunas#2}')[0]!, enElPaso)).toBe(segunda);
    expect(lineaDelToken(tokensDePaso('{aceitunas#3}')[0]!, enElPaso)).toBeNull();
  });

  /**
   * El build rechaza un token sin línea, así que a la app no llega. Si llegara,
   * se lee crudo y el test de render lo caza por las llaves: falla a la vista,
   * no en silencio con una cantidad inventada.
   */
  test('un token que no resuelve queda como texto', () => {
    expect(partirPaso('Agregar {perejil} de perejil.', [tomate])).toEqual([
      { tipo: 'texto', texto: 'Agregar ' },
      { tipo: 'texto', texto: '{perejil}' },
      { tipo: 'texto', texto: ' de perejil.' },
    ]);
  });

  test('las llaves de la prosa normal no son tokens', () => {
    expect(tokensDePaso('Batir {con fuerza} y {A} listo')).toEqual([]);
  });
});
