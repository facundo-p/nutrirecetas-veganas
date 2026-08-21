// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { db } from '../../db/db';
import { addCoccion, addConsumo, savePerfil } from '../../db/repos';
import type { CoccionData, ProfileData } from '../../db/schema';
import { TodayScreen } from './TodayScreen';

const perfil: ProfileData = {
  sexo_para_requerimientos: 'masculino',
  fecha_nacimiento: '1990-01-01',
  peso_kg: 75,
  nivel_entrenamiento: 'sedentario',
  suplementos: [{ nutriente_id: 'b12', dosis: 1000, unidad: 'µg', frecuencia: '2x_semana' }],
  overrides: [],
  nutrientes_destacados: ['hierro', 'b12', 'proteina'],
};

function coccionHoy(porNutriente: Record<string, number>): CoccionData {
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
      por_nutriente: Object.fromEntries(
        Object.entries(porNutriente).map(([k, v]) => [k, { intervalo: { min: v, max: v }, cobertura_pct: 95, ic: 8 }]),
      ),
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
  test('sin perfil, invita a completarlo en vez de mostrar un semáforo vacío', async () => {
    render(<TodayScreen />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /contame de vos/i })).toBeDefined());
    expect(screen.getByRole('link', { name: /Completar mi perfil/ })).toBeDefined();
  });

  test('avisa que solo mide lo que se registró en la app', async () => {
    await savePerfil(perfil);
    render(<TodayScreen />);
    await waitFor(() => expect(screen.getByText(/solo lo que registraste/i)).toBeDefined());
  });

  test('el estado se dice con texto, no solo con color', async () => {
    await savePerfil(perfil);
    const id = await addCoccion(coccionHoy({ hierro_mg: 15 }));
    await addConsumo({ coccion_id: id, fecha: new Date().toISOString(), porciones: 1 });

    render(<TodayScreen />);
    // hierro: 15 mg contra objetivo 14.4 → cubierto
    await waitFor(() => expect(screen.getAllByText('cubierto').length).toBeGreaterThan(0));
    // b12 tiene suplemento declarado
    expect(screen.getAllByText('por suplemento').length).toBeGreaterThan(0);
  });

  test('sin registros, los nutrientes dicen sin datos (nunca un rojo falso)', async () => {
    await savePerfil(perfil);
    render(<TodayScreen />);
    await waitFor(() => expect(screen.getAllByText('sin datos').length).toBeGreaterThan(0));
  });

  test('las sobras se listan y se pueden consumir de a una porción', async () => {
    await savePerfil(perfil);
    const id = await addCoccion(coccionHoy({ hierro_mg: 5 }));
    await addConsumo({ coccion_id: id, fecha: new Date().toISOString(), porciones: 1 });

    render(<TodayScreen />);
    await waitFor(() => expect(screen.getByText(/Te quedan porciones/)).toBeDefined());
    expect(screen.getByText(/3 porciones/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Comí 1' }));
    await waitFor(async () => {
      const consumos = await db.consumos.toArray();
      expect(consumos).toHaveLength(2);
    });
  });

  test('separa lo que se evalúa por día de lo que se evalúa por semana', async () => {
    await savePerfil(perfil);
    render(<TodayScreen />);
    await waitFor(() => expect(screen.getByText(/se evalúa por día/)).toBeDefined());
    expect(screen.getByText(/se evalúa por semana/)).toBeDefined();
  });
});
