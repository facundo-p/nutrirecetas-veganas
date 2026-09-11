import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../seed';
import type { Ingredient } from '../seed/schema';
import {
  aporteDeReceta,
  CASILLEROS,
  enOrdenCanonico,
  esNutrienteDeBarra,
  franjasDeAporte,
  fuerteDeAporte,
  GRUPO_DEL_PANEL,
  nombreDeNutriente,
  ORDEN_BARRA,
  porcentajesDeAporte,
  puntoDeIngrediente,
  puntoDeLinea,
  type Porcentajes,
} from './aporte';
import { computeNutrition, perPortion } from './nutrition';
import { objetivosDeReferencia } from './objetivos';

const idx = getSeedIndex();
const nutrientes = idx.seed.nutrientes;
const objetivos = objetivosDeReferencia(null, nutrientes, new Date('2026-09-11T12:00:00'));
const nutricionDe = (recetaId: string) => computeNutrition(recetaId, idx);

const con = (valores: Partial<Porcentajes>): Porcentajes =>
  ({ ...Object.fromEntries(ORDEN_BARRA.map((id) => [id, null])), ...valores }) as Porcentajes;
const nombres = (p: Porcentajes) => franjasDeAporte(p).map((f) => f.nutriente);
const puntual = (valor: number) => ({ intervalo: { min: valor, max: valor } });

describe('qué nutrientes tienen color', () => {
  test('los once existen en el catálogo de la semilla', () => {
    const ids = new Set(nutrientes.map((n) => n.id));
    expect(ORDEN_BARRA.filter((id) => !ids.has(id))).toEqual([]);
  });

  test('ni B12 ni vitamina D, que no da la comida, ni yodo, que no tiene dato', () => {
    for (const afuera of ['b12', 'vitd', 'yodo']) expect(ORDEN_BARRA).not.toContain(afuera);
  });

  test('en orden canónico van primero los once, y el resto como lo trae la semilla', () => {
    const ordenados = enOrdenCanonico(nutrientes).map((n) => n.id);
    expect(ordenados.slice(0, ORDEN_BARRA.length)).toEqual([...ORDEN_BARRA]);
    const resto = nutrientes.map((n) => n.id).filter((id) => !esNutrienteDeBarra(id));
    expect(ordenados.slice(ORDEN_BARRA.length)).toEqual(resto);
  });
});

describe('los casilleros de la barra', () => {
  test('siempre son seis, haya los datos que haya', () => {
    expect(franjasDeAporte(con({}))).toHaveLength(CASILLEROS);
    const todos = con(Object.fromEntries(ORDEN_BARRA.map((id, i) => [id, i + 1])));
    expect(franjasDeAporte(todos)).toHaveLength(CASILLEROS);
  });

  test('elige los seis que más cubre', () => {
    const p = con({ hierro: 1, calcio: 2, magnesio: 30, zinc: 3, selenio: 25, vita: 90, vitc: 4, folato: 60, proteina: 20, fibra: 15, omega3: 5 });
    expect(new Set(nombres(p))).toEqual(new Set(['magnesio', 'selenio', 'vita', 'folato', 'proteina', 'fibra']));
  });

  test('los dibuja en orden canónico, no por tamaño', () => {
    expect(nombres(con({ proteina: 90, fibra: 50, hierro: 10 })).slice(0, 3)).toEqual(['hierro', 'proteina', 'fibra']);
  });

  test('un nutriente sin dato no recibe casillero: los que sobran van sin nombre', () => {
    expect(nombres(con({ proteina: 30, hierro: 10 }))).toEqual(['hierro', 'proteina', null, null, null, null]);
  });

  test('el relleno se corta en 100, el porcentaje no', () => {
    expect(franjasDeAporte(con({ vitc: 250 }))[0]).toEqual({ nutriente: 'vitc', porcentaje: 250, relleno: 100 });
  });

  test('en un empate gana el que va antes en el canon', () => {
    const empate = con({ hierro: 10, calcio: 10, magnesio: 10, zinc: 10, selenio: 10, vita: 10, omega3: 10 });
    expect(nombres(empate)).toEqual(['hierro', 'calcio', 'magnesio', 'zinc', 'selenio', 'vita']);
  });
});

describe('el nutriente más fuerte', () => {
  test('es el de mayor porcentaje', () => {
    expect(fuerteDeAporte(con({ hierro: 10, vita: 87, proteina: 40 }))).toEqual({ nutriente: 'vita', porcentaje: 87 });
  });

  test('sin ningún dato no hay más fuerte: no se inventa un puesto', () => {
    expect(fuerteDeAporte(con({}))).toBeNull();
  });
});

