// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { db } from '../../db/db';
import { addCoccion, addConsumo } from '../../db/repos';
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

  test('lista la cocción con sus variaciones, su nota y sus porciones', async () => {
    const id = await addCoccion(coccion);
    await addConsumo({ coccion_id: id, fecha: '2026-08-18T20:30:00.000Z', porciones: 2 });

    render(<DiaryScreen />);
    await waitFor(() => expect(screen.getByText('Pastel de papas')).toBeDefined());
    expect(screen.getByText(/rindió 6 · comiste 2 · quedan 4/)).toBeDefined();
    expect(screen.getByText('sin Vino tinto')).toBeDefined();
    expect(screen.getByText('+ Espinaca (80 g)')).toBeDefined();
    expect(screen.getByText(/quedó más rica con más pimentón/)).toBeDefined();
  });

  test('comer sobras crea un consumo nuevo con la fecha de hoy', async () => {
    const id = await addCoccion(coccion);
    await addConsumo({ coccion_id: id, fecha: '2026-08-18T20:30:00.000Z', porciones: 2 });

    render(<DiaryScreen />);
    await waitFor(() => screen.getByText('Pastel de papas'));
    fireEvent.change(screen.getByLabelText(/Porciones comidas de Pastel de papas/), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(async () => {
      const consumos = await db.consumos.toArray();
      expect(consumos).toHaveLength(2);
      const nuevo = consumos.find((c) => c.porciones === 1)!;
      expect(new Date(nuevo.fecha).toDateString()).toBe(new Date().toDateString());
    });
  });

  test('no deja comer más porciones de las que sobran', async () => {
    const id = await addCoccion({ ...coccion, porciones_rendidas: 2 });
    await addConsumo({ coccion_id: id, fecha: '2026-08-18T20:30:00.000Z', porciones: 1.5 });

    render(<DiaryScreen />);
    await waitFor(() => screen.getByText('Pastel de papas'));
    fireEvent.change(screen.getByLabelText(/Porciones comidas de Pastel de papas/), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(async () => {
      const consumos = await db.consumos.toArray();
      const total = consumos.reduce((t, c) => t + c.porciones, 0);
      expect(total).toBeLessThanOrEqual(2);
    });
  });

  test('marca la alerta B12 de las cocciones que la llevan', async () => {
    await addCoccion(coccion);
    render(<DiaryScreen />);
    await waitFor(() => expect(screen.getByLabelText(/levadura nutricional/)).toBeDefined());
  });
});
