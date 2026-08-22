import { db } from './db';
import {
  USER_SCHEMA_VERSION,
  cookingDataSchema,
  intakeDataSchema,
  profileDataSchema,
  type Coccion,
  type CoccionData,
  type Consumo,
  type ConsumoData,
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

// ---------- consumos ----------

export async function addConsumo(datos: ConsumoData): Promise<number> {
  const validos = intakeDataSchema.parse(datos);
  const id = await db.consumos.add(validos as Consumo);
  await contarCambio();
  return id;
}

export function consumosDeCoccion(coccion_id: number): Promise<Consumo[]> {
  return db.consumos.where('coccion_id').equals(coccion_id).toArray();
}

export function listConsumos(): Promise<Consumo[]> {
  return db.consumos.toArray();
}

/** Porciones que quedaron sin comer de una cocción: lo que rindió menos lo consumido. */
export async function porcionesSobrantes(coccion_id: number): Promise<number> {
  const [coccion, consumos] = await Promise.all([getCoccion(coccion_id), consumosDeCoccion(coccion_id)]);
  if (!coccion) return 0;
  const comidas = consumos.reduce((total, c) => total + c.porciones, 0);
  return Math.max(0, coccion.porciones_rendidas - comidas);
}

// ---------- overlays ----------

export function getOverlay(receta_id: string): Promise<Overlay | undefined> {
  return db.overlays.get(receta_id);
}

export function listOverlays(): Promise<Overlay[]> {
  return db.overlays.toArray();
}

export async function saveOverlay(
  receta_id: string,
  cambios: Partial<Omit<Overlay, 'receta_id' | 'actualizado_en'>>,
): Promise<void> {
  const previo = await getOverlay(receta_id);
  await db.overlays.put({ ...previo, ...cambios, receta_id, actualizado_en: ahora() });
  await contarCambio();
}
