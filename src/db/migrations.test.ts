import { describe, expect, test } from 'vitest';
import { migrarPerfilV1 } from './migrations';

/**
 * El 1.2 viejo era ambiguo — "fuerza o +60" — y la edad es lo único que lo
 * desambigua. Cualquier otra lectura le cambia el objetivo a alguien sin avisar.
 */

const HOY = new Date('2026-08-21T12:00:00');

const v1 = (multiplicador_actividad: number, fecha_nacimiento = '1990-01-01') => ({
  id: 1,
  sexo_para_requerimientos: 'masculino',
  fecha_nacimiento,
  peso_kg: 75,
  multiplicador_actividad,
  suplementos: [],
  overrides: [],
  nutrientes_destacados: [],
  creado_en: HOY.toISOString(),
  actualizado_en: HOY.toISOString(),
});

describe('perfil v1 → v2', () => {
  test('1.0 y 1.1 tienen un solo significado posible', () => {
    expect(migrarPerfilV1(v1(1), HOY).nivel_entrenamiento).toBe('sedentario');
    expect(migrarPerfilV1(v1(1.1), HOY).nivel_entrenamiento).toBe('activo');
  });

  test('1.2 con menos de 60 solo pudo haber querido decir fuerza', () => {
    expect(migrarPerfilV1(v1(1.2, '1990-01-01'), HOY).nivel_entrenamiento).toBe('fuerza');
  });

  test('1.2 con 60 o más era el bono por edad, que ahora sale solo', () => {
    expect(migrarPerfilV1(v1(1.2, '1960-01-01'), HOY).nivel_entrenamiento).toBe('sedentario');
  });

  test('el campo viejo no sobrevive: el schema es estricto', () => {
    expect(migrarPerfilV1(v1(1.2), HOY)).not.toHaveProperty('multiplicador_actividad');
  });

  test('lo demás del perfil queda intacto', () => {
    const migrado = migrarPerfilV1({ ...v1(1.1), peso_kg: 81, nombre: 'Facu' }, HOY);
    expect(migrado.peso_kg).toBe(81);
    expect(migrado.nombre).toBe('Facu');
  });

  test('un perfil que ya está en v2 pasa de largo', () => {
    const yaMigrado = { ...v1(1), multiplicador_actividad: undefined, nivel_entrenamiento: 'intenso' };
    delete yaMigrado.multiplicador_actividad;
    expect(migrarPerfilV1(yaMigrado, HOY).nivel_entrenamiento).toBe('intenso');
  });
});
