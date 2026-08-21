import { describe, expect, test } from 'vitest';
import { formatCantidad } from './format';

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
