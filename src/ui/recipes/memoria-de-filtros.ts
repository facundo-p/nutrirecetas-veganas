import { EMPTY_FILTERS, type RecipeFiltersState } from './filtering';

/**
 * `App` es un switch por ruta: abrir una receta desmonta el recetario entero y
 * volver lo remonta de cero, así que su estado no puede vivir solo en el
 * componente — se volvía con los filtros en blanco.
 *
 * Vive a nivel de módulo, lo que dura la pestaña. No es dato de usuario: no va
 * a IndexedDB ni a localStorage.
 */
export const memoriaDeFiltros: {
  filtros: RecipeFiltersState;
  variantesAbiertas: Set<string>;
} = {
  filtros: EMPTY_FILTERS,
  variantesAbiertas: new Set(),
};

/** La memoria sobrevive al desmontaje a propósito, también entre tests. */
export function olvidarFiltros(): void {
  memoriaDeFiltros.filtros = EMPTY_FILTERS;
  memoriaDeFiltros.variantesAbiertas = new Set();
}
