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

  test('los ingredientes no son links; el preparado sí (issue #137)', () => {
    const { container } = render(<RecipeDetail id="p19" />);
    const lineas = [...container.querySelectorAll('.linea-nombre')];
    expect(lineas.length).toBeGreaterThan(1);
    const conLink = lineas.filter((n) => n.querySelector('a') !== null);
    // p19 tiene 11 ingredientes y un preparado (queso de maní): solo ese linkea.
    expect(conLink).toHaveLength(1);
    expect(conLink[0]!.textContent).toMatch(/Queso de maní/);
    expect(screen.getByText('Papa')).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Papa' })).toBeNull();
  });

  test('la fuente se lee, no es un código (issue #149)', () => {
    render(<RecipeDetail id="r05" />);
    const link = screen.getByRole('link', { name: 'Minimalist Baker (Dana Shultz)' });
    expect(link.getAttribute('href')).toBe('https://minimalistbaker.com/');
    expect(screen.queryByText(/Fuente: mb/)).toBeNull();
    // la credencial es lo que hace útil el origen, y va visible
    expect(screen.getByText('referente vegano; miles de valoraciones por receta')).toBeDefined();
    expect(screen.getByText(/Southwest Tofu Scramble/)).toBeDefined();
  });

  test('una fuente sin sitio no inventa un link', () => {
    render(<RecipeDetail id="p19" />);
    expect(screen.getByText(/Recetario personal de Facu/)).toBeDefined();
    expect(screen.queryByRole('link', { name: /Recetario personal/ })).toBeNull();
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
      const { container } = render(<RecipeDetail id="p19" />);
      expect(screen.getByRole('button', { name: /Nutrición por porción/ }).getAttribute('aria-expanded')).toBe('false');
      expect(container.querySelector('.nutricion-kcal')!.textContent).toMatch(/kcal/);
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

  describe('cuánto aporta de la dosis diaria', () => {
    const abrirNutricion = () => fireEvent.click(screen.getByRole('button', { name: /Nutrición por porción/ }));

    test('cada nutriente con dato dice qué porcentaje de la dosis aporta', () => {
      render(<RecipeDetail id="p19" />);
      abrirNutricion();

      const hierro = screen.getByText('Hierro').closest('li')!;
      expect(hierro.textContent).toMatch(/\d+ % de la dosis/);
    });

    test('sin perfil aclara que la referencia es genérica, no la tuya', () => {
      render(<RecipeDetail id="p19" />);
      abrirNutricion();
      expect(screen.getByText(/referencia adulta genérica/)).toBeDefined();
    });

    test('un nutriente sin datos no inventa un porcentaje', () => {
      render(<RecipeDetail id="p19" />);
      abrirNutricion();
      fireEvent.click(screen.getByRole('button', { name: /nutrientes? sin datos/ }));

      const vitk = screen.getByText('Vitamina K').closest('li')!;
      expect(vitk.textContent).not.toMatch(/% de la dosis/);
    });

    test('las kcal por porción se leen sin abrir nada: es lo que se mira cocinando', () => {
      const { container } = render(<RecipeDetail id="p19" />);
      const energia = container.querySelector('.detalle-energia')!;
      expect(energia.textContent).toMatch(/kcal/);
      // «por porción» y no «por 100 g»: un número sin su referencia no dice nada
      expect(energia.textContent).toMatch(/por porción/);
    });

    test('la nutrición va al final: primero todo lo que sirve para cocinar', () => {
      const { container } = render(<RecipeDetail id="p19" />);
      const titulos = [...container.querySelectorAll('h2')].map((h) => h.textContent ?? '');
      const nutricion = titulos.findIndex((t) => t.includes('Nutrición'));
      const pasos = titulos.findIndex((t) => t.includes('Pasos'));
      expect(pasos).toBeGreaterThanOrEqual(0);
      expect(nutricion).toBeGreaterThan(pasos);
    });
  });

  test('una receta inexistente no rompe', () => {
    render(<RecipeDetail id="zzz" />);
    expect(screen.getByRole('heading', { name: /Receta no encontrada/ })).toBeDefined();
  });
});
