import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';
import { analizarImport, exportar, hayQueRecordarBackup, importar } from './backup';
import { db } from './db';
import { addCoccion, addConsumo, getMeta, savePerfil, saveOverlay } from './repos';
import type { CoccionData, ProfileData } from './schema';

const perfil: ProfileData = {
  sexo_para_requerimientos: 'masculino',
  fecha_nacimiento: '1990-05-02',
  peso_kg: 78,
  multiplicador_actividad: 1.1,
  suplementos: [{ nutriente_id: 'b12', dosis: 1000, unidad: 'µg', frecuencia: '2x_semana' }],
  overrides: [],
  nutrientes_destacados: ['hierro'],
};

const coccion: CoccionData = {
  receta_id: 'p19',
  receta_nombre: 'Pastel de papas',
  seed_version: '1.0.0',
  fecha: '2026-08-19T20:00:00.000Z',
  porciones_rendidas: 6,
  factor_escala: 1,
  lineas: [{ ref: { tipo: 'ingrediente', id: 'papa' }, nombre: 'Papa', g_aprox: 1000, unidad_display: 'g' }],
  variaciones: [{ tipo: 'desmarcado', nombre: 'Vino tinto' }],
  nutricion_porcion: {
    masa_total_g: 343,
    kcal: { intervalo: { min: 457, max: 471 }, cobertura_pct: 99.85, ic: 8 },
    por_nutriente: { prot_g: { intervalo: { min: 28.8, max: 30.4 }, cobertura_pct: 91.5, ic: 7 } },
    alerta_b12: true,
  },
};

async function sembrar() {
  await savePerfil(perfil);
  const id = await addCoccion(coccion);
  await addConsumo({ coccion_id: id, fecha: '2026-08-19T20:30:00.000Z', porciones: 2 });
  await saveOverlay('r01', { favorita: true, ic_usuario: 8 });
}

beforeEach(async () => {
  // limpiar en vez de borrar: cerrar la base deja colgadas las queries en vuelo
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('export / import', () => {
  test('round-trip: exportar, borrar todo, importar y los datos vuelven idénticos', async () => {
    await sembrar();
    const backup = await exportar('1.0.0');

    await Promise.all(db.tables.map((t) => t.clear()));
    expect(await db.cocciones.count()).toBe(0);

    await importar(backup, '1.0.0');

    expect((await db.perfil.get(1))!.peso_kg).toBe(78);
    const cocciones = await db.cocciones.toArray();
    expect(cocciones).toHaveLength(1);
    expect(cocciones[0]!.variaciones).toEqual([{ tipo: 'desmarcado', nombre: 'Vino tinto' }]);
    expect(cocciones[0]!.nutricion_porcion.alerta_b12).toBe(true);
    expect(await db.consumos.count()).toBe(1);
    expect((await db.overlays.get('r01'))!.ic_usuario).toBe(8);
  });

  test('el import reemplaza, no mergea', async () => {
    await sembrar();
    const backup = await exportar('1.0.0');
    await addCoccion({ ...coccion, receta_id: 'r01', receta_nombre: 'Sopa' });
    expect(await db.cocciones.count()).toBe(2);

    await importar(backup, '1.0.0');
    expect(await db.cocciones.count()).toBe(1);
  });

  test('antes de pisar, devuelve el respaldo del estado anterior', async () => {
    await sembrar();
    const vacio = await exportar('1.0.0');
    await Promise.all(db.tables.map((t) => t.clear()));
    await savePerfil({ ...perfil, peso_kg: 99 });

    const { respaldo_previo } = await importar(vacio, '1.0.0');
    expect(respaldo_previo.data.perfil!.peso_kg).toBe(99);
  });

  test('el dry-run informa qué trae el backup sin tocar la base', async () => {
    await sembrar();
    const backup = await exportar('1.0.0');
    const reporte = analizarImport(backup);
    expect(reporte).toMatchObject({ perfil: true, cocciones: 1, consumos: 1, overlays: 1, seed_version: '1.0.0' });
    expect(await db.cocciones.count()).toBe(1); // sigue todo en su lugar
  });

  test('un archivo ajeno se rechaza sin tocar nada', async () => {
    await sembrar();
    expect(() => analizarImport({ hola: 'soy otro json' })).toThrow();
    await expect(importar({ hola: 'soy otro json' }, '1.0.0')).rejects.toThrow();
    expect(await db.cocciones.count()).toBe(1);
  });

  test('un backup de un esquema más nuevo no se importa a ciegas', async () => {
    await sembrar();
    const backup = await exportar('1.0.0');
    const futuro = { ...backup, user_schema_version: 99 };
    expect(analizarImport(futuro).esquema_futuro).toBe(true);
    await expect(importar(futuro, '1.0.0')).rejects.toThrow(/versión más nueva/);
  });

  test('importar deja la cuenta de cambios pendientes en cero', async () => {
    await sembrar();
    const backup = await exportar('1.0.0');
    expect((await getMeta()).cambios_desde_backup).toBeGreaterThan(0);
    await importar(backup, '1.0.0');
    expect((await getMeta()).cambios_desde_backup).toBe(0);
  });
});

describe('recordatorio de backup', () => {
  const hoy = new Date('2026-08-19T12:00:00Z');

  test('sin cambios no molesta, por viejo que sea el backup', () => {
    expect(hayQueRecordarBackup('2020-01-01T00:00:00Z', 0, hoy)).toBe(false);
  });

  test('con cambios y sin backup nunca hecho, avisa', () => {
    expect(hayQueRecordarBackup(undefined, 3, hoy)).toBe(true);
  });

  test('con cambios y backup reciente, no molesta', () => {
    expect(hayQueRecordarBackup('2026-08-10T00:00:00Z', 3, hoy)).toBe(false);
  });

  test('con cambios y más de 30 días, avisa', () => {
    expect(hayQueRecordarBackup('2026-07-01T00:00:00Z', 1, hoy)).toBe(true);
  });
});
