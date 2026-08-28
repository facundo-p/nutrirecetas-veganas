import { describe, expect, test } from 'vitest';
import type { Recipe, Seed } from '../../src/seed/schema';
import { diffAgainstPrevious, validateIntegrity } from './validate';

function recipeStub(id: string, extra: Partial<Recipe> = {}): Recipe {
  return {
    id,
    nombre: id,
    tipo: 'salada',
    es_preparado: false,
    porciones_num: 2,
    porciones_display: '2 porciones',
    estado: 'probada',
    ic: 8,
    set_origen: 'P',
    usa_preparados: [],
    dificultad: 'fácil',
    tiempo_prep_min: 5,
    tiempo_coccion_min: 5,
    lineas: [
      {
        ref: { tipo: 'ingrediente', id: 'garbanzos' },
        cantidad: 100,
        unidad_display: 'g',
        g_aprox: 100,
        sustitutos: [],
      },
    ],
    pasos: ['Listo.'],
    secretos_chef: [],
    reglas: [],
    utensilios: [],
    ...extra,
  };
}

function seedStub(recetas: Recipe[]): Omit<Seed, 'content_hash'> {
  return {
    seed_schema_version: '1.0.0',
    dataset_version: 'test',
    ingredientes: [
      {
        id: 'garbanzos',
        nombre: 'Garbanzos',
        sinonimos: [],
        categoria: 'legumbre',
        nutrientes: {},
        ic: 8,
        fuentes: [],
      },
    ],
    nutrientes: [
      {
        id: 'hierro',
        nombre: 'Hierro',
        descripcion: 'Transporta el oxígeno en la sangre.',
        grupo: 'critico',
        unidad: 'mg',
        clave_ingrediente: 'hierro_mg',
        rda: [{ edad_min: 19, edad_max: 50, valor: 8 }],
        ul: null,
        ventana: 'dia',
        ic: 9,
      },
    ],
    reglas: [
      {
        id: 'R1',
        tipo: 'dato',
        predicados: [{ tipo: 'sin_grasa_agregada' }],
        condicion_original: {},
        mensaje: 'x',
        ic: 5,
      },
    ],
    recetas,
    equivalencias: {
      volumen_ml: {},
      peso_por_volumen: [],
      peso_por_unidad: [],
      conversion_seco_cocido: [],
      envases_locales_ar: [],
      horno_celsius: [],
    },
    estacionalidad: [],
    conservacion: [],
    glosario: [],
    utensilios: { equipos: [], reglas_utensilio: [] },
  };
}

describe('validateIntegrity', () => {
  test('acepta una semilla coherente', () => {
    expect(() => validateIntegrity(seedStub([recipeStub('a')]))).not.toThrow();
  });

  test('rechaza línea que refiere ingrediente inexistente', () => {
    const rota = recipeStub('a');
    rota.lineas[0]!.ref = { tipo: 'ingrediente', id: 'unicornio' };
    expect(() => validateIntegrity(seedStub([rota]))).toThrow(/ingrediente inexistente/);
  });

  test('rechaza línea que refiere una receta que no es preparado', () => {
    const normal = recipeStub('b');
    const consumidora = recipeStub('a');
    consumidora.lineas.push({
      ref: { tipo: 'receta', id: 'b' },
      cantidad: 100,
      unidad_display: 'g',
      g_aprox: 100,
      sustitutos: [],
    });
    expect(() => validateIntegrity(seedStub([consumidora, normal]))).toThrow(/no es preparado/);
  });

  test('detecta ciclos de preparados', () => {
    const a = recipeStub('a', { es_preparado: true, rendimiento_g: 100 });
    const b = recipeStub('b', { es_preparado: true, rendimiento_g: 100 });
    a.lineas.push({ ref: { tipo: 'receta', id: 'b' }, cantidad: 1, unidad_display: 'g', g_aprox: 50, sustitutos: [] });
    b.lineas.push({ ref: { tipo: 'receta', id: 'a' }, cantidad: 1, unidad_display: 'g', g_aprox: 50, sustitutos: [] });
    expect(() => validateIntegrity(seedStub([a, b]))).toThrow(/ciclo de preparados/);
  });
});

describe('diffAgainstPrevious (ids inmutables)', () => {
  test('un id de receta que desaparece rompe el build', () => {
    const previous = { ...seedStub([recipeStub('a'), recipeStub('b')]), content_hash: 'x'.repeat(64) } as Seed;
    const next = seedStub([recipeStub('a')]);
    expect(() => diffAgainstPrevious(next, previous)).toThrow(/desapareció/);
  });

  test('agregar recetas nuevas está permitido', () => {
    const previous = { ...seedStub([recipeStub('a')]), content_hash: 'x'.repeat(64) } as Seed;
    const next = seedStub([recipeStub('a'), recipeStub('b')]);
    expect(() => diffAgainstPrevious(next, previous)).not.toThrow();
  });
});
