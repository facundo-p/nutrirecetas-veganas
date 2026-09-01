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
