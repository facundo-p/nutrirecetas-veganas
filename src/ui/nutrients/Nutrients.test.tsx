// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { NutrientDetail } from './NutrientDetail';
import { NutrientList } from './NutrientList';

describe('lista de nutrientes', () => {
  test('están los 20, agrupados en críticos e importantes', async () => {
    const { container } = render(<NutrientList />);
    await waitFor(() => expect(screen.getByText('Nutrientes críticos')).toBeDefined());
    expect(screen.getByText('Importantes')).toBeDefined();
    expect(container.querySelectorAll('.fila-nutriente')).toHaveLength(20);
  });

  test('cada uno muestra su dosis diaria de referencia', async () => {
    const { container } = render(<NutrientList />);
    await waitFor(() => expect(screen.getByText('Hierro')).toBeDefined());
    const hierro = [...container.querySelectorAll('.fila-nutriente')].find((n) =>
      n.textContent?.includes('Hierro'),
    )!;
    expect(hierro.textContent).toMatch(/mg/);
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
  });

  test('un nutriente de ventana semanal dice que no hace falta llegar todos los días', async () => {
    render(<NutrientDetail id="b12" />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /B12/ })).toBeDefined());
    expect(screen.getByText(/no hace falta llegar todos los días/i)).toBeDefined();
  });

  test('un nutriente inexistente no rompe', () => {
    render(<NutrientDetail id="zzz" />);
    expect(screen.getByRole('heading', { name: /Nutriente no encontrado/ })).toBeDefined();
  });
});
