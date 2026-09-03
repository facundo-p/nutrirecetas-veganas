// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { SettingsScreen } from './SettingsScreen';
import { INFO_DE_TEMA, TEMA_DEFAULT, TEMAS } from '../../app/tema';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.tema;
});

// Guiados por TEMAS y no por nombres escritos a mano: la lista de temas cambia
// —se agregan, se van— y cada vez que cambió, lo que se rompió fue este archivo
// y no la app. Lo que se verifica es el cableado, que es lo que no cambia.

test('el selector ofrece todos los temas y marca el activo', () => {
  render(<SettingsScreen />);
  for (const id of TEMAS) {
    expect(screen.getByRole('radio', { name: new RegExp(INFO_DE_TEMA[id].nombre) })).toBeDefined();
  }
  const activo = screen.getByRole('radio', { name: new RegExp(INFO_DE_TEMA[TEMA_DEFAULT].nombre) }) as HTMLInputElement;
  expect(activo.checked).toBe(true);
});

// Cambiar de tema necesita un tema al cual cambiar: clickear el radio que ya
// está marcado no dispara onChange. Mientras quede uno solo —el estado entre el
// borrado de A y C y la llegada de E y F— no hay nada que ejercitar, y este test
// vuelve solo apenas haya dos.
test.skipIf(TEMAS.length < 2)('elegir un tema lo aplica al documento y lo deja guardado', () => {
  render(<SettingsScreen />);
  // el `??` no se alcanza bajo el skipIf; está porque con un solo tema TS infiere never
  const elegido = TEMAS.find((t) => t !== TEMA_DEFAULT) ?? TEMA_DEFAULT;

  fireEvent.click(screen.getByRole('radio', { name: new RegExp(INFO_DE_TEMA[elegido].nombre) }));

  // el CSS reacciona al atributo: sin esto el cambio no se vería
  expect(document.documentElement.dataset.tema).toBe(elegido);
  // y sobrevive al reload, que es lo que hace que sirva en el celular
  expect(localStorage.getItem('tema')).toBe(elegido);
});
