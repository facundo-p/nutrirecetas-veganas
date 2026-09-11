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

describe('el modal de filtros', () => {
  const abrir = () => fireEvent.click(screen.getByRole('button', { name: /^Filtros/ }));
  const chip = (nombre: string) => screen.getByRole('button', { name: nombre });

  test('cerrado no se ve; lo cierran el velo, Escape y el botón de cierre', () => {
    render(<RecipeList />);
    expect(screen.queryByRole('dialog')).toBeNull();
    abrir();
    expect(screen.getByRole('dialog', { name: 'Filtros' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar los filtros' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    abrir();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    abrir();
    fireEvent.click(screen.getByRole('button', { name: 'Ver 84 recetas' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('filtra en vivo y el botón de cierre dice el resultado: probadas son las 45 del recetario personal', () => {
    render(<RecipeList />);
    abrir();
    fireEvent.click(chip('probadas'));
    expect(screen.getByRole('button', { name: 'Ver 45 recetas' })).toBeDefined();
  });

  test('sin ninguna, el botón lo dice en vez de ofrecer ver cero', () => {
    render(<RecipeList />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz' } });
    abrir();
    expect(screen.getByRole('button', { name: 'Ninguna receta con esos filtros' })).toBeDefined();
  });

  test('cada grupo es de una sola elección: prender uno apaga el otro, y tocarlo de nuevo lo suelta', () => {
    render(<RecipeList />);
    abrir();
    fireEvent.click(chip('probadas'));
    expect(chip('probadas').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(chip('sin probar'));
    expect(chip('probadas').getAttribute('aria-pressed')).toBe('false');
    expect(chip('sin probar').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(chip('sin probar'));
    expect(chip('sin probar').getAttribute('aria-pressed')).toBe('false');
  });

  test('el contador del botón cuenta los filtros puestos, sin la búsqueda', () => {
    render(<RecipeList />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'lentejas' } });
    expect(screen.getByRole('button', { name: 'Filtros' })).toBeDefined();
    abrir();
    fireEvent.click(chip('de estación'));
    fireEvent.click(chip('saladas'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Filtros, 2 puestos' })).toBeDefined();
  });

  test('«limpiar todo» suelta los filtros pero no la búsqueda', () => {
    render(<RecipeList />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'lentejas' } });
    abrir();
    fireEvent.click(chip('saladas'));
    fireEvent.click(screen.getByRole('button', { name: 'limpiar todo' }));
    expect(chip('saladas').getAttribute('aria-pressed')).toBe('false');
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('lentejas');
  });

  test('los nutrientes con color llevan su cuadrado y se prenden en su color; los otros no', () => {
    render(<RecipeList />);
    abrir();
    expect(chip('hierro').getAttribute('data-nut')).toBe('hierro');
    expect(chip('hierro').querySelector('.cuadrado-nutriente')).not.toBeNull();
    expect(chip('vitamina B12').getAttribute('data-nut')).toBeNull();
  });
});

describe('el recetario se dibuja con sus nutrientes', () => {
  test('cada receta lleva su barra', () => {
    render(<RecipeList />);
    // una por grupo: las variantes arrancan plegadas
    expect(screen.getAllByRole('img', { name: /^(Cubre del día|Sin dato)/ })).toHaveLength(72);
  });

  test('la línea de datos nombra el nutriente que más cubre, con su porcentaje y su color', () => {
    render(<RecipeList />);
    const fila = screen.getByText('Sopa de lentejas rojas al estilo turco').closest('article')!;
    const fuerte = fila.querySelector('.meta-fuerte')!;
    expect(fuerte.textContent).toMatch(/^[a-zéí 0-9]+ [\d,]+ %$/i);
    expect(fuerte.getAttribute('data-nut')).not.toBeNull();
  });

  test('un preparado sin porciones dice que su barra es cada 100 g', () => {
    render(<RecipeList />);
    const fila = screen.getByText('Leche de soja casera').closest('article')!;
    expect(fila.querySelector('.meta-fuerte')?.textContent).toMatch(/cada 100 g$/);
  });

  test('la leyenda arranca cerrada, y abierta dice contra qué se mide', () => {
    render(<RecipeList />);
    const boton = screen.getByRole('button', { name: 'qué es cada color' });
    expect(boton.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(boton);
    expect(screen.getByRole('button', { name: 'ocultar' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('referencia adulta genérica')).toBeDefined();
  });

  test('sin resultados, «Empezar de nuevo» suelta todos los filtros', () => {
    render(<RecipeList />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz' } });
    expect(screen.getByText('No hay ninguna con todo eso junto.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar de nuevo' }));
    expect(screen.getByText(/^84 recetas$/)).toBeDefined();
  });
});
