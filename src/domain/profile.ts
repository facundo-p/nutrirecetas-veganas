import type { Perfil } from '../db/schema';
import type { Nutrient } from '../seed/schema';
import { amountUnitOf } from './units';
import { factorDeProteina } from './actividad';
import { resolveRda, veganFactor } from './rda';

/**
 * Del perfil real a los objetivos por nutriente: RDA por sexo y edad → ajuste
 * vegano → ajuste por peso y entrenamiento.
 *
 * Los suplementos y los overrides salieron en la v4. Existían para el semáforo
 * —uno apagaba la exigencia de un nutriente, el otro la pisaba— y sin semáforo
 * no hay exigencia que apagar: el objetivo es una referencia contra la que se
 * informa un porcentaje, no una cuenta que haya que cerrar.
 */

export interface ObjetivoNutriente {
  nutriente_id: string;
  nombre: string;
  valor: number;
  unidad: string;
  /** No había ventana exacta de sexo/edad: se usó la más cercana. */
  aproximada?: true;
}

export function edadEnAnios(fecha_nacimiento: string, hoy: Date): number {
  const nacimiento = new Date(`${fecha_nacimiento}T00:00:00`);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const cumplioEsteAnio =
    hoy.getMonth() > nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
  if (!cumplioEsteAnio) edad -= 1;
  return edad;
}

/** El entrenamiento solo mueve la proteína (así lo define el dataset). */
function aplicaEntrenamiento(nutriente: Nutrient): boolean {
  return nutriente.id === 'proteina';
}

export function objetivosDelPerfil(
  perfil: Perfil,
  nutrientes: Nutrient[],
  hoy: Date,
): Map<string, ObjetivoNutriente> {
  const edad = edadEnAnios(perfil.fecha_nacimiento, hoy);
  const objetivos = new Map<string, ObjetivoNutriente>();

  for (const nutriente of nutrientes) {
    const rda = resolveRda(nutriente, perfil.sexo_para_requerimientos, edad, perfil.peso_kg);
    let valor = rda.valor * veganFactor(nutriente);
    if (aplicaEntrenamiento(nutriente)) valor *= factorDeProteina(perfil.nivel_entrenamiento, edad);

    objetivos.set(nutriente.id, {
      nutriente_id: nutriente.id,
      nombre: nutriente.nombre,
      valor,
      unidad: amountUnitOf(nutriente.clave_ingrediente),
      ...(rda.aproximada ? { aproximada: true as const } : {}),
    });
  }
  return objetivos;
}
