import type { SuplementoDeclarado } from '../db/schema';

/**
 * Un suplemento declarado apaga la exigencia alimentaria de su nutriente
 * (invariante 4), pero solo si el esquema declarado alcanza: 1000 µg de B12 dos
 * veces por semana cubren; 5 µg de vitamina D por día contra un objetivo de 15
 * no. Para poder compararlo con un objetivo diario, la dosis se lleva a su
 * equivalente por día.
 */

const VECES_POR_SEMANA: Record<SuplementoDeclarado['frecuencia'], number> = {
  diaria: 7,
  '3x_semana': 3,
  '2x_semana': 2,
  semanal: 1,
};

export function aporteDiarioEquivalente(suplemento: SuplementoDeclarado): number {
  return (suplemento.dosis * VECES_POR_SEMANA[suplemento.frecuencia]) / 7;
}

/** Aporte diario equivalente sumando todos los suplementos declarados de un nutriente. */
export function aporteDiarioDe(suplementos: SuplementoDeclarado[], nutriente_id: string): number {
  return suplementos
    .filter((s) => s.nutriente_id === nutriente_id)
    .reduce((total, s) => total + aporteDiarioEquivalente(s), 0);
}
