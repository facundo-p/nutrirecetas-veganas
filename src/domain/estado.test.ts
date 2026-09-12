import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../seed';
import { estadoDeReceta, estadoTrasCocinar } from './estado';

const idx = getSeedIndex();
const receta = (id: string) => idx.recipeById.get(id)!;

describe('estadoDeReceta', () => {
  test('sin elección propia manda la semilla', () => {
    // p19 es del recetario personal: Facu la cocinó, la semilla dice `probada`
    expect(estadoDeReceta(receta('p19'), null)).toBe('probada');
    expect(estadoDeReceta(receta('r01'), null)).toBe('sin-probar');
    expect(estadoDeReceta(receta('r01'), undefined)).toBe('sin-probar');
    expect(estadoDeReceta(receta('r01'), {})).toBe('sin-probar');
  });

  test('la semilla parte las 84 en 45 probadas y 39 sin probar', () => {
    const probadas = idx.seed.recetas.filter((r) => estadoDeReceta(r, null) === 'probada');
    expect(probadas).toHaveLength(45);
    expect(probadas.every((r) => r.set_origen === 'P')).toBe(true);
  });

  test('la elección propia gana, incluso para volver atrás', () => {
    expect(estadoDeReceta(receta('r01'), { estado: 'favorita' })).toBe('favorita');
    // el caso que obliga a que `sin-probar` sea un valor guardable y no la ausencia:
    // desmarcar una de las 45 que la semilla da por probada
    expect(estadoDeReceta(receta('p19'), { estado: 'sin-probar' })).toBe('sin-probar');
  });
});

describe('estadoTrasCocinar', () => {
  test('cocinar vuelve probada lo que no era una elección', () => {
    expect(estadoTrasCocinar('sin-probar')).toBe('probada');
    expect(estadoTrasCocinar('pendiente')).toBe('probada');
    expect(estadoTrasCocinar('probada')).toBe('probada');
  });

  test('no degrada una favorita: marcarla fue una opinión, cocinarla no la contradice', () => {
    expect(estadoTrasCocinar('favorita')).toBe('favorita');
  });
});
