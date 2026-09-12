// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { MenuDeEstado } from './EstadoDeReceta';

const botonDeEstado = () => screen.getByRole('button', { name: /^Tu estado con esta receta/ });
const enfocada = () => document.activeElement?.textContent?.trim();

test('el botón dice el estado actual y abre las cuatro opciones, con la actual marcada', () => {
  render(<MenuDeEstado estado="pendiente" onChange={() => {}} />);
  expect(botonDeEstado().getAttribute('aria-label')).toBe('Tu estado con esta receta: pendiente');
  expect(screen.queryByRole('menu')).toBeNull();

  fireEvent.click(botonDeEstado());
  expect(botonDeEstado().getAttribute('aria-expanded')).toBe('true');
  const opciones = screen.getAllByRole('menuitemradio');
  expect(opciones.map((o) => o.textContent?.trim())).toEqual(['sin probar', 'probada', 'pendiente', 'favorita']);
  expect(opciones.filter((o) => o.getAttribute('aria-checked') === 'true').map((o) => o.textContent?.trim())).toEqual([
    'pendiente',
  ]);
});

test('elegir una opción la guarda, cierra el menú y devuelve el foco al botón', () => {
  const onChange = vi.fn();
  render(<MenuDeEstado estado="sin-probar" onChange={onChange} />);
  fireEvent.click(botonDeEstado());
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'favorita' }));
  expect(onChange).toHaveBeenCalledWith('favorita');
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(botonDeEstado());
});

test('Escape cierra sin cambiar nada y devuelve el foco al botón', () => {
  const onChange = vi.fn();
  render(<MenuDeEstado estado="probada" onChange={onChange} />);
  fireEvent.click(botonDeEstado());
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(botonDeEstado());
  expect(onChange).not.toHaveBeenCalled();
});

test('tocar afuera cierra el menú; tocar adentro no', () => {
  render(
    <>
      <p>afuera</p>
      <MenuDeEstado estado="probada" onChange={() => {}} />
    </>,
  );
  fireEvent.click(botonDeEstado());
  fireEvent.pointerDown(screen.getByRole('menu'));
  expect(screen.queryByRole('menu')).not.toBeNull();
  fireEvent.pointerDown(screen.getByText('afuera'));
  expect(screen.queryByRole('menu')).toBeNull();
});

test('al abrir, el foco va a la opción actual; las flechas recorren y dan la vuelta', () => {
  render(<MenuDeEstado estado="favorita" onChange={() => {}} />);
  fireEvent.click(botonDeEstado());
  expect(enfocada()).toBe('favorita');
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
  expect(enfocada()).toBe('sin probar');
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
  expect(enfocada()).toBe('favorita');
});
