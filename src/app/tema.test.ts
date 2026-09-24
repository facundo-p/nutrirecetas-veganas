import { describe, expect, test } from 'vitest';
import { leerPreferencia, resolverTema } from './tema';

describe('resolverTema', () => {
  test('en automático sigue al sistema', () => {
    expect(resolverTema('auto', true)).toBe('musgo');
    expect(resolverTema('auto', false)).toBe('papel');
  });

  test('una preferencia fija no mira al sistema', () => {
    expect(resolverTema('papel', true)).toBe('papel');
    expect(resolverTema('musgo', false)).toBe('musgo');
  });
});

describe('leerPreferencia', () => {
  test('la URL manda sobre lo guardado', () => {
    expect(leerPreferencia('musgo', 'papel')).toBe('musgo');
    expect(leerPreferencia('auto', 'musgo')).toBe('auto');
  });

  test('sin URL vale lo guardado', () => {
    expect(leerPreferencia(null, 'musgo')).toBe('musgo');
  });

  test('una URL inválida no pisa lo guardado', () => {
    expect(leerPreferencia('g', 'papel')).toBe('papel');
  });

  test('un tema que ya no existe cuenta como automático', () => {
    for (const viejo of ['g', 'e', 'f']) expect(leerPreferencia(null, viejo)).toBe('auto');
  });

  test('sin nada guardado, automático', () => {
    expect(leerPreferencia(null, null)).toBe('auto');
  });
});
