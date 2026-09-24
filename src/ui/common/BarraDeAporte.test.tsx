// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ORDEN_BARRA, type Porcentajes } from '../../domain/aporte';
import { BarraDeAporte } from './BarraDeAporte';

const con = (valores: Partial<Porcentajes>): Porcentajes =>
  ({ ...Object.fromEntries(ORDEN_BARRA.map((id) => [id, null])), ...valores }) as Porcentajes;

test('seis casilleros: los que tienen nutriente van en su orden, con el relleno como atributo', () => {
  const { container } = render(<BarraDeAporte porcentajes={con({ proteina: 40, hierro: 12.5 })} />);
  const franjas = [...container.querySelectorAll('.franja')];
  expect(franjas).toHaveLength(6);
  expect(franjas.map((f) => f.getAttribute('data-nut'))).toEqual(['hierro', 'proteina', null, null, null, null]);
  expect(franjas[1]!.querySelector('.franja-relleno')!.getAttribute('width')).toBe('40');
  // el casillero que sobra no nombra a nadie y no tiene relleno
  expect(franjas[2]!.querySelector('.franja-relleno')).toBeNull();
});

test('se lee como una frase, con los porcentajes que dibuja', () => {
  const { getByRole } = render(<BarraDeAporte porcentajes={con({ proteina: 40, hierro: 12.5 })} />);
  expect(getByRole('img').getAttribute('aria-label')).toBe('Cubre del día: hierro 13 %, proteína 40 %');
});

test('sin ningún dato lo dice, en vez de seis casilleros mudos', () => {
  const { getByRole } = render(<BarraDeAporte porcentajes={con({})} />);
  expect(getByRole('img').getAttribute('aria-label')).toBe('Sin dato de ningún nutriente');
});
