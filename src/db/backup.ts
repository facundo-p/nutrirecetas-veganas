import { db } from './db';
import { migrarBackup } from './migrations';
import { registrarBackup } from './repos';
import { USER_SCHEMA_VERSION, backupSchema, type Backup } from './schema';

/**
 * Export / import. Sin backend, este archivo es la única red de seguridad que
 * existe: si el navegador purga la base (riesgo #1 del proyecto, iOS), lo único
 * que trae los datos de vuelta es un backup.
 *
 * El import **reemplaza todo**, nunca mergea: el merge es donde viven los bugs
 * que pierden datos en silencio. Antes de pisar, se guarda un auto-export.
 */

export async function exportar(seed_version: string): Promise<Backup> {
  const [perfil, cocciones, consumos, overlays] = await Promise.all([
    db.perfil.get(1),
    db.cocciones.toArray(),
    db.consumos.toArray(),
    db.overlays.toArray(),
  ]);
  return {
    user_schema_version: USER_SCHEMA_VERSION,
    seed_version,
    exported_at: new Date().toISOString(),
    data: { perfil: perfil ?? null, cocciones, consumos, overlays },
  };
}

export function nombreDeArchivo(fecha = new Date()): string {
  return `nutrirecetas-backup-${fecha.toISOString().slice(0, 10)}.json`;
}

export interface ReporteImport {
  perfil: boolean;
  cocciones: number;
  consumos: number;
  overlays: number;
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
    consumos: backup.data.consumos.length,
    overlays: backup.data.overlays.length,
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
  const reporte = analizarImport(backup);
  if (reporte.esquema_futuro) {
    throw new Error(
      'Ese backup viene de una versión más nueva de la app. Actualizá la app antes de importarlo, así no se pierde nada.',
    );
  }

  // red de seguridad: lo que había queda guardado antes de pisarlo
  const respaldo_previo = await exportar(seed_version);

  await db.transaction('rw', [db.perfil, db.cocciones, db.consumos, db.overlays], async () => {
    await Promise.all([db.perfil.clear(), db.cocciones.clear(), db.consumos.clear(), db.overlays.clear()]);
    if (backup.data.perfil) await db.perfil.put(backup.data.perfil);
    if (backup.data.cocciones.length > 0) await db.cocciones.bulkPut(backup.data.cocciones);
    if (backup.data.consumos.length > 0) await db.consumos.bulkPut(backup.data.consumos);
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

export function hayQueRecordarBackup(
  ultimo_backup: string | undefined,
  cambios_desde_backup: number,
  hoy = new Date(),
): boolean {
  if (cambios_desde_backup === 0) return false;
  const dias = diasDesde(ultimo_backup, hoy);
  return dias === null || dias >= DIAS_PARA_RECORDAR;
}
