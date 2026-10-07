// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { ORDEN_BARRA, ORDEN_SIN_COLOR } from '../../domain/aporte';
import { recetasQueMasAportan } from '../../domain/fuentes';
import { computeNutrition } from '../../domain/nutrition';
import { getSeedIndex } from '../../seed';
import { NutrientDetail } from './NutrientDetail';
import { NutrientList } from './NutrientList';

const idx = getSeedIndex();
const nutricionDe = (id: string) => computeNutrition(id, idx);

const filaDe = (container: HTMLElement, nombre: string) =>
  [...container.querySelectorAll('.fila-nutriente')].find(
    (fila) => fila.querySelector('.fila-nutriente-nombre')?.textContent === nombre,
  ) as HTMLElement;

const abrir = (fila: HTMLElement) => fireEvent.click(within(fila).getByRole('button'));

describe('lista de nutrientes', () => {
  test('están los 20, en orden canónico: los once con color y después los nueve sin', async () => {
    const { container } = render(<NutrientList />);
    await waitFor(() => expect(screen.getByText('Hierro')).toBeDefined());
    const esperados = [...ORDEN_BARRA, ...ORDEN_SIN_COLOR].map((id) => idx.nutrientById.get(id)!.nombre);
    const nombres = [...container.querySelectorAll('.fila-nutriente-nombre')].map((n) => n.textContent);
    expect(nombres).toEqual(esperados);
  });

  test('once cuadrados con color y nueve huecos', async () => {
    const { container } = render(<NutrientList />);
    await waitFor(() => expect(screen.getByText('Hierro')).toBeDefined());
    expect(container.querySelectorAll('.fila-nutriente .cuadrado-nutriente:not(.hueco)')).toHaveLength(11);
    expect(container.querySelectorAll('.fila-nutriente .cuadrado-nutriente.hueco')).toHaveLength(9);
  });

  test('cada fila dice en cuántas recetas está, con su confianza', async () => {
    const { container } = render(<NutrientList />);
    await waitFor(() => expect(screen.getByText('Hierro')).toBeDefined());
    const recetas = recetasQueMasAportan(idx, idx.nutrientById.get('hierro')!, nutricionDe).length;
    const hierro = filaDe(container, 'Hierro');
    expect(hierro.querySelector('.fila-nutriente-recetas')!.textContent).toBe(`en ${recetas} recetas`);
    expect(hierro.querySelector('.confianza')).not.toBeNull();
  });

  test('la B12 no la aporta ninguna receta, y abierta explica de dónde sale', async () => {
    const { container } = render(<NutrientList />);
    await waitFor(() => expect(screen.getByText('Hierro')).toBeDefined());
    const b12 = filaDe(container, 'Vitamina B12');
    expect(b12.querySelector('.fila-nutriente-recetas')!.textContent).toBe('ninguna receta la aporta');
    abrir(b12);
    const detalle = b12.querySelector('.fila-nutriente-detalle')!.textContent!;
    expect(detalle).toMatch(/suplementos/);
    expect(detalle).toMatch(/fortificad/);
    expect(detalle).toMatch(/etiqueta/);
    // la semilla pone primero a la levadura: nombrarla contradiría la explicación
    expect(detalle).not.toMatch(/Lo aportan sobre todo: Levadura/);
  });

  test('el yodo dice por qué no está en las barras: sale de la sal, que es estimada', async () => {
    const { container } = render(<NutrientList />);
    await waitFor(() => expect(screen.getByText('Hierro')).toBeDefined());
    const yodo = filaDe(container, 'Yodo');
    abrir(yodo);
    const detalle = yodo.querySelector('.fila-nutriente-detalle')!.textContent!;
    expect(detalle).toMatch(/sal yodada/);
    expect(detalle).toMatch(/estimación/);
    expect(detalle).not.toMatch(/\d+ de los \d+/);
  });

  test('un nutriente sin dato en ningún ingrediente no dice que nadie lo aporta', async () => {
    const { container } = render(<NutrientList />);
    await waitFor(() => expect(screen.getByText('Hierro')).toBeDefined());
    // invariante 5: sin dato no es cero
    expect(filaDe(container, 'Vitamina K').querySelector('.fila-nutriente-recetas')!.textContent).toBe(
      'sin dato cargado',
    );
  });

  test('se abre una fila por vez, y lleva a su ficha', async () => {
    const { container } = render(<NutrientList />);
    await waitFor(() => expect(screen.getByText('Hierro')).toBeDefined());
    abrir(filaDe(container, 'Hierro'));
    abrir(filaDe(container, 'Calcio'));
    expect(container.querySelectorAll('.fila-nutriente-detalle')).toHaveLength(1);
    expect(within(filaDe(container, 'Calcio')).getByRole('link', { name: /Ver la ficha/ }).getAttribute('href')).toBe(
      '#/nutriente/calcio',
    );
  });

  test('la leyenda del color va en la «i»', async () => {
    render(<NutrientList />);
    await waitFor(() => expect(screen.getByText('Hierro')).toBeDefined());
    expect(screen.queryByText(/en hueco, los que no/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Para saber/ }));
    expect(screen.getByText(/en hueco, los que no/)).toBeDefined();
  });
});

