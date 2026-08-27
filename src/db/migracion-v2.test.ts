import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeAll, expect, test } from 'vitest';
import { DB_NAME, db } from './db';

/**
 * Riesgo #2 del proyecto: una migración que corrompe se lleva puesto el
 * historial. Este test abre una base con la forma v1 real, la llena, y deja que
 * la app la abra: es la única prueba de que los upgrades corren de verdad.
 *
 * Vive en su propio archivo porque tiene que escribir la base ANTES de que `db`
 * la abra, y `db` es un singleton de módulo. Por eso el sembrado va en un
 * `beforeAll` y ningún test puede tocar `db` antes.
 */

const STORES_V1 = {
  perfil: 'id',
  cocciones: '++id, receta_id, fecha',
  consumos: '++id, coccion_id, fecha',
  overlays: 'receta_id',
  meta: 'id',
};

beforeAll(async () => {
  const vieja = new Dexie(DB_NAME);
  vieja.version(1).stores(STORES_V1);
  await vieja.open();

  await vieja.table('perfil').put({
    id: 1,
    nombre: 'Facu',
    sexo_para_requerimientos: 'masculino',
    fecha_nacimiento: '1990-01-01',
    peso_kg: 78,
    multiplicador_actividad: 1.2,
    suplementos: [{ nutriente_id: 'b12', dosis: 1000, unidad: 'µg', frecuencia: '2x_semana' }],
    overrides: [],
    nutrientes_destacados: ['hierro'],
    creado_en: '2026-08-01T00:00:00.000Z',
    actualizado_en: '2026-08-01T00:00:00.000Z',
  });
  await vieja.table('cocciones').put({
    id: 1,
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
      kcal: { intervalo: { min: 457, max: 471 }, cobertura_pct: 99, ic: 8 },
      por_nutriente: {},
      alerta_b12: true,
    },
  });
  await vieja.table('consumos').put({ id: 1, coccion_id: 1, fecha: '2026-08-19T20:30:00.000Z', porciones: 2 });
  await vieja.table('overlays').put({ receta_id: 'r01', favorita: true, actualizado_en: '2026-08-01T00:00:00.000Z' });
  await vieja.table('meta').put({ id: 1, user_schema_version: 1, seed_version: '1.0.0', cambios_desde_backup: 4 });

  vieja.close();
});

test('el multiplicador viejo se traduce a nivel de entrenamiento (v2)', async () => {
  const perfil = await db.perfil.get(1);

  expect(perfil).toBeDefined();
  expect(perfil!.nivel_entrenamiento).toBe('fuerza');
  expect(perfil).not.toHaveProperty('multiplicador_actividad');
  expect(perfil!.nombre).toBe('Facu');
  expect(perfil!.peso_kg).toBe(78);
});

test('v4 le saca al perfil los suplementos y los overrides', async () => {
  const perfil = await db.perfil.get(1);

  // `profileDataSchema` es estricto: un campo de más haría rebotar el próximo
  // guardado, así que la migración tiene que sacarlos del registro, no ignorarlos
  expect(perfil).not.toHaveProperty('suplementos');
  expect(perfil).not.toHaveProperty('overrides');
  // lo que el perfil sí conserva
  expect(perfil!.nutrientes_destacados).toEqual(['hierro']);
});

test('v3 se lleva los consumos y deja lo demás en pie', async () => {
  expect(db.tables.map((t) => t.name)).not.toContain('consumos');

  // lo que la migración NO puede tocar: es todo lo que Facu cargó a mano
  expect(await db.cocciones.count()).toBe(1);
  expect((await db.cocciones.get(1))!.receta_nombre).toBe('Pastel de papas');
  expect((await db.overlays.get('r01'))!.favorita).toBe(true);
});

test('la marca de esquema queda vieja hasta que el aviso se cierra', async () => {
  // es lo que hace que `AvisoDeConsumos` aparezca: sin esto la pérdida sería muda
  expect((await db.meta.get(1))!.user_schema_version).toBeLessThan(4);
});
