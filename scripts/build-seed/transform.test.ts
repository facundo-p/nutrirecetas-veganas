import { beforeAll, describe, expect, test } from 'vitest';
import { loadRawData, type RawData } from './load';
import {
  toNutrientValue,
  transformIngredient,
  transformNutrient,
  transformRecipes,
  transformSeasonality,
  transformStorage,
} from './transform';
import type { Recipe } from '../../src/seed/schema';

let raw: RawData;
let recipes: Recipe[];
let byId: Map<string, Recipe>;

beforeAll(() => {
  raw = loadRawData();
  const equipmentIds = new Set(
    (raw.utensilios.equipos as Array<{ id: string }>).map((e) => e.id),
  );
  recipes = transformRecipes(raw, equipmentIds);
  byId = new Map(recipes.map((r) => [r.id, r]));
});

describe('carga', () => {
  test('inventario completo: 84 recetas, 158 ingredientes, 20 nutrientes, 15 reglas', () => {
    expect(raw.sets[1]).toHaveLength(10);
    expect(raw.sets[2]).toHaveLength(20);
    expect(raw.sets[3]).toHaveLength(9);
    expect(raw.sets.P).toHaveLength(45);
    expect(raw.ingredientes).toHaveLength(158);
    expect(raw.nutrientes).toHaveLength(20);
    expect(raw.reglas).toHaveLength(15);
  });
});

describe('unificación de recetas', () => {
  test('produce las 84 recetas', () => {
    expect(recipes).toHaveLength(84);
  });

  test('set 1 queda tipado como salada con estado/ic unificados', () => {
    const r01 = byId.get('r01')!;
    expect(r01.tipo).toBe('salada');
    expect(r01.set_origen).toBe(1);
    expect(r01.estado).toBe('por-probar');
    expect(r01.ic).toBeGreaterThanOrEqual(1);
  });

  test('set P conserva estado probada con ic 8', () => {
    const p19 = byId.get('p19')!;
    expect(p19.estado).toBe('probada');
    expect(p19.ic).toBe(8);
  });
});

describe('porciones (T1)', () => {
  test('numéricas pasan directo', () => {
    expect(byId.get('r01')!.porciones_num).toBeGreaterThan(0);
  });

  test('string con número explícito usa la tabla curada y conserva el display original', () => {
    const p31 = byId.get('p31')!;
    expect(p31.porciones_num).toBe(10);
    expect(p31.porciones_display).toBe('molde 22-25 cm (10 porciones)');
  });

  test('"libre" queda sin porciones (nutrición por 100 g)', () => {
    expect(byId.get('p11')!.porciones_num).toBeNull();
  });
});

describe('preparados (T2/T3)', () => {
  test('hay 11 preparados efectivos, incluido p08 de facto', () => {
    const preparados = recipes.filter((r) => r.es_preparado);
    expect(preparados.map((r) => r.id).sort()).toEqual(
      ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p16', 'p26', 'p27'],
    );
    for (const p of preparados) expect(p.rendimiento_g).toBeGreaterThan(0);
  });

  test('p08 mantiene tipo salada pero es preparado', () => {
    const p08 = byId.get('p08')!;
    expect(p08.tipo).toBe('salada');
    expect(p08.es_preparado).toBe(true);
    expect(p08.rendimiento_g).toBe(750);
  });

  test('la línea fantasma de p19 (maní como queso) referencia p04', () => {
    const p19 = byId.get('p19')!;
    const refs = p19.lineas.filter((l) => l.ref.tipo === 'receta');
    expect(refs).toHaveLength(1);
    expect(refs[0]!.ref.id).toBe('p04');
    expect(refs[0]!.g_aprox).toBe(250);
  });

  test('p22 gana la línea de masa p07 que el dataset omite', () => {
    const p22 = byId.get('p22')!;
    const masa = p22.lineas.find((l) => l.ref.tipo === 'receta' && l.ref.id === 'p07');
    expect(masa?.g_aprox).toBe(370);
  });

  test('p20 referencia p08 solo en la línea de seitán, no en el resto', () => {
    const p20 = byId.get('p20')!;
    const refs = p20.lineas.filter((l) => l.ref.tipo === 'receta');
    expect(refs.map((l) => l.ref.id)).toEqual(['p08']);
    expect(refs[0]!.g_aprox).toBe(200);
  });
});

