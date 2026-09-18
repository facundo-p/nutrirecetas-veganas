import type { Recipe } from '../seed/schema';

/**
 * Tu relación con una receta: una sola etiqueta, excluyente. Reemplaza al índice
 * de confianza en la tarjeta, que medía otra cosa —cuánta confianza tiene la
 * fuente en su propia adaptación vegana— y se leía como una nota (#144).
 */
export const ESTADOS_DE_RECETA = ['sin-probar', 'probada', 'pendiente', 'favorita'] as const;
export type EstadoDeReceta = (typeof ESTADOS_DE_RECETA)[number];

/** Una receta: "probada". */
export const ETIQUETA_DE_ESTADO: Record<EstadoDeReceta, string> = {
  'sin-probar': 'sin probar',
  probada: 'probada',
  pendiente: 'pendiente',
  favorita: 'favorita',
};

/** Un filtro pide un conjunto: "probadas". */
export const ETIQUETA_PLURAL_DE_ESTADO: Record<EstadoDeReceta, string> = {
  'sin-probar': 'sin probar',
  probada: 'probadas',
  pendiente: 'pendientes',
  favorita: 'favoritas',
};

/**
 * Sin elección propia manda la semilla, que ya parte las 84 exactamente donde
 * hay que partirlas: las 45 del recetario personal vienen `probada` —son las que
 * Facu cocinó— y las otras 39 `por-probar`. La semilla no se muta: se lee.
 */
export function estadoDeReceta(
  receta: Pick<Recipe, 'estado'>,
  overlay: { estado?: EstadoDeReceta } | null | undefined,
): EstadoDeReceta {
  return overlay?.estado ?? (receta.estado === 'probada' ? 'probada' : 'sin-probar');
}

/**
 * Cocinar algo lo vuelve probado, pero no puede degradar una elección: marcar
 * favorita es una opinión, y registrar una cocción no la contradice.
 */
export function estadoTrasCocinar(actual: EstadoDeReceta): EstadoDeReceta {
  return actual === 'favorita' ? 'favorita' : 'probada';
}
