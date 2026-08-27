// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { App } from './App';
import { addCoccion } from '../db/repos';
import { db } from '../db/db';

beforeEach(async () => {
  // limpiar en vez de borrar: cerrar la base deja colgadas las queries en vuelo
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

test('la app arranca en el recetario con la navegación completa', async () => {
  render(<App />);
  expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeDefined();
  expect(screen.getByRole('link', { name: /Recetario/ })).toBeDefined();
  expect(screen.getByRole('link', { name: /Ingredientes/ })).toBeDefined();
  expect(screen.getByRole('link', { name: /Diario/ })).toBeDefined();
  expect(screen.queryByRole('link', { name: /Hoy/ })).toBeNull();

  // sin perfil cargado la app funciona igual: no hay portón que llenar
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Recetario', level: 1 })).toBeDefined());
  expect(screen.queryByRole('link', { name: /Completar mi perfil/ })).toBeNull();
});

test('lo primero del recetario es qué cocinar, no un formulario vacío', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText('Qué cocinar')).toBeDefined());
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

test('a quien venía de antes le avisa que se borraron los consumos, y se puede cerrar', async () => {
  await db.meta.put({ id: 1, user_schema_version: 2, seed_version: '1.0.0', cambios_desde_backup: 0 });

  render(<App />);
  await waitFor(() => expect(screen.getByText(/dejó de llevar la cuenta de lo que comés/)).toBeDefined());
  fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));

  await waitFor(() => expect(screen.queryByText(/dejó de llevar la cuenta/)).toBeNull());
  expect((await db.meta.get(1))!.user_schema_version).toBe(3);
});

test('una instalación nueva no ve el aviso de una migración que no vivió', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeDefined());
  expect(screen.queryByText(/dejó de llevar la cuenta/)).toBeNull();
});
