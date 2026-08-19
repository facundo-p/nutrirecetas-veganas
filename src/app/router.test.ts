import { describe, expect, test } from 'vitest';
import { parseHash, routeHash } from './router';

describe('router hash', () => {
  test('rutas conocidas', () => {
    expect(parseHash('#/recetario')).toEqual({ screen: 'recipes' });
    expect(parseHash('#/receta/p19')).toEqual({ screen: 'recipe', id: 'p19' });
    expect(parseHash('#/ingredientes')).toEqual({ screen: 'ingredients' });
    expect(parseHash('#/ingrediente/garbanzos')).toEqual({ screen: 'ingredient', id: 'garbanzos' });
    expect(parseHash('#/glosario')).toEqual({ screen: 'glossary' });
  });

  test('default y rutas rotas caen al recetario', () => {
    expect(parseHash('')).toEqual({ screen: 'recipes' });
    expect(parseHash('#/lo-que-sea')).toEqual({ screen: 'recipes' });
    expect(parseHash('#/receta/')).toEqual({ screen: 'recipes' });
  });

  test('ida y vuelta hash ↔ ruta', () => {
    for (const hash of ['#/recetario', '#/receta/p19', '#/ingredientes', '#/ingrediente/garbanzos', '#/glosario']) {
      expect(routeHash(parseHash(hash))).toBe(hash);
    }
  });
});
