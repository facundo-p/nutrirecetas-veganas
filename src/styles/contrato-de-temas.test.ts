import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

/**
 * El contrato de temas, hecho cumplir por máquina.
 *
 * La regla del sistema es que ninguna regla de la app nombra un color: usa
 * tokens de rol y cada tema decide qué color los cumple. Este test es lo que la
 * sostiene. Sin él la regla se degrada sola: entre la Fase 1 y la 2 se
 * acumularon 141 usos de color crudo en la capa de la app sin que nadie lo
 * notara, porque la regla vivía en un comentario.
 *
 *   capa 1  tokens.css     forma; prohibido un color
 *   capa 2  temas/         única capa con colores literales
 *   capa 3  el resto       solo tokens de rol
 *
 * La frontera se deduce de la forma del nombre, sin listas que mantener a mano:
 * un token `--p-*` es paleta cruda y es privado del archivo de su tema.
 */

const ESTILOS = fileURLToPath(new URL('.', import.meta.url));
const RAIZ = join(ESTILOS, '..', '..');

function archivosCss(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivosCss(join(dir, e.name)) : e.name.endsWith('.css') ? [join(dir, e.name)] : [],
  );
}

/** Los comentarios mencionan tokens y colores en prosa: darían falsos positivos. */
const sinComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** `--x: valor` declara --x. No confunde `var(--x, y)` con una declaración. */
const declara = (css: string) => new Set([...css.matchAll(/(?:^|[;{}\s])(--[\w-]+)\s*:/g)].map((m) => m[1]!));

/** Todo `var(--x)`, incluidos los que están en posición de fallback. */
const usa = (css: string) => new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]!));

/**
 * `var(--x)` sin fallback: el tema DEBE declararlo. `var(--x, y)` es opcional,
 * y es lo que hace que `--titulo-receta-fijo` quede fuera del contrato sin
 * necesidad de una lista de excepciones.
 */
const usaSinFallback = (css: string) =>
  new Set([...css.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)].filter((m) => m[2] === ')').map((m) => m[1]!));

function lineas(css: string, re: RegExp): string[] {
  return css
    .split('\n')
    .map((l, i) => [i + 1, l] as const)
    .filter(([, l]) => re.test(l))
    .map(([n, l]) => `${n}: ${l.trim()}`);
}

/**
 * `tema.ts` se lee como texto y no se importa: el test corre en node y ese
 * módulo toca `document` y `localStorage`. Además, lo que acá se verifica es
 * justamente que tres fuentes de texto digan lo mismo.
 */
const temaTs = readFileSync(join(RAIZ, 'src', 'app', 'tema.ts'), 'utf8');
const TEMAS = [...(/export const TEMAS = \[([^\]]*)\]/.exec(temaTs)?.[1] ?? '').matchAll(/'([a-z0-9-]+)'/g)].map(
  (m) => m[1]!,
);
const TEMA_DEFAULT = /export const TEMA_DEFAULT: Tema = '([a-z0-9-]+)'/.exec(temaTs)?.[1];

const archivos = archivosCss(ESTILOS).map((ruta) => ({
  nombre: relative(ESTILOS, ruta).split(sep).join('/'),
  css: sinComentarios(readFileSync(ruta, 'utf8')),
}));

function archivosTsx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivosTsx(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [],
  );
}

const nombreDeTema = (n: string) => /^temas\/tema-([a-z0-9-]+)\.css$/.exec(n)?.[1];
const deTema = archivos.filter((a) => nombreDeTema(a.nombre));
const temaCompartido = archivos.filter((a) => a.nombre.startsWith('temas/') && !nombreDeTema(a.nombre));
const deLaApp = archivos.filter((a) => !a.nombre.startsWith('temas/') && a.nombre !== 'index.css');

/** El contrato: lo que la app pide sin fallback y ninguna capa salvo los temas provee. */
const consumidores = [...deLaApp, ...temaCompartido];
const declaradoFueraDeTemas = new Set(consumidores.flatMap((a) => [...declara(a.css)]));
const CONTRATO = [...new Set(consumidores.flatMap((a) => [...usaSinFallback(a.css)]))]
  .filter((t) => !declaradoFueraDeTemas.has(t))
  .sort();

const usadoEnAlgunLado = new Set(archivos.flatMap((a) => [...usa(a.css)]));

