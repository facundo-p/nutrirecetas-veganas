// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { db } from '../../db/db';
import { addCoccion } from '../../db/repos';
import type { CoccionData } from '../../db/schema';
import { DiaryScreen } from './DiaryScreen';

const coccion: CoccionData = {
  receta_id: 'p19',
  receta_nombre: 'Pastel de papas',
  seed_version: '1.0.0',
  fecha: '2026-08-18T20:00:00.000Z',
  porciones_rendidas: 6,
  factor_escala: 1,
  lineas: [],
  variaciones: [
    { tipo: 'desmarcado', nombre: 'Vino tinto' },
    { tipo: 'agregado', nombre: 'Espinaca', detalle: '80 g' },
  ],
  nota: 'quedó más rica con más pimentón',
  nutricion_porcion: {
    masa_total_g: 343,
    kcal: { intervalo: { min: 457, max: 471 }, cobertura_pct: 99, ic: 8 },
    por_nutriente: {},
    alerta_b12: true,
  },
};

beforeEach(async () => {
  // limpiar en vez de borrar: cerrar la base deja colgadas las queries en vuelo
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('diario', () => {
  test('sin cocciones, explica cómo empieza a llenarse', async () => {
    render(<DiaryScreen />);
    await waitFor(() => expect(screen.getByText(/Todavía no hay cocciones/)).toBeDefined());
  });

  test('lista la cocción con sus variaciones, su nota y lo que rindió', async () => {
    await addCoccion(coccion);

    render(<DiaryScreen />);
    await waitFor(() => expect(screen.getByText('Pastel de papas')).toBeDefined());
    expect(screen.getByText(/rindió 6/)).toBeDefined();
    expect(screen.getByText('sin Vino tinto')).toBeDefined();
    expect(screen.getByText('+ Espinaca (80 g)')).toBeDefined();
    expect(screen.getByText(/quedó más rica con más pimentón/)).toBeDefined();
  });

  test('no pregunta cuánto comiste: el diario registra cocciones', async () => {
    await addCoccion(coccion);

    render(<DiaryScreen />);
    await waitFor(() => screen.getByText('Pastel de papas'));
    expect(screen.queryByRole('button', { name: 'Registrar' })).toBeNull();
    expect(screen.queryByText(/comiste|quedan/)).toBeNull();
  });

  test('marca la alerta B12 de las cocciones que la llevan', async () => {
    await addCoccion(coccion);
    render(<DiaryScreen />);
    await waitFor(() => expect(screen.getByLabelText(/levadura nutricional/)).toBeDefined());
  });
});
