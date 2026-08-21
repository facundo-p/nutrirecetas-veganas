import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { expect, test } from 'vitest';
import { DB_NAME, db } from './db';

/**
 * Riesgo #2 del proyecto: una migración que corrompe se lleva puesto el
 * historial. Este test abre una base con la forma v1 real, la llena, y deja que
 * la app la abra: es la única prueba de que el upgrade corre de verdad.
 *
 * Vive en su propio archivo porque tiene que escribir la base ANTES de que `db`
 * la abra, y `db` es un singleton de módulo.
 */

const STORES_V1 = {
  perfil: 'id',
  cocciones: '++id, receta_id, fecha',
  consumos: '++id, coccion_id, fecha',
  overlays: 'receta_id',
  meta: 'id',
};

test('un perfil con el multiplicador viejo llega a v2 sin perder nada', async () => {
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
  vieja.close();

  const perfil = await db.perfil.get(1);

  expect(perfil).toBeDefined();
  expect(perfil!.nivel_entrenamiento).toBe('fuerza');
  expect(perfil).not.toHaveProperty('multiplicador_actividad');
  expect(perfil!.nombre).toBe('Facu');
  expect(perfil!.peso_kg).toBe(78);
  expect(perfil!.suplementos).toHaveLength(1);
});
