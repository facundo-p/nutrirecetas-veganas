import { describe, expect, test } from 'vitest';
import { cantidadEditable, formatCantidad, formatPorcentaje, leerNumero } from './format';

describe('formatCantidad', () => {
  test('los cuartos se muestran como fracción, no como decimal', () => {
    expect(formatCantidad(0.25)).toBe('¼');
    expect(formatCantidad(0.5)).toBe('½');
    expect(formatCantidad(0.75)).toBe('¾');
  });

  test('con parte entera, la fracción se le pega al lado', () => {
    expect(formatCantidad(1.25)).toBe('1¼');
    expect(formatCantidad(1.5)).toBe('1½');
    expect(formatCantidad(3.5)).toBe('3½');
  });

  test('un entero se muestra entero, sin coma ni fracción', () => {
    expect(formatCantidad(2)).toBe('2');
    expect(formatCantidad(210)).toBe('210');
  });

  test('lo que no cae en un cuarto se muestra con coma decimal', () => {
    expect(formatCantidad(0.8)).toBe('0,8');
    expect(formatCantidad(0.2)).toBe('0,2');
  });
});

describe('formatPorcentaje', () => {
  test('debajo de 10 lleva un decimal, con coma; desde 10, entero', () => {
    expect(formatPorcentaje(9.44)).toBe('9,4 %');
    expect(formatPorcentaje(38.2)).toBe('38 %');
  });
});

describe('lo que se tipea en una cantidad', () => {
  test('se lee con coma o con punto', () => {
    expect(leerNumero('1,5')).toBe(1.5);
    expect(leerNumero('1.5')).toBe(1.5);
    expect(leerNumero(' 300 ')).toBe(300);
  });

  test('lo que no es número, o está a medio tipear, no se lee', () => {
    for (const texto of ['', 'abc', '1,', '1,5,2', '-2']) expect(leerNumero(texto)).toBeNull();
  });

  test('en un campo, la cantidad va con coma y sin glifos de fracción', () => {
    expect(cantidadEditable(1.5)).toBe('1,5');
    expect(cantidadEditable(0.25)).toBe('0,25');
    expect(cantidadEditable(3)).toBe('3');
  });
});