describe('sustitutos', () => {
  test('68 resolubles a id y 100 de texto libre (66 del dataset + margarina en p31/p39)', () => {
    const all = recipes.flatMap((r) => r.lineas.flatMap((l) => l.sustitutos));
    expect(all.filter((s) => s.tipo === 'id')).toHaveLength(68);
    expect(all.filter((s) => s.tipo === 'texto')).toHaveLength(100);
  });

  test('las líneas migradas a manteca vegana ofrecen margarina como sustituto', () => {
    for (const id of ['p31', 'p39']) {
      const linea = byId.get(id)!.lineas.find((l) => l.ref.tipo === 'receta' && l.ref.id === 'p03');
      expect(linea?.sustitutos).toContainEqual({ tipo: 'id', valor: 'margarina' });
    }
  });
});

describe('referencias de reglas y utensilios (T5)', () => {
  test('R11_no_aplica_es_nori se separa en id + calificador', () => {
    const receta = recipes.find((r) => r.reglas.some((x) => x.id === 'R11' && x.calificador === 'no_aplica_es_nori'));
    expect(receta).toBeDefined();
  });

  test('U2_si_sarten migra de reglas_disparadas a utensilios', () => {
    const conU2 = recipes.filter((r) =>
      r.utensilios.some((u) => u.tipo === 'regla_utensilio' && u.id === 'U2' && u.calificador === 'si_sarten'),
    );
    expect(conU2.length).toBeGreaterThan(0);
    for (const r of recipes) expect(r.reglas.every((x) => x.id.startsWith('R'))).toBe(true);
  });

  test('equipos conocidos quedan tipados como equipo', () => {
    const conEquipo = recipes.filter((r) => r.utensilios.some((u) => u.tipo === 'equipo' && u.id === 'minipimer'));
    expect(conEquipo.length).toBeGreaterThan(0);
  });
});

describe('valores nutricionales', () => {
  test('número puntual colapsa a intervalo min===max', () => {
    expect(toNutrientValue(164)).toEqual({ intervalo: { min: 164, max: 164 } });
  });

  test('rango conserva nota y descarta tipico', () => {
    const v = toNutrientValue({ min: 4, max: 15, tipico: 10, nota: 'depende del suelo' });
    expect(v).toEqual({ intervalo: { min: 4, max: 15 }, nota: 'depende del suelo' });
  });

  test('la levadura nutricional conserva su B12 con min 0 (invariante de seguridad)', () => {
    const lev = transformIngredient(raw.ingredientes.find((i) => i.id === 'levadura_nutricional')!);
    expect(lev.nutrientes.b12_ug?.intervalo.min).toBe(0);
    expect(lev.nutrientes.b12_ug?.nota).toContain('fortificada');
  });
});

describe('nutrientes del catálogo', () => {
  test('los 20 se transforman con clave de ingrediente y ventana', () => {
    const all = raw.nutrientes.map(transformNutrient);
    expect(all).toHaveLength(20);
    const hierro = all.find((n) => n.id === 'hierro')!;
    expect(hierro.clave_ingrediente).toBe('hierro_mg');
    expect(hierro.ventana).toBe('dia');
    expect(hierro.ajuste_vegano?.factor).toBe(1.8);
    const magnesio = all.find((n) => n.id === 'magnesio')!;
    expect(magnesio.ul_nota).toBeDefined(); // el UL de Mg aplica solo a suplementos
  });
});

describe('estacionalidad y conservación', () => {
  test('uva se descarta con aviso (sin ficha de ingrediente)', () => {
    const ids = new Set(raw.ingredientes.map((i) => i.id));
    const { items, descartados } = transformSeasonality(raw.estacionalidad, ids);
    expect(descartados).toEqual(['uva']);
    expect(items).toHaveLength(40);
  });

  test('los 41 items de conservación resuelven a ingredientes, categorías o estado', () => {
    const ids = new Set(raw.ingredientes.map((i) => i.id));
    const items = transformStorage(raw.conservacion, ids);
    expect(items).toHaveLength(41);
    expect(items.find((i) => i.item === 'legumbres_secas')?.aplica.tipo).toBe('categoria');
    expect(items.find((i) => i.item === 'palta_madura')?.aplica).toEqual({ tipo: 'ingrediente', ids: ['palta'] });
    expect(items.find((i) => i.item === 'avena')?.aplica).toEqual({ tipo: 'ingrediente', ids: ['avena'] });
    expect(items.find((i) => i.item === 'caldo_casero')?.aplica.tipo).toBe('estado');
  });
});
