// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from './App';

test('la app arranca en Hoy con la navegación completa', async () => {
  render(<App />);
  expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeDefined();
  expect(screen.getByRole('link', { name: /Recetario/ })).toBeDefined();
  expect(screen.getByRole('link', { name: /Ingredientes/ })).toBeDefined();
  expect(screen.getByRole('link', { name: /Diario/ })).toBeDefined();
  // sin perfil cargado, Hoy pide completarlo antes de mostrar un semáforo vacío
  await waitFor(() => expect(screen.getByRole('heading', { name: /contame de vos/i })).toBeDefined());
});
