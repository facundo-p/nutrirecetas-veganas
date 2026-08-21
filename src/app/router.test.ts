import { describe, expect, test } from 'vitest';
import { parseHash, routeHash } from './router';

describe('router hash', () => {
  test('rutas conocidas', () => {
    expect(parseHash('#/hoy')).toEqual({ screen: 'today' });
    expect(parseHash('#/recetario')).toEqual({ screen: 'recipes' });
    expect(parseHash('#/cocinar/r01')).toEqual({ screen: 'cook', id: 'r01' });
    expect(parseHash('#/diario')).toEqual({ screen: 'diary' });
    expect(parseHash('#/perfil')).toEqual({ screen: 'profile' });
    expect(parseHash('#/ajustes')).toEqual({ screen: 'settings' });
    expect(parseHash('#/receta/p19')).toEqual({ screen: 'recipe', id: 'p19' });
    expect(parseHash('#/ingredientes')).toEqual({ screen: 'ingredients' });
    expect(parseHash('#/ingrediente/garbanzos')).toEqual({ screen: 'ingredient', id: 'garbanzos' });
    expect(parseHash('#/glosario')).toEqual({ screen: 'glossary' });
  });

  test('la app abre en Hoy, y una ruta rota también', () => {
    expect(parseHash('')).toEqual({ screen: 'today' });
    expect(parseHash('#/lo-que-sea')).toEqual({ screen: 'today' });
  });

  test('una receta sin id vuelve al recetario', () => {
    expect(parseHash('#/receta/')).toEqual({ screen: 'recipes' });
    expect(parseHash('#/cocinar/')).toEqual({ screen: 'recipes' });
  });

  test('ida y vuelta hash ↔ ruta', () => {
    for (const hash of [
      '#/hoy',
      '#/recetario',
      '#/receta/p19',
      '#/cocinar/p19',
      '#/ingredientes',
      '#/ingrediente/garbanzos',
      '#/glosario',
      '#/diario',
      '#/perfil',
      '#/ajustes',
    ]) {
      expect(routeHash(parseHash(hash))).toBe(hash);
    }
  });
});
