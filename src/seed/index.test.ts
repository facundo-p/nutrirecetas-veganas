import { describe, expect, test } from 'vitest';
import { getSeedIndex } from './index';

describe('índice de la semilla (contra seed.json real)', () => {
  const idx = getSeedIndex();

  test('la semilla real valida contra el esquema Zod', () => {
    expect(idx.seed.recetas).toHaveLength(84);
    expect(idx.seed.ingredientes).toHaveLength(158);
  });

  test('variantes: d01 tiene 3 (los brownies)', () => {
    expect(idx.variantsOf('d01').map((r) => r.id).sort()).toEqual(['p32', 'p33', 'p34']);
  });

  test('consumidores: p08 lo consumen p12 y p20', () => {
    expect(idx.consumersOf('p08').map((r) => r.id).sort()).toEqual(['p12', 'p20']);
  });

  test('búsqueda de recetas por ingrediente directo', () => {
    const conGarbanzos = idx.recipesWithIngredient('garbanzos');
    expect(conGarbanzos.length).toBeGreaterThan(0);
  });

  test('conservación aplicable a garbanzos incluye los grupos de legumbres', () => {
    const garbanzos = idx.ingredientById.get('garbanzos')!;
    const items = idx.storageFor(garbanzos).map((i) => i.item);
    expect(items).toContain('legumbres_secas');
    expect(items).toContain('legumbres_cocidas');
  });
});
