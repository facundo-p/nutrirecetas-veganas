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

  describe('la nutrición no tapa la receta (issue #59)', () => {
    const abrirNutricion = () => fireEvent.click(screen.getByRole('button', { name: /Nutrición por porción/ }));

    test('arranca colapsada: se ven las kcal, ningún nutriente', () => {
      render(<RecipeDetail id="p19" />);
      expect(screen.getByRole('button', { name: /Nutrición por porción/ }).getAttribute('aria-expanded')).toBe('false');
      expect(screen.getByText(/kcal/)).toBeDefined();
      expect(screen.queryByText('Hierro')).toBeNull();
      expect(screen.queryByText(/sin datos/)).toBeNull();
    });

    test('al abrirla se ven los nutrientes con dato y ninguno sin dato', () => {
      render(<RecipeDetail id="p19" />);
      abrirNutricion();

      expect(screen.getByText('Hierro')).toBeDefined();
      // vitk no tiene dato en ningún ingrediente: queda detrás del contador
      expect(screen.queryByText('Vitamina K')).toBeNull();
      expect(screen.queryAllByText(/^sin datos$/)).toHaveLength(0);
    });

    test('el contador dice cuántos faltan y los despliega: los nulos no se esconden', () => {
      render(<RecipeDetail id="p19" />);
      abrirNutricion();

      const contador = screen.getByRole('button', { name: /nutrientes? sin datos/ });
      const cuantos = Number(contador.textContent!.match(/(\d+)/)![1]);
      expect(cuantos).toBeGreaterThan(0);

      fireEvent.click(contador);
      expect(screen.getByText('Vitamina K')).toBeDefined();
      expect(screen.getAllByText(/^sin datos$/)).toHaveLength(cuantos);
    });
  });

  test('una receta inexistente no rompe', () => {
    render(<RecipeDetail id="zzz" />);
    expect(screen.getByRole('heading', { name: /Receta no encontrada/ })).toBeDefined();
  });
});
