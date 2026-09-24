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
 * v4: el perfil pierde suplementos y overrides. Los dos existían para el
 * semáforo —uno apagaba una exigencia, el otro la pisaba— y no tienen
 * reemplazo: lo único que hace el perfil ahora es personalizar el porcentaje.
 */
export function migrarPerfilV3(perfil: Record<string, unknown>): Record<string, unknown> {
  const { suplementos: _s, overrides: _o, ...resto } = perfil;
  return resto;
}

/**
 * v5: el overlay guarda un `estado` en vez de `favorita` + `ic_usuario`. Los dos
 * campos viejos son opiniones sobre la receta y las dos sobreviven traducidas:
 *
 * - `favorita: true` es la misma opinión con otro nombre. Gana sobre lo demás:
 *   era una elección, no un registro, y no se degrada a "probada".
 * - `ic_usuario` solo lo escribía un lugar, el checkbox de la cocina que decía
 *   "La probé y la apruebo", y solo sobre recetas por probar. O sea que su
 *   presencia **es** el registro de haberla cocinado y aprobado: se traduce a
 *   "probada". Descartarlo sin más borraba ese hecho, que es justo lo que el
 *   estado nuevo viene a decir.
 */
export function migrarOverlayV4(overlay: Record<string, unknown>): Record<string, unknown> {
  const { favorita, ic_usuario, ...resto } = overlay;
  if ('estado' in resto) return resto;
  if (favorita === true) return { ...resto, estado: 'favorita' };
  return ic_usuario !== undefined ? { ...resto, estado: 'probada' } : resto;
}

/** Cuántos consumos trae un backup viejo: lo que el import va a descartar. */
export function consumosEnBackup(json: unknown): number {
  if (typeof json !== 'object' || json === null) return 0;
  const consumos = (json as { data?: { consumos?: unknown } }).data?.consumos;
  return Array.isArray(consumos) ? consumos.length : 0;
}

/**
 * Un backup exportado antes de v2 trae el perfil viejo, y uno anterior a v3 trae
 * consumos. `backupSchema` es estricto en las dos puntas —campo desconocido o
 * campo faltante—, así que sin este paso previo el archivo rebota y Facu se
 * queda sin red.
 *
 * No toca `user_schema_version`: el archivo sigue siendo el que es, y el que
 * decide si viene del futuro es quien lo analiza.
 */
export function migrarBackup(json: unknown): unknown {
  if (typeof json !== 'object' || json === null) return json;
  const backup = json as {
    data?: { perfil?: Record<string, unknown> | null; consumos?: unknown; overlays?: unknown };
  };
  if (!backup.data) return json;

  // se descartan sin reemplazo: lo que contaban ya no se cuenta en ningún lado
  const { consumos: _consumos, ...data } = backup.data;
  const overlays = Array.isArray(data.overlays)
    ? data.overlays.map((o) => migrarOverlayV4(o as Record<string, unknown>))
    : data.overlays;
  const conOverlays = { ...data, ...(overlays !== undefined ? { overlays } : {}) };
  const perfil = conOverlays.perfil;
  return {
    ...backup,
    data: perfil ? { ...conOverlays, perfil: migrarPerfilV3(migrarPerfilV1(perfil)) } : conOverlays,
  };
}
