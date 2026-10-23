import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

/**
 * index.html queda fuera de TS: si una clase del esqueleto se renombra en el
 * CSS, nadie se entera salvo este test.
 */
const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
const root = /<div id="root">([\s\S]*?)<\/div>\s*<script/.exec(html)?.[1] ?? '';

function cssDe(dir: string): string {
  return readdirSync(dir, { withFileTypes: true })
    .map((e) => (e.isDirectory() ? cssDe(join(dir, e.name)) : e.name.endsWith('.css') ? readFileSync(join(dir, e.name), 'utf8') : ''))
    .join('\n');
}

describe('carga inicial', () => {
  test('dibuja los seis casilleros vacíos y tres filas, sin nav', () => {
    expect(root.match(/class="franja"/g)).toHaveLength(6);
    expect(root.match(/class="esqueleto-fila"/g)).toHaveLength(3);
    expect(root).not.toMatch(/<nav/);
  });

  test('toda clase del esqueleto existe en los estilos', () => {
    const css = cssDe(join(RAIZ, 'src', 'styles'));
    const clases = new Set([...root.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1]!.split(/\s+/)));
    const faltan = [...clases].filter((c) => !new RegExp(`\\.${c}(?![\\w-])`).test(css));
    expect(faltan).toEqual([]);
  });
});
