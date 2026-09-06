import { db } from './db';
import { estadoDeReceta, estadoTrasCocinar } from '../domain/estado';
import type { Recipe } from '../seed/schema';
import {
  USER_SCHEMA_VERSION,
  cookingDataSchema,
  profileDataSchema,
  type Coccion,
  type CoccionData,
  type Meta,
  type Overlay,
  type Perfil,
  type ProfileData,
} from './schema';

/**
 * Operaciones sobre la base de usuario. Todo lo que escribe valida con Zod
 * antes de tocar IndexedDB: un dato mal formado se detecta acá, no tres
 * pantallas después.
 */

const SINGLETON_ID = 1;

function ahora(): string {
  return new Date().toISOString();
}

// ---------- meta ----------

/** Estado inicial de meta, sin escribir: sirve para leer antes de que exista. */
export const META_POR_DEFECTO: Meta = {
  id: SINGLETON_ID,
  user_schema_version: USER_SCHEMA_VERSION,
  seed_version: '',
  cambios_desde_backup: 0,
};

/**
 * Ojo: esto ESCRIBE si el registro no existe, así que no puede usarse dentro de
 * un `liveQuery` (contexto de solo lectura). Para leer, `db.meta.get` + el valor
 * por defecto.
 */
export async function getMeta(): Promise<Meta> {
  const meta = await db.meta.get(SINGLETON_ID);
  if (meta) return meta;
  await db.meta.put(META_POR_DEFECTO);
  return META_POR_DEFECTO;
}

/** Suma cambios pendientes de backup: alimenta el recordatorio de Ajustes. */
async function contarCambio(): Promise<void> {
  const meta = await getMeta();
  await db.meta.put({ ...meta, cambios_desde_backup: meta.cambios_desde_backup + 1 });
}

export async function registrarBackup(fecha = ahora()): Promise<void> {
  const meta = await getMeta();
  const { backup_pospuesto_hasta: _h, backup_pospuesto_en_cambios: _c, ...resto } = meta;
  // Un backup de verdad borra la postergación: no hay nada que callar.
  await db.meta.put({ ...resto, ultimo_backup: fecha, cambios_desde_backup: 0 });
}

/**
 * Deja `meta` al día con el esquema actual. Se llama al cerrar el aviso de una
 * migración con pérdida: mientras la marca esté vieja, el aviso vuelve — que es
 * justo lo que se quiere de algo que borró datos.
 */
export async function marcarEsquemaVisto(): Promise<void> {
  const meta = await getMeta();
  await db.meta.put({ ...meta, user_schema_version: USER_SCHEMA_VERSION });
}

export async function registrarSeedVersion(seed_version: string): Promise<void> {
  const meta = await getMeta();
  if (meta.seed_version !== seed_version) await db.meta.put({ ...meta, seed_version });
}

// ---------- perfil ----------

export function getPerfil(): Promise<Perfil | undefined> {
  return db.perfil.get(SINGLETON_ID);
}

export async function savePerfil(datos: ProfileData): Promise<void> {
  const validos = profileDataSchema.parse(datos);
  const previo = await getPerfil();
  await db.perfil.put({
    ...validos,
    id: SINGLETON_ID,
    creado_en: previo?.creado_en ?? ahora(),
    actualizado_en: ahora(),
  });
  await contarCambio();
}

// ---------- cocciones ----------

export async function addCoccion(datos: CoccionData): Promise<number> {
  const validos = cookingDataSchema.parse(datos);
  const id = await db.cocciones.add(validos as Coccion);
  await contarCambio();
  return id;
}

export function getCoccion(id: number): Promise<Coccion | undefined> {
  return db.cocciones.get(id);
}

/** Cocciones más recientes primero (el diario y "última cocción" las quieren así). */
export async function listCocciones(): Promise<Coccion[]> {
  const todas = await db.cocciones.toArray();
  return todas.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// ---------- overlays ----------

export function getOverlay(receta_id: string): Promise<Overlay | undefined> {
  return db.overlays.get(receta_id);
}

export function listOverlays(): Promise<Overlay[]> {
  return db.overlays.toArray();
}

/**
 * Registrar una cocción marca la receta como probada. La regla de qué no
 * degradar vive en el dominio (`estadoTrasCocinar`); acá solo se lee el estado
 * efectivo y se escribe si cambió, para no ensuciar `actualizado_en` de una
 * favorita cada vez que se cocina.
 */
export async function marcarProbadaAlCocinar(receta: Pick<Recipe, 'id' | 'estado'>): Promise<void> {
  const actual = estadoDeReceta(receta, await getOverlay(receta.id));
  const siguiente = estadoTrasCocinar(actual);
  if (siguiente !== actual) await saveOverlay(receta.id, { estado: siguiente });
}

export async function saveOverlay(
  receta_id: string,
  cambios: Partial<Omit<Overlay, 'receta_id' | 'actualizado_en'>>,
): Promise<void> {
  const previo = await getOverlay(receta_id);
  await db.overlays.put({ ...previo, ...cambios, receta_id, actualizado_en: ahora() });
  await contarCambio();
}
