import { db } from './db';
import { consumosEnBackup, migrarBackup } from './migrations';
import { getMeta, registrarBackup } from './repos';
import { USER_SCHEMA_VERSION, backupSchema, type Backup, type Meta } from './schema';

/**
 * Export / import. Sin backend, este archivo es la única red de seguridad que
 * existe: si el navegador purga la base (riesgo #1 del proyecto, iOS), lo único
 * que trae los datos de vuelta es un backup.
 *
 * El import **reemplaza todo**, nunca mergea: el merge es donde viven los bugs
 * que pierden datos en silencio. Antes de pisar, se guarda un auto-export.
 */

export async function exportar(seed_version: string): Promise<Backup> {
  const [perfil, cocciones, overlays] = await Promise.all([
    db.perfil.get(1),
    db.cocciones.toArray(),
    db.overlays.toArray(),
  ]);
  return {
    user_schema_version: USER_SCHEMA_VERSION,
    seed_version,
    exported_at: new Date().toISOString(),
    data: { perfil: perfil ?? null, cocciones, overlays },
  };
}

export function nombreDeArchivo(fecha = new Date()): string {
  return `nutrirecetas-backup-${fecha.toISOString().slice(0, 10)}.json`;
}

export interface ReporteImport {
  perfil: boolean;
  cocciones: number;
  overlays: number;
  /** Consumos que traía un backup anterior a v3 y que el import tira. Se dice, no se calla. */
  consumos_descartados: number;
  exportado_en: string;
  seed_version: string;
  /** El backup viene de un esquema más nuevo que esta app: no se puede importar. */
  esquema_futuro: boolean;
}

/** Dry-run: qué trae el archivo, antes de tocar nada. */
export function analizarImport(json: unknown): ReporteImport {
  const backup = backupSchema.parse(migrarBackup(json));
  return {
    perfil: backup.data.perfil !== null,
    cocciones: backup.data.cocciones.length,
    overlays: backup.data.overlays.length,
    // se cuenta sobre el json crudo: para cuando `migrarBackup` terminó, ya no están
    consumos_descartados: consumosEnBackup(json),
    exportado_en: backup.exported_at,
    seed_version: backup.seed_version,
    esquema_futuro: backup.user_schema_version > USER_SCHEMA_VERSION,
  };
}

export interface ResultadoImport {
  reporte: ReporteImport;
  /** Copia del estado anterior, por si el reemplazo no era lo que se esperaba. */
  respaldo_previo: Backup;
}

export async function importar(json: unknown, seed_version: string): Promise<ResultadoImport> {
  const backup = backupSchema.parse(migrarBackup(json));
  // sobre el json crudo, no sobre `backup`: los consumos descartados solo se
  // pueden contar antes de que la migración se los lleve
  const reporte = analizarImport(json);
  if (reporte.esquema_futuro) {
    throw new Error(
      'Ese backup viene de una versión más nueva de la app. Actualizá la app antes de importarlo, así no se pierde nada.',
    );
  }

  // red de seguridad: lo que había queda guardado antes de pisarlo
  const respaldo_previo = await exportar(seed_version);

  await db.transaction('rw', [db.perfil, db.cocciones, db.overlays], async () => {
    await Promise.all([db.perfil.clear(), db.cocciones.clear(), db.overlays.clear()]);
    if (backup.data.perfil) await db.perfil.put(backup.data.perfil);
    if (backup.data.cocciones.length > 0) await db.cocciones.bulkPut(backup.data.cocciones);
    if (backup.data.overlays.length > 0) await db.overlays.bulkPut(backup.data.overlays);
  });

  await registrarBackup(backup.exported_at);
  return { reporte, respaldo_previo };
}

/** Días desde el último backup; null si nunca se hizo uno. */
export function diasDesde(fechaIso: string | undefined, hoy = new Date()): number | null {
  if (!fechaIso) return null;
  const ms = hoy.getTime() - new Date(fechaIso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export const DIAS_PARA_RECORDAR = 30;
export const DIAS_DE_POSTERGACION = 7;
export const CAMBIOS_QUE_REVIVEN = 20;

/** Lo que el recordatorio necesita saber de `meta`, sin arrastrar el resto. */
export type MetaDeRecordatorio = Pick<
  Meta,
  'ultimo_backup' | 'cambios_desde_backup' | 'backup_pospuesto_hasta' | 'backup_pospuesto_en_cambios'
>;

/**
 * Una postergación sigue viva mientras no venza por fecha NI por cambios. Los
 * dos vencimientos existen porque miden cosas distintas: siete días sin tocar
 * la app no son lo mismo que siete días cocinando todos los días.
 */
function postergacionVigente(meta: MetaDeRecordatorio, hoy: Date): boolean {
  if (!meta.backup_pospuesto_hasta) return false;
  if (new Date(meta.backup_pospuesto_hasta).getTime() <= hoy.getTime()) return false;
  const cambiosAlPosponer = meta.backup_pospuesto_en_cambios ?? 0;
  return meta.cambios_desde_backup - cambiosAlPosponer < CAMBIOS_QUE_REVIVEN;
}

export function hayQueRecordarBackup(meta: MetaDeRecordatorio, hoy = new Date()): boolean {
  if (meta.cambios_desde_backup === 0) return false;
  if (postergacionVigente(meta, hoy)) return false;
  const dias = diasDesde(meta.ultimo_backup, hoy);
  return dias === null || dias >= DIAS_PARA_RECORDAR;
}

/**
 * Calla el recordatorio hasta que venza. Vive acá y no en `repos` para no
 * cerrar un ciclo de imports: `backup` ya depende de `repos`, no al revés.
 */
export async function posponerRecordatorioBackup(hoy = new Date()): Promise<void> {
  const meta = await getMeta();
  const hasta = new Date(hoy.getTime() + DIAS_DE_POSTERGACION * 24 * 60 * 60 * 1000);
  await db.meta.put({
    ...meta,
    backup_pospuesto_hasta: hasta.toISOString(),
    backup_pospuesto_en_cambios: meta.cambios_desde_backup,
  });
}