describe('ficha de nutriente', () => {
  test('muestra las recetas y los ingredientes que más lo aportan', async () => {
    const { container } = render(<NutrientDetail id="hierro" />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Hierro' })).toBeDefined());

    expect(screen.getByText(/Recetas que más aportan/)).toBeDefined();
    expect(screen.getByText(/Ingredientes que más aportan/)).toBeDefined();
    expect(container.querySelectorAll('.fila-fuente').length).toBeGreaterThan(5);
  });

  test('cada fuente dice cuánto aporta y qué porcentaje de la dosis es', async () => {
    const { container } = render(<NutrientDetail id="hierro" />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Hierro' })).toBeDefined());
    const primera = container.querySelector('.fila-fuente')!;
    expect(primera.textContent).toMatch(/mg/);
    expect(primera.textContent).toMatch(/%/);
  });

  test('muestra lo que la semilla sabe del nutriente y nadie más muestra', async () => {
    render(<NutrientDetail id="b12" />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /B12/ })).toBeDefined());
    // notas[]: "Sin fuente vegetal confiable; espirulina contiene análogos inactivos"
    expect(screen.getByText(/espirulina/i)).toBeDefined();
  });

  test('la B12 avisa que la suplementación es obligatoria, arriba de todo', async () => {
    const { container } = render(<NutrientDetail id="b12" />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /B12/ })).toBeDefined());
    // sin el aviso, un "40 % de la dosis" alimentaria se lee tranquilizador
    const aviso = container.querySelector('.aviso-nutriente')!;
    expect(aviso.textContent).toMatch(/uplementaci/);
    const primeraCifra = container.querySelector('.cifra')!;
    expect(aviso.compareDocumentPosition(primeraCifra) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('la ficha de la B12 explica la levadura en vez de rankear recetas que no la aportan', async () => {
    const { container } = render(<NutrientDetail id="b12" />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /B12/ })).toBeDefined());
    expect(container.querySelector('.explicacion-b12')!.textContent).toMatch(/levadura nutricional/);
    expect(screen.getByText(/Recetas que más aportan/).parentElement!.querySelectorAll('.fila-fuente')).toHaveLength(0);
  });

  test('un nutriente de ventana semanal lo dice, y su «i» aclara que no hace falta llegar todos los días', async () => {
    render(<NutrientDetail id="b12" />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /B12/ })).toBeDefined());
    expect(screen.getByText('se mira en la semana')).toBeDefined();
    expect(screen.queryByText(/no hace falta llegar todos los días/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Para saber/ }));
    expect(screen.getByText(/no hace falta llegar todos los días/i)).toBeDefined();
  });

  test('dice qué es el nutriente y por qué importa en una dieta vegana', async () => {
    const { container } = render(<NutrientDetail id="hierro" />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Hierro' })).toBeDefined());
    expect(container.querySelector('.nutriente-descripcion')!.textContent).toMatch(/oxígeno/i);
  });

  test('la de proteína explica que se mide proteína total y qué pinta la lisina', async () => {
    const { container } = render(<NutrientDetail id="proteina" />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Proteína/ })).toBeDefined());
    const descripcion = container.querySelector('.nutriente-descripcion')!.textContent!;
    expect(descripcion).toMatch(/proteína total/i);
    expect(descripcion).toMatch(/lisina/i);
  });

  test('un nutriente inexistente no rompe', () => {
    render(<NutrientDetail id="zzz" />);
    expect(screen.getByRole('heading', { name: /Nutriente no encontrado/ })).toBeDefined();
  });
});
