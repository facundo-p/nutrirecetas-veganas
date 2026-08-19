import { create } from 'zustand';
import type { LineRef, Recipe, Seed } from '../seed/schema';
import { lineaAgregada, lineasIniciales, sustituirLinea, type LineaSesion } from '../domain/session';

/**
 * Estado efímero de la sesión de cocina: qué está en la mesada ahora mismo.
 * No persiste a propósito — lo que importa guardar es la cocción registrada al
 * final, no el borrador. Todo lo demás en la app lo maneja la base (la base ES
 * el estado); este store existe solo porque una sesión a medias no es un dato.
 */

export type PasoSesion = 'personalizar' | 'pasos' | 'registrar';

interface SessionState {
  recetaId: string | null;
  factor: number;
  porciones: number;
  lineas: LineaSesion[];
  paso: PasoSesion;
  pasoActual: number;
  iniciar: (recipe: Recipe, factor: number, seed: Seed) => void;
  toggleLinea: (key: string) => void;
  sustituir: (key: string, ref: LineRef, seed: Seed) => void;
  agregar: (ref: LineRef, gramos: number, seed: Seed) => void;
  irA: (paso: PasoSesion) => void;
  avanzarPaso: (delta: number, total: number) => void;
  terminar: () => void;
}

export const useSession = create<SessionState>((set) => ({
  recetaId: null,
  factor: 1,
  porciones: 1,
  lineas: [],
  paso: 'personalizar',
  pasoActual: 0,

  iniciar: (recipe, factor, seed) =>
    set({
      recetaId: recipe.id,
      factor,
      porciones: (recipe.porciones_num ?? 1) * factor,
      lineas: lineasIniciales(recipe, factor, seed),
      paso: 'personalizar',
      pasoActual: 0,
    }),

  toggleLinea: (key) =>
    set((estado) => ({
      lineas: estado.lineas.map((l) => (l.key === key ? { ...l, activa: !l.activa } : l)),
    })),

  sustituir: (key, ref, seed) =>
    set((estado) => ({
      lineas: estado.lineas.map((l) => (l.key === key ? sustituirLinea(l, ref, seed) : l)),
    })),

  agregar: (ref, gramos, seed) =>
    set((estado) => ({
      lineas: [...estado.lineas, lineaAgregada(ref, gramos, seed, `extra-${estado.lineas.length}`)],
    })),

  irA: (paso) => set({ paso }),

  avanzarPaso: (delta, total) =>
    set((estado) => ({ pasoActual: Math.min(total - 1, Math.max(0, estado.pasoActual + delta)) })),

  terminar: () => set({ recetaId: null, lineas: [], paso: 'personalizar', pasoActual: 0 }),
}));
