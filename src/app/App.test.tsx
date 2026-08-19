// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from './App';

test('la app arranca en el recetario con la navegación completa', () => {
  render(<App />);
  expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeDefined();
  expect(screen.getByRole('link', { name: /Ingredientes/ })).toBeDefined();
  expect(screen.getByRole('link', { name: /Glosario/ })).toBeDefined();
  expect(screen.getByRole('heading', { name: 'Recetario' })).toBeDefined();
});
