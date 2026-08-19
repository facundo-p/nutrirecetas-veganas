import { describe, expect, test } from 'vitest';
import { ingredientSchema, lineSchema, predicateSchema, recipeSchema } from './schema';

const lineaBase = {
  ref: { tipo: 'ingrediente', id: 'garbanzos' },
  cantidad: 400,
  unidad_display: 'g_cocidos',
  g_aprox: 400,
  sustitutos: [],
};

describe('ingredientSchema', () => {
  const base = {
    id: 'garbanzos',
    nombre: 'Garbanzos',
    sinonimos: ['chickpeas'],
    categoria: 'legumbre',
    kcal: { intervalo: { min: 164, max: 164 } },
    nutrientes: { prot_g: { intervalo: { min: 8.9, max: 8.9 } } },
    ic: 8,
    fuentes: ['usda'],
  };

  test('acepta un ingrediente válido', () => {
    expect(ingredientSchema.parse(base).id).toBe('garbanzos');
  });

  test('rechaza clave de nutriente desconocida', () => {
    const roto = { ...base, nutrientes: { chakra_mg: { intervalo: { min: 1, max: 1 } } } };
    expect(() => ingredientSchema.parse(roto)).toThrow();
  });

  test('rechaza intervalo con min > max', () => {
    const roto = { ...base, kcal: { intervalo: { min: 200, max: 100 } } };
    expect(() => ingredientSchema.parse(roto)).toThrow();
  });
});

describe('recipeSchema', () => {
  const base = {
    id: 'r01',
    nombre: 'Sopa',
    tipo: 'salada',
    es_preparado: false,
    porciones_num: 4,
    porciones_display: '4',
    estado: 'probada',
    ic: 8,
    set_origen: 1,
    usa_preparados: [],
    dificultad: 'fácil',
    tiempo_prep_min: 10,
    tiempo_coccion_min: 20,
    lineas: [lineaBase],
    pasos: ['Hervir.'],
    secretos_chef: [],
    reglas: [{ id: 'R1' }],
    utensilios: [{ tipo: 'equipo', id: 'olla_fondo_grueso' }],
  };

  test('acepta una receta válida con línea que referencia otra receta', () => {
    const conRef = {
      ...base,
      lineas: [...base.lineas, { ...lineaBase, ref: { tipo: 'receta', id: 'p04' } }],
    };
    expect(recipeSchema.parse(conRef).lineas).toHaveLength(2);
  });

  test('rechaza campo desconocido (forma desconocida = falla, nunca runtime)', () => {
    expect(() => recipeSchema.parse({ ...base, perfil_nutricional_porcion_aprox: {} })).toThrow();
  });

  test('rechaza dificultad fuera del enum de 5', () => {
    expect(() => recipeSchema.parse({ ...base, dificultad: 'imposible' })).toThrow();
  });
});

describe('predicateSchema', () => {
  test('acepta los predicados del AST', () => {
    expect(
      predicateSchema.parse({ tipo: 'receta_rica_en', nutrientes: ['hierro'], umbral_mg_porcion: 3 }).tipo,
    ).toBe('receta_rica_en');
    expect(predicateSchema.parse({ tipo: 'sin_grasa_agregada' }).tipo).toBe('sin_grasa_agregada');
  });

  test('rechaza un predicado desconocido', () => {
    expect(() => predicateSchema.parse({ tipo: 'alineacion_planetaria' })).toThrow();
  });
});

describe('lineSchema', () => {
  test('rechaza g_aprox negativo', () => {
    expect(() => lineSchema.parse({ ...lineaBase, g_aprox: -1 })).toThrow();
  });
});
