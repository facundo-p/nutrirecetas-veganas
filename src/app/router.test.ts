import { describe, expect, test } from 'vitest';
import { parseHash, routeHash } from './router';

describe('router hash', () => {
  test('rutas conocidas', () => {
    expect(parseHash('#/recetario')).toEqual({ screen: 'recipes' });
    expect(parseHash('#/cocinar/r01')).toEqual({ screen: 'cook', id: 'r01' });
    expect(parseHash('#/diario')).toEqual({ screen: 'diary' });
    expect(parseHash('#/perfil')).toEqual({ screen: 'profile' });
    expect(parseHash('#/ajustes')).toEqual({ screen: 'settings' });
    expect(parseHash('#/receta/p19')).toEqual({ screen: 'recipe', id: 'p19' });
    expect(parseHash('#/ingredientes')).toEqual({ screen: 'ingredients' });
    expect(parseHash('#/ingrediente/garbanzos')).toEqual({ screen: 'ingredient', id: 'garbanzos' });
    expect(parseHash('#/glosario')).toEqual({ screen: 'glossary' });
    expect(parseHash('#/nutrientes')).toEqual({ screen: 'nutrients' });
    expect(parseHash('#/nutriente/hierro')).toEqual({ screen: 'nutrient', id: 'hierro' });
  });

  test('un nutriente sin id vuelve a la lista', () => {
    expect(parseHash('#/nutriente/')).toEqual({ screen: 'nutrients' });
  });

  test('la app abre en el recetario, y una ruta rota también', () => {
    expect(parseHash('')).toEqual({ screen: 'recipes' });
    expect(parseHash('#/lo-que-sea')).toEqual({ screen: 'recipes' });
  });

  test('#/hoy sigue resolviendo: hay una PWA instalada con ese start_url', () => {
    expect(parseHash('#/hoy')).toEqual({ screen: 'recipes' });
  });

  test('una receta sin id vuelve al recetario', () => {
    expect(parseHash('#/receta/')).toEqual({ screen: 'recipes' });
    expect(parseHash('#/cocinar/')).toEqual({ screen: 'recipes' });
  });

  test('ida y vuelta hash ↔ ruta', () => {
    for (const hash of [
      '#/recetario',
      '#/receta/p19',
      '#/cocinar/p19',
      '#/ingredientes',
      '#/ingrediente/garbanzos',
      '#/glosario',
      '#/nutrientes',
      '#/nutriente/hierro',
      '#/diario',
      '#/perfil',
      '#/ajustes',
    ]) {
      expect(routeHash(parseHash(hash))).toBe(hash);
    }
  });
});

describe('el factor de escala en la ruta (issue #201)', () => {
  test('cocinar lleva el factor elegido en la ficha', () => {
    expect(parseHash('#/cocinar/r02/x2')).toEqual({ screen: 'cook', id: 'r02', factor: 2 });
    expect(routeHash({ screen: 'cook', id: 'r02', factor: 2 })).toBe('#/cocinar/r02/x2');
    expect(routeHash({ screen: 'cook', id: 'r02', factor: 1.25 })).toBe('#/cocinar/r02/x1.25');
  });

  test('sin factor se cocina ×1, y los enlaces viejos siguen resolviendo', () => {
    expect(parseHash('#/cocinar/r02')).toEqual({ screen: 'cook', id: 'r02' });
    expect(routeHash({ screen: 'cook', id: 'r02' })).toBe('#/cocinar/r02');
    expect(routeHash({ screen: 'cook', id: 'r02', factor: 1 })).toBe('#/cocinar/r02');
  });

  test('un factor escrito a mano queda acotado, y uno roto se ignora', () => {
    expect(parseHash('#/cocinar/r02/x99')).toEqual({ screen: 'cook', id: 'r02', factor: 4 });
    expect(parseHash('#/cocinar/r02/x0')).toEqual({ screen: 'cook', id: 'r02', factor: 0.25 });
    expect(parseHash('#/cocinar/r02/x1')).toEqual({ screen: 'cook', id: 'r02' });
    expect(parseHash('#/cocinar/r02/lo-que-sea')).toEqual({ screen: 'cook', id: 'r02' });
  });

  test('ida y vuelta con factor', () => {
    for (const hash of ['#/cocinar/r02/x2', '#/cocinar/r02/x0.5', '#/cocinar/p19/x1.25']) {
      expect(routeHash(parseHash(hash))).toBe(hash);
    }
  });
});
