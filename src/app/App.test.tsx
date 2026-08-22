// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from './App';
import { addCoccion } from '../db/repos';

test('la app arranca en Hoy con la navegación completa', async () => {
  render(<App />);
  expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeDefined();
  expect(screen.getByRole('link', { name: /Recetario/ })).toBeDefined();
  expect(screen.getByRole('link', { name: /Ingredientes/ })).toBeDefined();
  expect(screen.getByRole('link', { name: /Diario/ })).toBeDefined();
  // sin perfil cargado, Hoy pide completarlo antes de mostrar un semáforo vacío
  await waitFor(() => expect(screen.getByRole('heading', { name: /contame de vos/i })).toBeDefined());
});

test('el aviso de backup se puede posponer sin hacer un backup', async () => {
  // Nunca se hizo un backup y hay un cambio: la condición que no se apagaba nunca.
  await addCoccion({
    receta_id: 'r01',
    receta_nombre: 'Sopa',
    seed_version: '1.0.0',
    fecha: '2026-08-19T20:00:00.000Z',
    porciones_rendidas: 4,
    factor_escala: 1,
    lineas: [],
    variaciones: [],
    nutricion_porcion: {
      masa_total_g: 100,
      kcal: { intervalo: { min: 100, max: 100 }, cobertura_pct: 100, ic: 8 },
      por_nutriente: {},
      alerta_b12: false,
    },
  });

  render(<App />);
  const cerrar = await screen.findByRole('button', { name: /Recordármelo más adelante/ });
  fireEvent.click(cerrar);

  await waitFor(() => expect(screen.queryByText(/copia de tus datos/)).toBeNull());
});

test('el engranaje de Ajustes está a mano desde las pantallas de sección', async () => {
  render(<App />);
  const engranaje = await screen.findByRole('link', { name: 'Ajustes y datos' });
  expect(engranaje.getAttribute('href')).toBe('#/ajustes');
});
