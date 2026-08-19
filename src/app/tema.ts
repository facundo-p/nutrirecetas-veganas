/**
 * Temas visuales intercambiables (04 §3). El activo por defecto es la D; la C
 * se aplica marcando el `<html>` con `data-tema="c"`, y temas.css hace el resto.
 *
 * Se elige con `?tema=c` o `?tema=d` y queda guardado, así se puede navegar sin
 * repetir el parámetro. El script inline de index.html aplica el guardado antes
 * de pintar, para que no haya un salto de color al cargar.
 */

export const TEMAS = ['c', 'd'] as const;
export type Tema = (typeof TEMAS)[number];
export const TEMA_DEFAULT: Tema = 'd';
const CLAVE = 'tema';

function esTema(valor: string | null): valor is Tema {
  return valor !== null && (TEMAS as readonly string[]).includes(valor);
}

/** Lee el tema pedido por URL, si no el guardado, si no el default. */
export function temaActivo(): Tema {
  const pedido = new URLSearchParams(location.search).get(CLAVE);
  if (esTema(pedido)) return pedido;
  const guardado = localStorage.getItem(CLAVE);
  return esTema(guardado) ? guardado : TEMA_DEFAULT;
}

/** Aplica el tema al documento y guarda la elección cuando vino por URL. */
export function aplicarTema(): Tema {
  const tema = temaActivo();
  const pedido = new URLSearchParams(location.search).get(CLAVE);
  if (esTema(pedido)) localStorage.setItem(CLAVE, pedido);
  if (tema === TEMA_DEFAULT) delete document.documentElement.dataset.tema;
  else document.documentElement.dataset.tema = tema;
  return tema;
}
