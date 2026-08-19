// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../../seed';
import { EMPTY_FILTERS, groupRecipes, matchesFilters } from './filtering';
import { RecipeList } from './RecipeList';

describe('agrupación de variantes (lógica)', () => {
  test('las 84 recetas quedan en 72 grupos (12 variantes bajo su madre)', () => {
    const groups = groupRecipes(EMPTY_FILTERS);
    expect(groups).toHaveLength(72);
    const d01 = groups.find((g) => g.mother.id === 'd01')!;
    expect(d01.variants.map((v) => v.id).sort()).toEqual(['p32', 'p33', 'p34']);
  });

  test('si solo matchea una variante, el grupo aparece igual', () => {
    const idx = getSeedIndex();
    const f = { ...EMPTY_FILTERS, q: 'brownies chocoporotos sin harina' };
    expect(matchesFilters(idx, idx.recipeById.get('d01')!, f)).toBe(false);
    const groups = groupRecipes(f);
    expect(groups.some((g) => g.mother.id === 'd01')).toBe(true);
  });

  test('búsqueda por sinónimo: "rolled oats" encuentra recetas con avena', () => {
    const groups = groupRecipes({ ...EMPTY_FILTERS, q: 'rolled oats' });
    const idx = getSeedIndex();
    const ids = groups.flatMap((g) => [...(g.motherMatches ? [g.mother.id] : []), ...g.matchingVariants.map((v) => v.id)]);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const receta = idx.recipeById.get(id)!;
      expect(receta.lineas.some((l) => l.ref.tipo === 'ingrediente' && l.ref.id === 'avena')).toBe(true);
    }
  });

  test('filtro rica en hierro devuelve un subconjunto no vacío', () => {
    const groups = groupRecipes({ ...EMPTY_FILTERS, ricaEn: 'hierro' });
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.length).toBeLessThan(72);
  });
});

describe('RecipeList (render)', () => {
  test('muestra 84 recetas y filtra al buscar', () => {
    render(<RecipeList />);
    expect(screen.getByText(/84 recetas/)).toBeDefined();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'locro' } });
    expect(screen.getByText(/1 receta con estos filtros/)).toBeDefined();
    expect(screen.getByText('Locro vegano')).toBeDefined();
  });

  test('expandir variantes muestra las hijas', () => {
    render(<RecipeList />);
    const boton = screen.getAllByRole('button', { name: /3 variantes/ })[0]!;
    fireEvent.click(boton);
    expect(screen.getByText('Brownies chocoporotos sin harina')).toBeDefined();
  });
});