describe('el contrato de temas', () => {
  test('el contrato tiene la forma esperada (no se vació por un cambio de regex)', () => {
    expect(CONTRATO.length).toBeGreaterThan(30);
    expect(CONTRATO).toContain('--titulo-seccion');
    expect(CONTRATO).toContain('--superficie');
    expect(CONTRATO).toContain('--cat-principal');
    expect(CONTRATO).toContain('--link');
    // el opcional queda afuera: solo se pide con fallback
    expect(CONTRATO).not.toContain('--titulo-receta-fijo');
  });

  test('las familias tipográficas están en el contrato: la letra es del tema, no de la capa de forma', () => {
    // se deducen solas al no estar en tokens.css, pero el assert lo deja escrito:
    // si alguien las devuelve a la capa común, esto falla y dice por qué
    expect(CONTRATO).toContain('--font-display');
    expect(CONTRATO).toContain('--font-data');
  });

  const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/;

  test.each(deLaApp.map((a) => [a.nombre, a.css] as const))('%s no escribe un color literal', (_n, css) => {
    expect(lineas(css, COLOR_LITERAL)).toEqual([]);
  });

  test.each(deLaApp.map((a) => [a.nombre, a.css] as const))(
    '%s no toca la paleta cruda de ningún tema (--p-*)',
    (_n, css) => {
      expect(lineas(css, /var\(\s*--p-/)).toEqual([]);
    },
  );

  test.each(deLaApp.map((a) => [a.nombre, a.css] as const))('%s no menciona ningún tema', (_n, css) => {
    expect(lineas(css, /\[data-tema/)).toEqual([]);
  });

  test.each(deTema.map((a) => [a.nombre, a.css] as const))('%s declara el contrato completo', (_n, css) => {
    const declarados = declara(css);
    expect(CONTRATO.filter((t) => !declarados.has(t))).toEqual([]);
  });

  test.each(deTema.map((a) => [a.nombre, a.css] as const))('%s no declara tokens muertos', (_n, css) => {
    // un --p-* solo se usa dentro de su propio archivo; un rol, en cualquier lado
    const usados = new Set([...usadoEnAlgunLado, ...usa(css)]);
    expect([...declara(css)].filter((t) => !usados.has(t))).toEqual([]);
  });

  test.each(deTema.map((a) => [a.nombre, a.css, nombreDeTema(a.nombre)!] as const))(
    '%s solo declara sobre su propio :root',
    (_n, css, tema) => {
      const selectores = [...css.matchAll(/(?:^|})\s*([^{}]+?)\s*\{/g)].map((m) => m[1]!.replace(/\s+/g, ' ').trim());
      // el tema default lista además `:root` como red de seguridad
      const permitido = new RegExp(`^(:root, )?:root\\[data-tema='${tema}'\\]$`);
      expect(selectores.filter((s) => !permitido.test(s))).toEqual([]);
    },
  );

  test('solo el tema default se declara también sobre :root', () => {
    const conRedDeSeguridad = deTema.filter((a) => /(^|})\s*:root\s*,/.test(a.css)).map((a) => nombreDeTema(a.nombre));
    expect(conRedDeSeguridad).toEqual([TEMA_DEFAULT]);
  });

  test('la lista de temas está sincronizada en los tres lugares', () => {
    expect(TEMAS.length).toBeGreaterThan(1);
    expect(TEMA_DEFAULT).toBeDefined();
    const esperados = [...TEMAS].sort();
    expect(deTema.map((a) => nombreDeTema(a.nombre)!).sort()).toEqual(esperados);

    const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
    const enScript = /var TEMAS = \[([^\]]*)\]/.exec(html)?.[1] ?? '';
    expect([...enScript.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]!).sort()).toEqual(esperados);
    expect(/<html[^>]*\sdata-tema="([a-z0-9-]+)"/.exec(html)?.[1]).toBe(TEMA_DEFAULT);
  });

  test('ningún .tsx escribe estilo: eso vive en los .css', () => {
    const yo = relative(RAIZ, fileURLToPath(import.meta.url)).split(sep).join('/');
    const sospechosos = archivosTsx(join(RAIZ, 'src'))
      .map((ruta) => [relative(RAIZ, ruta).split(sep).join('/'), readFileSync(ruta, 'utf8')] as const)
      .filter(([nombre]) => nombre !== yo) // este archivo nombra los patrones que busca
      .flatMap(([nombre, src]) =>
        lineas(src, /style=\{|<style|dangerouslySetInnerHTML|\.style\.|setProperty\(/).map((l) => `${nombre}:${l}`),
      );
    expect(sospechosos).toEqual([]);
  });

  test('index.css es el único punto de entrada y no se olvida de ningún archivo', () => {
    const index = archivos.find((a) => a.nombre === 'index.css')!;
    const importados = [...index.css.matchAll(/@import\s+['"]\.\/([^'"]+)['"]/g)].map((m) => m[1]!).sort();
    const existentes = archivos
      .filter((a) => a.nombre !== 'index.css')
      .map((a) => a.nombre)
      .sort();
    expect(importados).toEqual(existentes);

    const main = readFileSync(join(RAIZ, 'src', 'main.tsx'), 'utf8');
    expect([...main.matchAll(/import '\.\/styles\/([^']+)'/g)].map((m) => m[1]!)).toEqual(['index.css']);
  });
});
