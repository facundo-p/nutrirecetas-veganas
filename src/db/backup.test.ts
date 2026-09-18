import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';
import {
  analizarImport,
  exportar,
  hayQueRecordarBackup,
  importar,
  posponerRecordatorioBackup,
} from './backup';
import { db } from './db';
import { addCoccion, getMeta, getPerfil, registrarBackup, savePerfil, saveOverlay } from './repos';
import type { CoccionData, ProfileData } from './schema';

const perfil: ProfileData = {
  sexo_para_requerimientos: 'masculino',
  fecha_nacimiento: '1990-05-02',
  peso_kg: 78,
  nivel_entrenamiento: 'activo',
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
  await addCoccion(coccion);
  await saveOverlay('r01', { estado: 'favorita' });
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
    expect((await db.overlays.get('r01'))!.estado).toBe('favorita');
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
    expect(reporte).toMatchObject({
      perfil: true,
      cocciones: 1,
      overlays: 1,
      consumos_descartados: 0,
      seed_version: '1.0.0',
    });
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

describe('backups de esquemas viejos', () => {
  const backupV1 = {
    user_schema_version: 1,
    seed_version: '1.0.0',
    exported_at: '2026-08-01T00:00:00.000Z',
    data: {
      perfil: {
        id: 1,
        sexo_para_requerimientos: 'masculino',
        fecha_nacimiento: '1990-05-02',
        peso_kg: 78,
        multiplicador_actividad: 1.2,
        nutrientes_destacados: ['hierro'],
        creado_en: '2026-07-01T00:00:00.000Z',
        actualizado_en: '2026-08-01T00:00:00.000Z',
      },
      cocciones: [],
      consumos: [],
      overlays: [],
    },
  };

  /** v2 con consumos de verdad: lo que tiene en el disco cualquiera que usó la app. */
  const backupV2ConConsumos = {
    user_schema_version: 2,
    seed_version: '1.0.0',
    exported_at: '2026-08-20T00:00:00.000Z',
    data: {
      perfil: null,
      cocciones: [{ ...coccion, id: 1 }],
      consumos: [
        { id: 1, coccion_id: 1, fecha: '2026-08-19T20:30:00.000Z', porciones: 2 },
        { id: 2, coccion_id: 1, fecha: '2026-08-20T13:00:00.000Z', porciones: 1 },
      ],
      overlays: [],
    },
  };

  test('un backup v1 sigue entrando: es la única red de seguridad que hay', async () => {
    await importar(backupV1, '1.0.0');
    expect((await getPerfil())!.nivel_entrenamiento).toBe('fuerza');
  });

  test('el dry-run de un backup v1 no lo confunde con uno del futuro', () => {
    expect(analizarImport(backupV1).esquema_futuro).toBe(false);
    expect(analizarImport(backupV1).perfil).toBe(true);
  });

  test('un backup con consumos entra igual: se descartan, no rebota el archivo', async () => {
    // `backupSchema` es estricto, así que sin migrar el campo de más tira el
    // archivo entero a la basura — y con él las cocciones, que sí se pueden salvar
    await importar(backupV2ConConsumos, '1.0.0');
    expect(await db.cocciones.count()).toBe(1);
  });

  test('el dry-run dice cuántos consumos va a descartar', () => {
    expect(analizarImport(backupV2ConConsumos).consumos_descartados).toBe(2);
  });
});

describe('recordatorio de backup', () => {
  const hoy = new Date('2026-08-19T12:00:00Z');

  test('sin cambios no molesta, por viejo que sea el backup', () => {
    expect(hayQueRecordarBackup({ ultimo_backup: '2020-01-01T00:00:00Z', cambios_desde_backup: 0 }, hoy)).toBe(false);
  });

  test('con cambios y sin backup nunca hecho, avisa', () => {
    expect(hayQueRecordarBackup({ cambios_desde_backup: 3 }, hoy)).toBe(true);
  });

  test('con cambios y backup reciente, no molesta', () => {
    expect(hayQueRecordarBackup({ ultimo_backup: '2026-08-10T00:00:00Z', cambios_desde_backup: 3 }, hoy)).toBe(false);
  });

  test('con cambios y más de 30 días, avisa', () => {
    expect(hayQueRecordarBackup({ ultimo_backup: '2026-07-01T00:00:00Z', cambios_desde_backup: 1 }, hoy)).toBe(true);
  });
});

describe('postergar el recordatorio', () => {
  const hoy = new Date('2026-08-19T12:00:00Z');
  // El caso de Facu: nunca hizo un backup, así que el aviso no se apagaba nunca.
  const pospuesto = {
    cambios_desde_backup: 5,
    backup_pospuesto_hasta: '2026-08-26T12:00:00.000Z',
    backup_pospuesto_en_cambios: 5,
  };

  test('recién pospuesto se calla', () => {
    expect(hayQueRecordarBackup(pospuesto, hoy)).toBe(false);
  });

  test('vencido el plazo, vuelve', () => {
    expect(hayQueRecordarBackup(pospuesto, new Date('2026-08-26T12:00:01Z'))).toBe(true);
  });

  test('sigue callado con 19 cambios nuevos, vuelve con 20', () => {
    expect(hayQueRecordarBackup({ ...pospuesto, cambios_desde_backup: 5 + 19 }, hoy)).toBe(false);
    expect(hayQueRecordarBackup({ ...pospuesto, cambios_desde_backup: 5 + 20 }, hoy)).toBe(true);
  });

  test('posponer escribe el vencimiento a 7 días y la marca de cambios', async () => {
    await sembrar();
    const antes = await getMeta();
    await posponerRecordatorioBackup(hoy);

    const meta = await getMeta();
    expect(meta.backup_pospuesto_hasta).toBe('2026-08-26T12:00:00.000Z');
    expect(meta.backup_pospuesto_en_cambios).toBe(antes.cambios_desde_backup);
    expect(hayQueRecordarBackup(meta, hoy)).toBe(false);
  });

  test('un backup de verdad borra la postergación', async () => {
    await sembrar();
    await posponerRecordatorioBackup(hoy);
    await registrarBackup('2026-08-19T13:00:00.000Z');

    const meta = await getMeta();
    expect(meta.backup_pospuesto_hasta).toBeUndefined();
    expect(meta.backup_pospuesto_en_cambios).toBeUndefined();
  });
});
