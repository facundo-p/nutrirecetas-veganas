import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { LAMINAS } from '../../seed/laminas';

/**
 * Una lámina se dibuja con tres piezas que viven en tres lugares: el id en
 * `seed/laminas.ts`, la máscara en `assets/laminas/` y la regla que las une en
 * `componentes.css`. Si falta una, el span queda vacío sin que nada falle.
 */
const SRC = fileURLToPath(new URL('../../', import.meta.url));
const MASCARAS = join(SRC, 'assets', 'laminas');
const css = readFileSync(join(SRC, 'styles', 'componentes.css'), 'utf8');

describe('las láminas', () => {
  test.each(LAMINAS)('%s tiene su máscara', (id) => {
    expect(existsSync(join(MASCARAS, `${id}.webp`))).toBe(true);
  });

  test.each(LAMINAS)('%s tiene su regla y la regla apunta a su máscara', (id) => {
    const regla = new RegExp(`\\[data-lamina='${id}'\\]\\s*\\{[^}]*url\\([^)]*/${id}\\.webp`);
    expect(css).toMatch(regla);
  });

  test('no hay máscaras sueltas: toda máscara tiene su id', () => {
    const sueltas = readdirSync(MASCARAS)
      .filter((a) => a.endsWith('.webp'))
      .map((a) => a.replace(/\.webp$/, ''))
      .filter((id) => !(LAMINAS as readonly string[]).includes(id));
    expect(sueltas).toEqual([]);
  });
});
