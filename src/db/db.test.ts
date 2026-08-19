import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';
import { db } from './db';
import {
  addConsumo,
  addCoccion,
  consumosDeCoccion,
  getMeta,
  getOverlay,
  getPerfil,
  porcionesSobrantes,
  saveOverlay,
  savePerfil,
} from './repos';
import type { CoccionData, ProfileData } from './schema';

const perfilBase: ProfileData = {
  sexo_para_requerimientos: 'masculino',
  fecha_nacimiento: '1990-05-02',
  peso_kg: 78,
  multiplicador_actividad: 1.1,
  suplementos: [],
  overrides: [],
  nutrientes_destacados: [],
};

const coccionBase: CoccionData = {
  receta_id: 'p19',
  receta_nombre: 'Pastel de papas',
  seed_version: '1.0.0',
  fecha: '2026-08-19T20:00:00.000Z',
  porciones_rendidas: 6,
  factor_escala: 1,
  lineas: [],
  variaciones: [],
  nutricion_porcion: {
    masa_total_g: 343,
    kcal: { intervalo: { min: 457, max: 471 }, cobertura_pct: 99.85, ic: 8 },
    por_nutriente: {},
    alerta_b12: true,
  },
};

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('perfil', () => {
  test('es un singleton que se pisa a sí mismo', async () => {
    await savePerfil(perfilBase);
    await savePerfil({ ...perfilBase, peso_kg: 80 });
    expect(await db.perfil.count()).toBe(1);
    expect((await getPerfil())!.peso_kg).toBe(80);
  });

  test('conserva la fecha de creación al actualizar', async () => {
    await savePerfil(perfilBase);
    const creado = (await getPerfil())!.creado_en;
    await savePerfil({ ...perfilBase, peso_kg: 81 });
    expect((await getPerfil())!.creado_en).toBe(creado);
  });

  test('no hay perfil hasta que el usuario lo carga (sin placeholders)', async () => {
    expect(await getPerfil()).toBeUndefined();
  });
});

describe('cocciones y consumos', () => {
  test('una cocción y sus consumos viven juntos', async () => {
    const id = await addCoccion(coccionBase);
    await addConsumo({ coccion_id: id, fecha: '2026-08-19T20:30:00.000Z', porciones: 2 });
    expect(await consumosDeCoccion(id)).toHaveLength(1);
  });

  test('las sobras son lo rendido menos lo consumido', async () => {
    const id = await addCoccion(coccionBase);
    await addConsumo({ coccion_id: id, fecha: '2026-08-19T20:30:00.000Z', porciones: 2 });
    await addConsumo({ coccion_id: id, fecha: '2026-08-20T13:00:00.000Z', porciones: 1 });
    expect(await porcionesSobrantes(id)).toBe(3);
  });

  test('registrar una cocción cuenta como cambio pendiente de backup', async () => {
    const antes = (await getMeta()).cambios_desde_backup;
    await addCoccion(coccionBase);
    expect((await getMeta()).cambios_desde_backup).toBe(antes + 1);
  });
});

describe('overlays', () => {
  test('guardan el IC del usuario sin tocar la semilla', async () => {
    await saveOverlay('r01', { ic_usuario: 8, favorita: true });
    const overlay = await getOverlay('r01');
    expect(overlay?.ic_usuario).toBe(8);
    expect(overlay?.favorita).toBe(true);
  });

  test('actualizar un overlay conserva lo que no se tocó', async () => {
    await saveOverlay('r01', { favorita: true });
    await saveOverlay('r01', { nota: 'salió mejor con más comino' });
    const overlay = await getOverlay('r01');
    expect(overlay?.favorita).toBe(true);
    expect(overlay?.nota).toBe('salió mejor con más comino');
  });
});
