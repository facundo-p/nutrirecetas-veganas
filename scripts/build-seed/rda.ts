import type { RdaEntry } from '../../src/seed/schema';

/**
 * T4 — Canonización de claves RDA heterogéneas del dataset a
 * `{sexo?, edad_min, edad_max, valor, por_kg?}` (auditoría §2.6).
 * Clave desconocida = falla el build.
 */

type KeyMapping = Omit<RdaEntry, 'valor'>;

const RDA_KEY_MAP: Record<string, KeyMapping> = {
  hombre: { sexo: 'masculino', edad_min: 19, edad_max: 50 },
  mujer: { sexo: 'femenino', edad_min: 19, edad_max: 50 },
  mujer_19_50: { sexo: 'femenino', edad_min: 19, edad_max: 50 },
  mujer_posmenopausia: { sexo: 'femenino', edad_min: 51, edad_max: 999 },
  mujer_mayor_50: { sexo: 'femenino', edad_min: 51, edad_max: 999 },
  adultos: { edad_min: 19, edad_max: 50 },
  adultos_19_50: { edad_min: 19, edad_max: 50 },
  mayores_70: { edad_min: 70, edad_max: 999 },
  hombre_ala_g: { sexo: 'masculino', edad_min: 19, edad_max: 999 },
  mujer_ala_g: { sexo: 'femenino', edad_min: 19, edad_max: 999 },
  adultos_g_kg: { edad_min: 19, edad_max: 999, por_kg: true },
};

export function canonizeRda(nutrientId: string, rda: Record<string, number>): RdaEntry[] {
  const entries = Object.entries(rda).map(([key, valor]) => {
    const mapping = RDA_KEY_MAP[key];
    if (!mapping) {
      throw new Error(`RDA de "${nutrientId}": clave desconocida "${key}" — agregar a RDA_KEY_MAP o corregir el dato`);
    }
    return { ...mapping, valor };
  });
  if (entries.length === 0) throw new Error(`RDA de "${nutrientId}" vacía`);
  return entries;
}
