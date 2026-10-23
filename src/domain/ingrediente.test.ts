import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../seed';
import type { Ingredient, Line, Recipe } from '../seed/schema';
import { ingredienteSinDato, sustitutosDeIngrediente } from './ingrediente';

const idx = getSeedIndex();
const ingrediente = (id: string) => idx.ingredientById.get(id)!;

const linea = (id: string, sustitutos: Line['sustitutos']): Line =>
  ({
    ref: { tipo: 'ingrediente', id },
    cantidad: 1,
    unidad_display: 'g',
    g_aprox: 1,
    sustitutos,
    paso: null,
  }) as Line;
const receta = (nombre: string, lineas: Line[]): Recipe => ({ id: nombre, nombre, lineas }) as unknown as Recipe;

describe('sin dato', () => {
  test('un ingrediente con nutrientes tiene dato', () => {
    expect(ingredienteSinDato(ingrediente('lentejas'))).toBe(false);
  });

  test('el agua no aporta, pero eso es un dato', () => {
    expect(ingrediente('agua').aporte_nulo).toBe(true);
    expect(ingredienteSinDato(ingrediente('agua'))).toBe(false);
  });

  test('sin nutrientes y sin aporte nulo, no hay dato', () => {
    const vacio = {
      ...ingrediente('lentejas'),
      nutrientes: {},
      aporte_nulo: undefined,
    } as Ingredient;
    expect(ingredienteSinDato(vacio)).toBe(true);
  });
});

describe('sustitutos de un ingrediente', () => {
  test('junta los ids de todas las recetas, sin repetir', () => {
    const recetas = [
      receta('A', [linea('lentejas', [{ tipo: 'id', valor: 'garbanzos' }])]),
      receta('B', [
        linea('lentejas', [
          { tipo: 'id', valor: 'garbanzos' },
          { tipo: 'id', valor: 'porotos_negros' },
        ]),
      ]),
    ];
    expect(sustitutosDeIngrediente(recetas, 'lentejas').resolubles).toEqual(['garbanzos', 'porotos_negros']);
  });

  test('el texto libre viaja con las recetas donde aparece', () => {
    const recetas = [
      receta('A', [linea('lentejas', [{ tipo: 'texto', valor: 'arvejas' }])]),
      receta('B', [linea('lentejas', [{ tipo: 'texto', valor: 'arvejas' }])]),
    ];
    expect(sustitutosDeIngrediente(recetas, 'lentejas').textuales).toEqual([{ valor: 'arvejas', recetas: ['A', 'B'] }]);
  });

  test('no toma los sustitutos de otros ingredientes ni el propio id', () => {
    const recetas = [
      receta('A', [
        linea('garbanzos', [{ tipo: 'id', valor: 'porotos_negros' }]),
        linea('lentejas', [{ tipo: 'id', valor: 'lentejas' }]),
      ]),
    ];
    expect(sustitutosDeIngrediente(recetas, 'lentejas')).toEqual({
      resolubles: [],
      textuales: [],
    });
  });

  test('en la semilla, todo id resoluble existe como ingrediente', () => {
    for (const ing of idx.seed.ingredientes) {
      for (const id of sustitutosDeIngrediente(idx.seed.recetas, ing.id).resolubles) {
        expect(idx.ingredientById.has(id), `${ing.id} → ${id}`).toBe(true);
      }
    }
  });
});
