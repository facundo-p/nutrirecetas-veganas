// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { db } from '../../db/db';
import { addCoccion, saveOverlay } from '../../db/repos';
import type { CoccionData } from '../../db/schema';
import { TodayScreen } from './TodayScreen';

function coccionHoy(): CoccionData {
  return {
    receta_id: 'r01',
    receta_nombre: 'Sopa de lentejas',
    seed_version: '1.0.0',
    fecha: new Date().toISOString(),
    porciones_rendidas: 4,
    factor_escala: 1,
    lineas: [],
    variaciones: [],
    nutricion_porcion: {
      masa_total_g: 500,
      kcal: { intervalo: { min: 244, max: 244 }, cobertura_pct: 99, ic: 8 },
      por_nutriente: {},
      alerta_b12: false,
    },
  };
}

beforeEach(async () => {
  // limpiar en vez de borrar: cerrar la base deja colgadas las queries en vuelo
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('pantalla Hoy', () => {
  test('no evalúa nada: sin semáforo no hay estados ni ventanas', async () => {
    await addCoccion(coccionHoy());

    render(<TodayScreen />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Qué cocinás/i })).toBeDefined());
    expect(screen.queryByText(/se evalúa por/)).toBeNull();
    expect(screen.queryByText('cubierto')).toBeNull();
    expect(screen.queryByText('sin datos')).toBeNull();
  });

  test('la última cocción enlaza al diario', async () => {
    await addCoccion(coccionHoy());

    render(<TodayScreen />);
    await waitFor(() => expect(screen.getByText('Última cocción')).toBeDefined());
    expect(screen.getByRole('link', { name: 'Sopa de lentejas' })).toBeDefined();
  });

  test('no pide completar el perfil: la app funciona sin él', async () => {
    render(<TodayScreen />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Qué cocinás/i })).toBeDefined());
    expect(screen.queryByRole('link', { name: /Completar mi perfil/ })).toBeNull();
  });

  test('no hay sobras que administrar: se fueron con los consumos', async () => {
    await addCoccion(coccionHoy());

    render(<TodayScreen />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Qué cocinás/i })).toBeDefined());
    expect(screen.queryByText(/Te quedan porciones/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Comí 1' })).toBeNull();
  });
});

describe('recomendaciones del día', () => {
  test('recomienda sin perfil y sin ningún registro', async () => {
    render(<TodayScreen />);
    await waitFor(() => expect(screen.getByText('Recomendaciones del día')).toBeDefined());
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  test('cada recomendación dice por qué está ahí', async () => {
    render(<TodayScreen />);
    await waitFor(() => expect(screen.getByText('Recomendaciones del día')).toBeDefined());
    const seccion = screen.getByText('Recomendaciones del día').closest('section')!;
    const motivos = seccion.querySelectorAll('.recomendacion-motivo');
    expect(motivos.length).toBeGreaterThan(0);
    for (const m of motivos) expect(m.textContent?.trim().length).toBeGreaterThan(0);
  });

  test('una favorita sube y lo dice', async () => {
    await saveOverlay('r04', { favorita: true });
    render(<TodayScreen />);
    await waitFor(() => expect(screen.getByText(/la marcaste favorita/)).toBeDefined());
  });
});
