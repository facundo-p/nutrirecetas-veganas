import { beforeAll, describe, expect, test } from 'vitest';
import { INGREDIENT_CATEGORIES, INGREDIENT_NUTRIENT_KEYS } from '../../src/seed/schema';
import { loadRawData, type RawData } from './load';
import { compileRule, type RuleContext } from './rules-ast';

let raw: RawData;
let ctx: RuleContext;

beforeAll(() => {
  raw = loadRawData();
  ctx = {
    ingredientIds: new Set(raw.ingredientes.map((i) => i.id)),
    categories: new Set(INGREDIENT_CATEGORIES),
    nutrientIds: new Set(raw.nutrientes.map((n) => n.id)),
    ingredientNutrientKeys: new Set(INGREDIENT_NUTRIENT_KEYS),
  };
});

describe('compilación del AST de reglas (auditoría §2.1)', () => {
  test('las 15 reglas reales compilan sin excepción', () => {
    const rules = raw.reglas.map((r) => compileRule(r, ctx));
    expect(rules).toHaveLength(15);
    for (const r of rules) expect(r.predicados.length).toBeGreaterThan(0);
  });

  test('R1: rica en hierro con umbral + vitamina C mínima', () => {
    const r1 = compileRule(raw.reglas.find((r) => r.id === 'R1')!, ctx);
    expect(r1.predicados).toEqual([
      { tipo: 'receta_rica_en', nutrientes: ['hierro'], umbral_mg_porcion: 3 },
      { tipo: 'contiene_nutriente_min', clave: 'vitc_mg', cantidad: 25 },
    ]);
  });

  test('R4: contiene_categoria expande el concepto cereal_integral a ids reales', () => {
    const r4 = compileRule(raw.reglas.find((r) => r.id === 'R4')!, ctx);
    const cat = r4.predicados.find((p) => p.tipo === 'contiene_categoria');
    expect(cat).toMatchObject({ categorias: ['legumbre'] });
    expect((cat as { ids: string[] }).ids).toContain('avena');
  });

  test('R10: conceptos tomate_cocido/zanahoria_cocida resuelven a ids con calificador', () => {
    const r10 = compileRule(raw.reglas.find((r) => r.id === 'R10')!, ctx);
    const pred = r10.predicados[0];
    expect(pred).toMatchObject({ tipo: 'contiene_ingrediente', calificador: 'cocido' });
  });

  test('R12: castana_para resuelve al id real castanas_para', () => {
    const r12 = compileRule(raw.reglas.find((r) => r.id === 'R12')!, ctx);
    expect(r12.predicados).toEqual([{ tipo: 'ingrediente_cantidad_mayor', id: 'castanas_para', unidades: 2 }]);
  });

  test('predicado desconocido = falla el build, nunca el runtime', () => {
    const fake = { id: 'R99', tipo: 'dato', condicion: { alineacion_planetaria: true }, mensaje: 'x', confianza: 5 };
    expect(() => compileRule(fake, ctx)).toThrow(/sin compilar/);
  });

  test('target inexistente = falla el build', () => {
    const fake = { id: 'R98', tipo: 'dato', condicion: { contiene_ingrediente: 'unicornio' }, mensaje: 'x', confianza: 5 };
    expect(() => compileRule(fake, ctx)).toThrow(/no es id de ingrediente ni concepto/);
  });
});
