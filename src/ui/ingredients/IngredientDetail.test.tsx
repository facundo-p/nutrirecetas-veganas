// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { IngredientDetail } from './IngredientDetail';

describe('ficha de ingrediente', () => {
  test('cada nutriente del catálogo dice qué porcentaje de la dosis aporta cada 100 g', () => {
    render(<IngredientDetail id="lentejas" />);
    const hierro = screen.getByText('Hierro').closest('li')!;
    expect(hierro.textContent).toMatch(/\d+ % de la dosis/);
  });

  test('aclara contra qué referencia se mide el porcentaje', () => {
    render(<IngredientDetail id="lentejas" />);
    expect(screen.getByText(/referencia adulta genérica/)).toBeDefined();
  });

  test('un nutriente fuera del catálogo de 20 no inventa un porcentaje', () => {
    // sodio y grasa saturada no tienen RDA en la semilla: no hay contra qué medirlos
    render(<IngredientDetail id="lentejas" />);
    const sodio = screen.queryByText('Sodio')?.closest('li');
    if (sodio) expect(sodio.textContent).not.toMatch(/% de la dosis/);
  });

  test('un ingrediente inexistente no rompe', () => {
    render(<IngredientDetail id="zzz" />);
    expect(screen.getByRole('heading', { name: /Ingrediente no encontrado/ })).toBeDefined();
  });
});
