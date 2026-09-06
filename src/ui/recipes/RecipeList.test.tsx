// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { getSeedIndex } from '../../seed';
import { EMPTY_FILTERS, groupRecipes, matchesFilters } from './filtering';
import type { EstadoDeReceta } from '../../domain/estado';
import { RecipeList } from './RecipeList';
import { olvidarFiltros } from './memoria-de-filtros';

// La memoria sobrevive al desmontaje a propósito: sin esto, el filtro de un
// test se le cuela al siguiente.
beforeEach(olvidarFiltros);

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

  test('el filtro de estado mira tu elección, no la de la semilla (issue #145)', () => {
    const idx = getSeedIndex();
    const elegidos = new Map<string, EstadoDeReceta>([
      ['r01', 'favorita'], // la semilla la da por-probar
      ['p19', 'sin-probar'], // la semilla la da probada
    ]);
    const f = { ...EMPTY_FILTERS, estado: 'favorita' as const };
    expect(matchesFilters(idx, idx.recipeById.get('r01')!, f, elegidos)).toBe(true);
    expect(matchesFilters(idx, idx.recipeById.get('r01')!, f)).toBe(false);

    const probadas = { ...EMPTY_FILTERS, estado: 'probada' as const };
    expect(matchesFilters(idx, idx.recipeById.get('p19')!, probadas, elegidos)).toBe(false);
    expect(matchesFilters(idx, idx.recipeById.get('p19')!, probadas)).toBe(true);
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

  test('volver al recetario conserva el filtro (issue #139)', () => {
    const primera = render(<RecipeList />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'locro' } });
    expect(screen.getByText(/1 receta con estos filtros/)).toBeDefined();
    primera.unmount(); // abrir una receta desmonta el recetario entero

    render(<RecipeList />);
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('locro');
    expect(screen.getByText(/1 receta con estos filtros/)).toBeDefined();
  });

  test('volver al recetario conserva las variantes desplegadas (issue #139)', () => {
    const primera = render(<RecipeList />);
    fireEvent.click(screen.getAllByRole('button', { name: /3 variantes/ })[0]!);
    expect(screen.getByText('Brownies chocoporotos sin harina')).toBeDefined();
    primera.unmount();

    render(<RecipeList />);
    expect(screen.getByText('Brownies chocoporotos sin harina')).toBeDefined();
  });

  test('expandir variantes muestra las hijas', () => {
    render(<RecipeList />);
    const boton = screen.getAllByRole('button', { name: /3 variantes/ })[0]!;
    fireEvent.click(boton);
    expect(screen.getByText('Brownies chocoporotos sin harina')).toBeDefined();
  });
});

describe('los chips del recetario', () => {
  const chips = () =>
    ['de estación', 'sin probar', 'probadas', 'pendientes', 'favoritas'].map((n) =>
      screen.getByRole('button', { name: n }),
    );

  test('van antes de los selects: en el celular, detrás de cinco quedaban fuera de pantalla', () => {
    render(<RecipeList />);
    const primerChip = screen.getByRole('button', { name: 'de estación' });
    const primerSelect = screen.getByLabelText('Tipo');
    expect(primerChip.compareDocumentPosition(primerSelect)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('están los cuatro estados, en orden, después de de estación', () => {
    render(<RecipeList />);
    const orden = chips();
    for (let i = 1; i < orden.length; i++) {
      expect(orden[i - 1]!.compareDocumentPosition(orden[i]!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }
  });

  test('cada chip prende y apaga, y el estado se dice con aria-pressed', () => {
    render(<RecipeList />);
    const [estacion, sinProbar, probadas] = chips();
    expect(estacion!.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(estacion!);
    expect(estacion!.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(estacion!);
    expect(estacion!.getAttribute('aria-pressed')).toBe('false');

    // los cuatro estados comparten el campo `estado`: prender uno apaga el otro
    fireEvent.click(probadas!);
    expect(probadas!.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(sinProbar!);
    expect(probadas!.getAttribute('aria-pressed')).toBe('false');
    expect(sinProbar!.getAttribute('aria-pressed')).toBe('true');
  });

  test('sin elecciones propias, probadas son las 45 del recetario personal', () => {
    render(<RecipeList />);
    fireEvent.click(screen.getByRole('button', { name: 'probadas' }));
    expect(screen.getByText(/^45 recetas con estos filtros$/)).toBeDefined();
  });
});
