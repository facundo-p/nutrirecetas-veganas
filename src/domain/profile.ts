import type { Perfil } from '../db/schema';
import type { Nutrient } from '../seed/schema';
import { amountUnitOf } from './units';
import { factorDeProteina } from './actividad';
import { resolveRda, veganFactor } from './rda';
import { aporteDiarioDe } from './supplements';

/**
 * Del perfil real a los objetivos por nutriente. Es la traducción de la lógica
 * declarada en `perfil.json`: RDA por sexo y edad → ajuste vegano → ajuste por
 * peso y entrenamiento → suplementos → overrides manuales, que pisan todo.
 */

export type ObjetivoOrigen = 'rda' | 'override';

export interface ObjetivoNutriente {
  nutriente_id: string;
  nombre: string;
  valor: number;
  unidad: string;
  origen: ObjetivoOrigen;
  /** No había ventana exacta de sexo/edad: se usó la más cercana. */
  aproximada?: true;
  cubierto_por_suplemento: boolean;
  aporte_suplemento_diario: number;
  motivo_override?: string;
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

    let origen: ObjetivoOrigen = 'rda';
    let motivo_override: string | undefined;
    const override = perfil.overrides.find((o) => o.nutriente_id === nutriente.id);
    if (override) {
      valor = override.objetivo;
      origen = 'override';
      motivo_override = override.motivo;
    }

    const aporte_suplemento_diario = aporteDiarioDe(perfil.suplementos, nutriente.id);
    objetivos.set(nutriente.id, {
      nutriente_id: nutriente.id,
      nombre: nutriente.nombre,
      valor,
      unidad: amountUnitOf(nutriente.clave_ingrediente),
      origen,
      ...(rda.aproximada && origen === 'rda' ? { aproximada: true as const } : {}),
      cubierto_por_suplemento: aporte_suplemento_diario >= valor && aporte_suplemento_diario > 0,
      aporte_suplemento_diario,
      ...(motivo_override !== undefined ? { motivo_override } : {}),
    });
  }
  return objetivos;
}
