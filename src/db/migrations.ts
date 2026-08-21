import { edadEnAnios } from '../domain/profile';
import { PISO_POR_EDAD, type NivelEntrenamiento } from '../domain/actividad';

/**
 * Migraciones de datos de usuario. Viven separadas del schema porque las lee
 * tanto Dexie (base en el dispositivo) como el import de backups (archivo en el
 * disco de Facu): un backup viejo tiene que seguir entrando, es la única red de
 * seguridad que existe si el navegador purga la base.
 */

/**
 * v1 guardaba `multiplicador_actividad` (1 | 1.1 | 1.2) y el 1.2 significaba
 * "fuerza o más de 60 años" — dos cosas distintas en el mismo número. La edad es
 * lo único que las separa: menor de 60 solo pudo haber elegido eso por entrenar;
 * de 60 para arriba le alcanzaba el piso etario, que en v2 se aplica solo.
 */
const NIVEL_SEGUN_MULTIPLICADOR: Record<string, NivelEntrenamiento> = {
  '1': 'sedentario',
  '1.1': 'activo',
};

export function migrarPerfilV1(perfil: Record<string, unknown>, hoy = new Date()): Record<string, unknown> {
  if (!('multiplicador_actividad' in perfil)) return perfil;

  const { multiplicador_actividad, ...resto } = perfil;
  const edad = edadEnAnios(String(perfil['fecha_nacimiento']), hoy);
  const nivel_entrenamiento =
    NIVEL_SEGUN_MULTIPLICADOR[String(multiplicador_actividad)] ??
    (edad >= PISO_POR_EDAD.desde_anios ? 'sedentario' : 'fuerza');

  return { ...resto, nivel_entrenamiento };
}

/**
 * Un backup exportado antes de v2 trae el perfil viejo, y `backupSchema` es
 * estricto: sin este paso previo el archivo rebota y Facu se queda sin red.
 * No toca `user_schema_version` — el archivo sigue siendo el que es, y el que
 * decide si viene del futuro es quien lo analiza.
 */
export function migrarBackup(json: unknown): unknown {
  if (typeof json !== 'object' || json === null) return json;
  const backup = json as { data?: { perfil?: Record<string, unknown> | null } };
  const perfil = backup.data?.perfil;
  if (!perfil) return json;
  return { ...backup, data: { ...backup.data, perfil: migrarPerfilV1(perfil) } };
}
