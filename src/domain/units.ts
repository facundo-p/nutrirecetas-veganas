import type { IngredientNutrientKey } from '../seed/schema';

/**
 * Unidad para CANTIDADES absolutas, derivada de la clave del ingrediente.
 * La `unidad` del catálogo de nutrientes expresa la RDA (proteína: "g/kg") y no
 * sirve para rotular ni un valor por porción ni un objetivo diario.
 */
export function amountUnitOf(clave: IngredientNutrientKey | string): string {
  if (clave === 'vita_ug_rae') return 'µg RAE';
  if (clave.endsWith('_ug')) return 'µg';
  if (clave.endsWith('_mg')) return 'mg';
  return 'g';
}
