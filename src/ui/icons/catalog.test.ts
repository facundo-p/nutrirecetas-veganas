import { expect, test } from 'vitest';
import { ICON_CATALOG } from './catalog';
import * as iconos from './icons';

/** Controles que siempre van con su texto o su aria-label: no necesitan explicación. */
const SIN_ENTRADA = ['IconCerrar', 'IconLupa', 'IconFiltros'];

const exportados = Object.entries(iconos).filter(([nombre]) => nombre.startsWith('Icon'));

test('todo ícono del set está en el catálogo del Glosario o declarado sin entrada', () => {
  const catalogados = new Set(ICON_CATALOG.map((entrada) => entrada.Componente));
  const sinExplicar = exportados
    .filter(([nombre, componente]) => !catalogados.has(componente as never) && !SIN_ENTRADA.includes(nombre))
    .map(([nombre]) => nombre);
  expect(sinExplicar).toEqual([]);
});

test('lo declarado sin entrada existe y no está catalogado a la vez', () => {
  const nombres = exportados.map(([nombre]) => nombre);
  for (const nombre of SIN_ENTRADA) expect(nombres).toContain(nombre);
  const catalogados = new Set(ICON_CATALOG.map((entrada) => entrada.Componente));
  const duplicados = exportados.filter(([nombre, c]) => SIN_ENTRADA.includes(nombre) && catalogados.has(c as never));
  expect(duplicados).toEqual([]);
});

test('cada entrada tiene id único y un significado', () => {
  const ids = ICON_CATALOG.map((entrada) => entrada.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const entrada of ICON_CATALOG) expect(entrada.significado.trim()).not.toBe('');
});
