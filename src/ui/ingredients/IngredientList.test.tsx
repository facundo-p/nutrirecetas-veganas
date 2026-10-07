// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../../seed';
import { ingredienteSinDato } from '../../domain/ingrediente';
import { IngredientList } from './IngredientList';

const idx = getSeedIndex();
const filaDe = (id: string) => document.querySelector(`a[href="#/ingrediente/${id}"]`)!;

describe('lista de ingredientes', () => {
  test('cada fila lleva su barra de seis casilleros', () => {
    render(<IngredientList />);
    const barra = filaDe('lentejas').querySelector('.barra-aporte-mini')!;
    expect(barra.querySelectorAll('.franja')).toHaveLength(6);
    expect(barra.getAttribute('role')).toBe('img');
    expect(barra.getAttribute('aria-label')).toMatch(/^Cubre del día: /);
  });

  test('un ingrediente sin ningún nutriente dice «sin dato» en vez de su confianza', () => {
    const sinDato = idx.seed.ingredientes.find(ingredienteSinDato)!;
    render(<IngredientList />);
    const meta = filaDe(sinDato.id).querySelector('.fila-ingrediente-meta')!;
    expect(meta.querySelector('.sin-dato')?.textContent).toBe('sin dato');
    expect(meta.querySelector('.meta-item')).toBeNull();
  });

  test('el agua no aporta, pero eso es un dato: no dice «sin dato»', () => {
    render(<IngredientList />);
    expect(filaDe('agua').querySelector('.sin-dato')).toBeNull();
  });

  test('la «i» explica las barritas', () => {
    render(<IngredientList />);
    fireEvent.click(screen.getByRole('button', { name: /lo que explica esta pantalla/ }));
    expect(screen.getByRole('dialog').textContent).toMatch(/seis nutrientes que más cubren 100 g/);
  });

  test('«fuentes de hierro» ordena de mayor a menor', () => {
    render(<IngredientList />);
    fireEvent.change(screen.getByLabelText('Fuentes de nutriente'), { target: { value: 'hierro' } });
    const cifras = [...document.querySelectorAll('.fila-ingrediente-meta .cifra')].map((c) =>
      Number(c.textContent!.split(' ')[0]!.replace(',', '.')),
    );
    expect(cifras.length).toBeGreaterThan(1);
    expect(cifras).toEqual([...cifras].sort((a, b) => b - a));
  });
});