describe('los porcentajes, desde la semilla', () => {
  test('una receta real lee cada nutriente de su clave: la proteína sale de prot_g', () => {
    const porcion = perPortion(computeNutrition('r01', idx))!;
    expect(porcentajesDeAporte(porcion.por_nutriente, objetivos, nutrientes).proteina).toBeGreaterThan(0);
  });

  test('una banda que arranca en cero no se pinta: el casillero no tiene dónde mostrarla', () => {
    const resultado = (min: number) => ({ intervalo: { min, max: 10 }, cobertura_pct: 100, ic: 8 });
    expect(porcentajesDeAporte({ prot_g: resultado(0) }, objetivos, nutrientes).proteina).toBeNull();
    expect(porcentajesDeAporte({ prot_g: resultado(5) }, objetivos, nutrientes).proteina).toBeGreaterThan(0);
  });

  test('una receta con porciones se mide por porción; un preparado, cada 100 g', () => {
    const r01 = aporteDeReceta(nutricionDe('r01'), objetivos, nutrientes);
    expect(r01.base).toBe('porcion');
    expect(r01.porcentajes).toEqual(porcentajesDeAporte(perPortion(nutricionDe('r01'))!.por_nutriente, objetivos, nutrientes));
    expect(aporteDeReceta(nutricionDe('p04'), objetivos, nutrientes).base).toBe('100g');
  });
});

describe('el punto de un ingrediente', () => {
  const lentejas = idx.ingredientById.get('lentejas')!;
  const conNutrientes = (n: Ingredient['nutrientes']): Ingredient => ({ ...lentejas, nutrientes: n });

  test('es el nutriente que más cubren sus 100 g, medido contra la dosis y no en gramos', () => {
    // 20 g de proteína son el 29 % de 70 g; 1 mg de hierro, el 3 % de 32,4 mg
    expect(puntoDeIngrediente(conNutrientes({ prot_g: puntual(20), hierro_mg: puntual(1) }), objetivos, nutrientes)).toBe(
      'proteina',
    );
  });

  test('sin ninguno de los once es neutro', () => {
    expect(puntoDeIngrediente(conNutrientes({ sodio_mg: puntual(400) }), objetivos, nutrientes)).toBe('ninguno');
  });

  test('la levadura nutricional es aporte condicional aunque traiga otros nutrientes', () => {
    const levadura = idx.ingredientById.get('levadura_nutricional')!;
    expect(Object.keys(levadura.nutrientes).length).toBeGreaterThan(1);
    expect(puntoDeIngrediente(levadura, objetivos, nutrientes)).toBe('condicional');
  });
});

describe('el punto de una línea de receta', () => {
  const pastafrola = idx.recipeById.get('p31')!;

  test('una línea de ingrediente lleva el punto de su ingrediente', () => {
    const linea = pastafrola.lineas.find((l) => l.ref.tipo === 'ingrediente')!;
    const ingrediente = idx.ingredientById.get(linea.ref.id)!;
    expect(puntoDeLinea(idx, linea, objetivos, nutricionDe)).toBe(puntoDeIngrediente(ingrediente, objetivos, nutrientes));
  });

  test('un preparado con levadura adentro va hueco: la B12 no se pierde por venir dentro de otra receta', () => {
    const conLevadura = pastafrola.lineas.find((l) => l.ref.tipo === 'receta' && nutricionDe(l.ref.id).alerta_b12);
    expect(conLevadura).toBeDefined();
    expect(puntoDeLinea(idx, conLevadura!, objetivos, nutricionDe)).toBe('condicional');
  });

  test('un preparado sin levadura se mira por sus 100 g', () => {
    const sinLevadura = idx.seed.recetas
      .flatMap((r) => r.lineas)
      .find((l) => l.ref.tipo === 'receta' && !nutricionDe(l.ref.id).alerta_b12)!;
    expect(puntoDeLinea(idx, sinLevadura, objetivos, nutricionDe)).not.toBe('condicional');
  });
});

describe('el panel de la ficha', () => {
  test('todo nutriente del catálogo tiene grupo: uno sin grupo desaparecería del panel', () => {
    expect(nutrientes.filter((n) => GRUPO_DEL_PANEL[n.id] === undefined).map((n) => n.id)).toEqual([]);
  });

  test('se nombran con el nombre corto si tienen color, y con el del catálogo si no', () => {
    expect(nombreDeNutriente(idx.nutrientById.get('vita')!)).toBe('vitamina A');
    expect(nombreDeNutriente(idx.nutrientById.get('b12')!)).toBe('vitamina B12');
  });
});
