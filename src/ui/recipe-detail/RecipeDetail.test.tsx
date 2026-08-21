// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { RecipeDetail } from './RecipeDetail';

describe('Detalle de receta', () => {
  test('p19 muestra la alerta B12, el enlace al queso de maní y nutrición por porción', () => {
    render(<RecipeDetail id="p19" />);
    expect(screen.getByRole('heading', { name: /Pastel de papas/ })).toBeDefined();
    expect(screen.getByText(/no están fortificadas/)).toBeDefined();
    expect(screen.getByRole('link', { name: /Queso de maní/ })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Nutrición por porción/ })).toBeDefined();
    expect(screen.getAllByText(/sin datos/).length).toBeGreaterThan(0); // vitk no tiene dato en ningún ingrediente
  });

  test('p04 (preparado) muestra nutrición por 100 g y quién lo consume', () => {
    render(<RecipeDetail id="p04" />);
    expect(screen.getByRole('heading', { name: /Nutrición por 100 g/ })).toBeDefined();
    expect(screen.getByText(/Se usa en/)).toBeDefined();
    expect(screen.getByRole('link', { name: /Pastel de papas/ })).toBeDefined();
  });

  test('bajar una porción no deja cantidades con decimales infinitos (issue #46)', () => {
    const { container } = render(<RecipeDetail id="r04" />); // 6 porciones
    fireEvent.click(screen.getByRole('button', { name: 'Menos porciones' }));
    const cantidades = [...container.querySelectorAll('.linea-cantidad')].map((n) => n.textContent);
    expect(cantidades.length).toBeGreaterThan(0);
    for (const texto of cantidades) expect(texto).not.toMatch(/[.,]\d\d/);
    expect(cantidades.some((t) => t?.includes('¾'))).toBe(true);
  });

  test('una receta inexistente no rompe', () => {
    render(<RecipeDetail id="zzz" />);
    expect(screen.getByRole('heading', { name: /Receta no encontrada/ })).toBeDefined();
  });
});
