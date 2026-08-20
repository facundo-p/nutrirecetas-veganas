// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { SettingsScreen } from './SettingsScreen';
import { TEMA_DEFAULT } from '../../app/tema';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.tema;
});

test('el selector de tema muestra los tres temas y marca el activo', () => {
  render(<SettingsScreen />);
  expect(screen.getByRole('radio', { name: /Botánica editorial/ })).toBeDefined();
  expect(screen.getByRole('radio', { name: /Carta de estación/ })).toBeDefined();
  const activo = screen.getByRole('radio', { name: /El color dice de qué se trata/ }) as HTMLInputElement;
  expect(TEMA_DEFAULT).toBe('d');
  expect(activo.checked).toBe(true);
});

test('elegir un tema lo aplica al documento y lo deja guardado', () => {
  render(<SettingsScreen />);

  fireEvent.click(screen.getByRole('radio', { name: /Botánica editorial/ }));

  // el CSS reacciona al atributo: sin esto el cambio no se vería
  expect(document.documentElement.dataset.tema).toBe('a');
  // y sobrevive al reload, que es lo que hace que sirva en el celular
  expect(localStorage.getItem('tema')).toBe('a');
});
