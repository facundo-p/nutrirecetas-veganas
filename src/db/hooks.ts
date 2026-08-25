import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Coccion, Consumo, Meta, Overlay, Perfil } from './schema';
import { META_POR_DEFECTO } from './repos';

/**
 * Lectura reactiva de la base: `useLiveQuery` reemite solo cuando los datos
 * cambian, así que la base ES el estado (no hace falta un store para esto).
 * `undefined` significa "todavía cargando", no "no hay nada".
 */

export function usePerfil(): Perfil | undefined | null {
  return useLiveQuery(async () => (await db.perfil.get(1)) ?? null, [], undefined);
}

export function useCocciones(): Coccion[] | undefined {
  return useLiveQuery(async () => {
    const todas = await db.cocciones.toArray();
    return todas.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, []);
}

export function useConsumos(): Consumo[] | undefined {
  return useLiveQuery(() => db.consumos.toArray(), []);
}

export function useOverlays(): Overlay[] | undefined {
  return useLiveQuery(() => db.overlays.toArray(), []);
}

export function useOverlay(receta_id: string): Overlay | undefined | null {
  return useLiveQuery(async () => (await db.overlays.get(receta_id)) ?? null, [receta_id], undefined);
}

export function useMeta(): Meta | undefined {
  // solo lectura: crear el registro acá rompería la transacción de liveQuery
  return useLiveQuery(async () => (await db.meta.get(1)) ?? META_POR_DEFECTO, []);
}
