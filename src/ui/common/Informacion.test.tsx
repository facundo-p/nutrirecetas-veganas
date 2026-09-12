// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Informacion } from './Informacion';

const botonDeInformacion = () => screen.getByRole('button', { name: /^Para saber/ });

test('lo que explica la pantalla no está a la vista hasta tocar la «i»', () => {
  render(
    <Informacion>
      <p>Todo se guarda en gramos.</p>
    </Informacion>,
  );
  expect(screen.queryByText('Todo se guarda en gramos.')).toBeNull();
  fireEvent.click(botonDeInformacion());
  expect(screen.getByRole('dialog', { name: 'Para saber' })).toBeDefined();
  expect(screen.getByText('Todo se guarda en gramos.')).toBeDefined();
});

test('Escape, el velo y la cruz la cierran, y el foco vuelve a la «i»', () => {
  render(
    <Informacion>
      <p>x</p>
    </Informacion>,
  );
  const cierres = [
    () => fireEvent.keyDown(document, { key: 'Escape' }),
    () => fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' })[0]!),
    () => fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' })[1]!),
  ];
  for (const cerrar of cierres) {
    fireEvent.click(botonDeInformacion());
    expect(screen.queryByRole('dialog')).not.toBeNull();
    cerrar();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(botonDeInformacion());
  }
});
