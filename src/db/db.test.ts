import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';
import { db } from './db';
import { addCoccion, getCoccion, getMeta, getOverlay, getPerfil, saveOverlay, savePerfil } from './repos';
import type { CoccionData, ProfileData } from './schema';

const perfilBase: ProfileData = {
  sexo_para_requerimientos: 'masculino',
  fecha_nacimiento: '1990-05-02',
  peso_kg: 78,
  nivel_entrenamiento: 'activo',
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
  // limpiar en vez de borrar: cerrar la base deja colgadas las queries en vuelo
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
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

describe('cocciones', () => {
  test('guardan lo que rindieron y su nutrición congelada', async () => {
    const id = await addCoccion(coccionBase);
    const coccion = await getCoccion(id);
    expect(coccion?.porciones_rendidas).toBe(6);
    expect(coccion?.nutricion_porcion.alerta_b12).toBe(true);
  });

  test('la base no tiene dónde guardar porciones comidas', async () => {
    // v3 se llevó la tabla: que no exista es el invariante, no un detalle
    expect(db.tables.map((t) => t.name)).not.toContain('consumos');
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
