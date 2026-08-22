import { describe, expect, test } from 'vitest';
import { issuesQueCierra, planDePublicacion, type ItemDeTablero } from './tablero';

/**
 * Las dos decisiones del script, sin red: qué issues declara cerrar un tramo de
 * historia, y qué items del tablero hay que mover en consecuencia.
 */

describe('issues que cierra un tramo de historia', () => {
  test('los levanta de los mensajes, en sus formas y sin importar mayúsculas', () => {
    const log = ['fix: algo\n\nCloses #12', 'feat: otra cosa\n\nFIXES #7', 'chore: mas\n\ncierra #3'].join('\n');
    expect([...issuesQueCierra(log)].sort((a, b) => a - b)).toStrictEqual([3, 7, 12]);
  });

  test('una mención suelta a un issue no es un cierre', () => {
    const log = 'docs: retomar lo que se charló en #99 y en el PR #98';
    expect([...issuesQueCierra(log)]).toStrictEqual([]);
  });

  test('el mismo issue nombrado dos veces cuenta una', () => {
    expect([...issuesQueCierra('a\n\nCloses #5\n---\nb\n\ncloses #5')]).toStrictEqual([5]);
  });
});

const item = (numero: number, estado: string | null, tipo: ItemDeTablero['tipo'] = 'Issue'): ItemDeTablero => ({
  id: `id-${numero}`,
  numero,
  tipo,
  estado,
  titulo: `titulo ${numero}`,
});

describe('plan de publicación', () => {
  test('mueve los issues cuyo cierre ya está en main', () => {
    const plan = planDePublicacion([item(46, 'Hecho'), item(47, 'Hecho')], new Set([46, 47]), 'Publicado');
    expect(plan.mover.map((i) => i.numero)).toStrictEqual([46, 47]);
  });

  test('no toca el que sigue solo en staging', () => {
    const plan = planDePublicacion([item(46, 'Hecho'), item(51, 'Hecho')], new Set([46]), 'Publicado');
    expect(plan.mover.map((i) => i.numero)).toStrictEqual([46]);
    expect(plan.sinTocar.map((i) => i.numero)).toStrictEqual([51]);
  });

  test('el que ya está en la columna no se mueve de nuevo', () => {
    const plan = planDePublicacion([item(46, 'Publicado')], new Set([46]), 'Publicado');
    expect(plan.mover).toStrictEqual([]);
    expect(plan.yaEstan.map((i) => i.numero)).toStrictEqual([46]);
  });

  test('un PR no se mueve aunque su número coincida con un issue publicado', () => {
    const plan = planDePublicacion([item(46, 'Hecho', 'PullRequest')], new Set([46]), 'Publicado');
    expect(plan.mover).toStrictEqual([]);
    expect(plan.sinTocar.map((i) => i.numero)).toStrictEqual([46]);
  });

  test('un issue sin columna asignada también entra si corresponde', () => {
    const plan = planDePublicacion([item(46, null)], new Set([46]), 'Publicado');
    expect(plan.mover.map((i) => i.numero)).toStrictEqual([46]);
  });
});
