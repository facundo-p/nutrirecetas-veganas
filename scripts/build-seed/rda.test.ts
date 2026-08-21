import { describe, expect, test } from 'vitest';
import { canonizeRda } from './rda';

describe('canonización de RDA (T4, auditoría §2.6)', () => {
  test('claves heterogéneas de hierro → entradas canónicas', () => {
    const entries = canonizeRda('hierro', { hombre: 8, mujer_19_50: 18, mujer_posmenopausia: 8 });
    expect(entries).toEqual([
      { sexo: 'masculino', edad_min: 19, edad_max: 50, valor: 8 },
      { sexo: 'femenino', edad_min: 19, edad_max: 50, valor: 18 },
      { sexo: 'femenino', edad_min: 51, edad_max: 999, valor: 8 },
    ]);
  });

  test('proteína en g/kg lleva por_kg', () => {
    expect(canonizeRda('proteina', { adultos_g_kg: 0.9 })).toEqual([
      { edad_min: 19, edad_max: 999, por_kg: true, valor: 0.9 },
    ]);
  });

  test('clave desconocida = falla el build', () => {
    expect(() => canonizeRda('vitx', { marcianos_19_50: 1 })).toThrow(/clave desconocida/);
  });
});
