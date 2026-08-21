import { describe, expect, test } from 'vitest';
import { ENTRENAMIENTO, NIVELES_ENTRENAMIENTO, PISO_POR_EDAD, factorDeProteina } from './actividad';

describe('factor de proteína por nivel de entrenamiento', () => {
  test('cada nivel aporta su factor sobre la base vegana de 1 g/kg', () => {
    expect(factorDeProteina('sedentario', 36)).toBeCloseTo(1, 2);
    expect(factorDeProteina('activo', 36)).toBeCloseTo(1.1, 2);
    expect(factorDeProteina('fuerza', 36)).toBeCloseTo(1.6, 2);
    expect(factorDeProteina('intenso', 36)).toBeCloseTo(2, 2);
  });
});

describe('piso por edad', () => {
  test('a partir de los 60 el sedentario arranca en 1.2, no en 1', () => {
    expect(factorDeProteina('sedentario', 60)).toBeCloseTo(1.2, 2);
    expect(factorDeProteina('sedentario', 59)).toBeCloseTo(1, 2);
  });

  test('entrenar más que el piso gana: 61 años en intenso sigue siendo 2', () => {
    expect(factorDeProteina('intenso', 61)).toBeCloseTo(2, 2);
  });
});

describe('ningún factor entra sin fuente', () => {
  test.each([...NIVELES_ENTRENAMIENTO])('%s declara base y confianza', (nivel) => {
    const { base, confianza } = ENTRENAMIENTO[nivel];
    expect(base.length).toBeGreaterThan(20);
    expect(confianza).toBeGreaterThanOrEqual(1);
    expect(confianza).toBeLessThanOrEqual(10);
  });

  test('el piso por edad también', () => {
    expect(PISO_POR_EDAD.base.length).toBeGreaterThan(20);
    expect(PISO_POR_EDAD.confianza).toBeGreaterThanOrEqual(1);
  });

  test('la escalera no baja: cada nivel pide al menos lo del anterior', () => {
    const factores = NIVELES_ENTRENAMIENTO.map((n) => ENTRENAMIENTO[n].factor);
    expect(factores).toStrictEqual([...factores].sort((a, b) => a - b));
  });
});
