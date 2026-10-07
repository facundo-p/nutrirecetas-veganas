import { describe, expect, test } from 'vitest';
import { APORTE_NULO_IDS, CLAVES_CRITICAS, SIN_MATCH_USDA, USDA_MATCHES, VALORES_USDA } from './curated-tables';
import { loadRawData } from './load';
import { aplicarUsda, transformIngredient } from './transform';

/**
 * La carga de FoodData Central (#169). La decisión vive en T17 y los números
 * en el archivo generado; estos tests atan uno con otro y con el dataset.
 */
const raw = loadRawData();
const crudos = new Map(raw.ingredientes.map((r) => [r.id, r]));

describe('T17: carga USDA', () => {
  test('cada valor trae su fuente, y es la de su match', () => {
    for (const [id, porClave] of Object.entries(VALORES_USDA)) {
      const match = USDA_MATCHES[id];
      expect(match, id).toBeDefined();
      for (const [clave, valor] of Object.entries(porClave)) {
        expect(valor.nutriente_fdc, `${id}.${clave}`).toMatch(/^\d{3}$/);
        const desdeExtra = match!.extra?.claves.includes(clave as (typeof CLAVES_CRITICAS)[number]) ?? false;
        expect(valor.fdc_id, `${id}.${clave}`).toBe(desdeExtra ? match!.extra!.fdc_id : match!.fdc_id);
      }
    }
  });

  test('los ids existen y ninguno está en las dos tablas', () => {
    for (const id of [...Object.keys(USDA_MATCHES), ...Object.keys(SIN_MATCH_USDA)]) expect(crudos.has(id), id).toBe(true);
    expect(Object.keys(USDA_MATCHES).filter((id) => id in SIN_MATCH_USDA)).toEqual([]);
  });

  test('todo ingrediente con un crítico sin dato tiene una decisión', () => {
    const sinDecidir = raw.ingredientes
      .filter((r) => !APORTE_NULO_IDS.includes(r.id))
      .filter((r) => CLAVES_CRITICAS.some((c) => r.nutrientes?.[c] == null))
      .map((r) => r.id)
      .filter((id) => !(id in USDA_MATCHES) && !(id in SIN_MATCH_USDA));
    expect(sinDecidir).toEqual([]);
  });

  test('ningún valor cae sobre una clave que el dataset ya trae', () => {
    for (const [id, porClave] of Object.entries(VALORES_USDA)) {
      for (const clave of Object.keys(porClave)) expect(crudos.get(id)!.nutrientes?.[clave], `${id}.${clave}`).toBeUndefined();
    }
  });

  test('pisar un dato del dataset rompe el build', () => {
    const lentejas = transformIngredient(crudos.get('lentejas')!);
    expect(() => aplicarUsda(lentejas, { zinc_mg: { valor: 1, fdc_id: 1, nutriente_fdc: '309' } })).toThrow(/va a T16/);
  });

  test('el ALA sin diferenciar siempre lleva su nota', () => {
    for (const porClave of Object.values(VALORES_USDA)) {
      if (porClave.ala_g?.nutriente_fdc === '619') expect(porClave.ala_g.nota).toMatch(/sin diferenciar/);
    }
  });

  test('el yodo solo viene de Foundation', () => {
    for (const [id, porClave] of Object.entries(VALORES_USDA)) {
      if (porClave.yodo_ug === undefined) continue;
      const m = USDA_MATCHES[id]!;
      const entrada = m.extra?.claves.includes('yodo_ug') ? m.extra : m;
      expect(entrada.data_type, id).toBe('Foundation');
    }
  });
});
