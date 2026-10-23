// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../../seed';
import { ingredienteSinDato } from '../../domain/ingrediente';
import { IngredientDetail } from './IngredientDetail';

describe('ficha de ingrediente', () => {
  test('cada nutriente del catálogo dice qué porcentaje de la dosis aporta cada 100 g', () => {
    render(<IngredientDetail id="lentejas" />);
    const hierro = screen.getByText('Hierro').closest('li')!;
    expect(hierro.querySelector('.nutriente-porcentaje')?.textContent).toMatch(/^\d+(,\d+)? %$/);
  });

  test('aclara contra qué referencia se mide el porcentaje', () => {
    render(<IngredientDetail id="lentejas" />);
    expect(screen.getByText(/referencia adulta genérica/)).toBeDefined();
  });

  test('un nutriente fuera del catálogo de 20 no inventa un porcentaje', () => {
    // sodio y grasa saturada no tienen RDA en la semilla: no hay contra qué medirlos
    render(<IngredientDetail id="lentejas" />);
    const sodio = screen.queryByText('Sodio')?.closest('li');
    if (sodio) expect(sodio.querySelector('.nutriente-porcentaje')).toBeNull();
  });

  test('un ingrediente inexistente no rompe', () => {
    render(<IngredientDetail id="zzz" />);
    expect(screen.getByRole('heading', { name: /Ingrediente no encontrado/ })).toBeDefined();
  });
});

describe('ficha de ingrediente: aporte y estado sin dato', () => {
  const idx = getSeedIndex();

  test('la B12 de la levadura no afirma un porcentaje: su rango arranca en cero', () => {
    render(<IngredientDetail id="levadura_nutricional" />);
    const b12 = screen.getByText('Vitamina B12').closest('li')!;
    expect(b12.querySelector('.nutriente-porcentaje')?.textContent).toBe('—');
  });

  test('un ingrediente sin dato lo dice y no muestra lista ni lo llama irrelevante', () => {
    const sinDato = idx.seed.ingredientes.find(ingredienteSinDato)!;
    const { container } = render(<IngredientDetail id={sinDato.id} />);
    expect(container.querySelector('.sin-dato-ingrediente')?.textContent).toMatch(/No tenemos un dato confiable/);
    expect(container.querySelector('.nutricion-lista')).toBeNull();
    expect(container.textContent).not.toMatch(/irrelevante/);
  });

  test('el agua no muestra el bloque de sin dato', () => {
    const { container } = render(<IngredientDetail id="agua" />);
    expect(container.querySelector('.sin-dato-ingrediente')).toBeNull();
  });

  test('los nutrientes van en orden canónico', () => {
    const { container } = render(<IngredientDetail id="lentejas" />);
    const nombres = [...container.querySelectorAll('.nutriente-nombre')].map((n) => n.textContent);
    expect(nombres.indexOf('Magnesio')).toBeLessThan(nombres.indexOf('Zinc'));
    // los que no tienen color van después de los once
    expect(nombres.indexOf('Fibra')).toBeLessThan(nombres.indexOf('Potasio'));
  });
});

describe('ficha de ingrediente: sustitutos, guarda y recetas', () => {
  const idx = getSeedIndex();

  test('ofrece los sustitutos de las recetas: los ids como link, el texto libre inerte', () => {
    render(<IngredientDetail id="lentejas" />);
    const seccion = screen.getByRole('heading', { name: 'Si no tenés' }).closest('section')!;
    expect(seccion.querySelector('a[href="#/ingrediente/porotos_negros"]')).not.toBeNull();
    const texto = seccion.querySelector('.chip-texto')!;
    expect(texto.closest('a')).toBeNull();
    expect(texto.nextElementSibling?.textContent).toMatch(/^en /);
  });

  test('«Aparece en» lista las recetas que lo usan', () => {
    render(<IngredientDetail id="lentejas" />);
    const seccion = screen.getByRole('heading', { name: 'Aparece en' }).closest('section')!;
    const receta = idx.recipesWithIngredient('lentejas')[0]!;
    expect(seccion.querySelector(`a[href="#/receta/${receta.id}"]`)?.textContent).toBe(receta.nombre);
  });

  test('un ingrediente que no usa ninguna receta lo dice', () => {
    const suelto = idx.seed.ingredientes.find((i) => idx.recipesWithIngredient(i.id).length === 0)!;
    render(<IngredientDetail id={suelto.id} />);
    expect(screen.getByText(/Todavía no lo usa ninguna receta/)).toBeDefined();
  });

  test('compra y guarda van juntas', () => {
    render(<IngredientDetail id="garbanzos" />);
    const seccion = screen.getByRole('heading', { name: 'Cómo se compra y se guarda' }).closest('section')!;
    expect(seccion.querySelector('h3')).not.toBeNull();
  });
});
