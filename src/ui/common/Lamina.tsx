import type { LaminaId } from '../../seed/laminas';

/** Dónde va: cada lugar tiene su tamaño y su ubicación en `componentes.css`. */
export type LugarDeLamina = 'encabezado' | 'ficha' | 'cierre' | 'vacio';

/**
 * Un grabado de verdura entintado por el tema. El trazo es una máscara por
 * `data-lamina` y el color, `--ilustracion`: el mismo archivo es tiza sobre
 * musgo y lápiz sobre papel. Es decoración, así que el lector de pantalla no
 * lo lee y no recibe toques.
 */
export function Lamina({ id, lugar }: { id: LaminaId; lugar: LugarDeLamina }) {
  return <span className={`lamina lamina-${lugar}`} data-lamina={id} aria-hidden="true" />;
}
