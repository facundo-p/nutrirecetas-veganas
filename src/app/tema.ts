/**
 * Temas visuales intercambiables (04 §3). Cada tema es un archivo en
 * `src/styles/temas/`: su paleta cruda y el contrato de roles que la app
 * consume. Acá solo vive la elección, no el color.
 *
 * Agregar un tema son tres pasos, y el test `src/styles/contrato-de-temas.test.ts`
 * verifica los tres: crear `temas/tema-X.css` con el contrato completo,
 * importarlo en `styles/index.css`, y sumar la letra a `TEMAS` de acá y al
 * array del script inline de `index.html`.
 *
 * El `<html>` arranca con `data-tema` puesto en el default y el script inline
 * lo pisa con el guardado antes de pintar, para que no haya salto de color.
 */

export const TEMAS = ['c', 'd'] as const;
export type Tema = (typeof TEMAS)[number];
export const TEMA_DEFAULT: Tema = 'd';

/** El nombre con el que cada tema se presenta en Ajustes. */
export const NOMBRE_DE_TEMA: Record<Tema, string> = {
  c: 'Carta de estación',
  d: 'El color dice de qué se trata',
};

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

/**
 * Pone el tema en el documento. El CSS hace el resto: cambiar el atributo
 * cambia qué bloque de `temas/` gana la cascada, sin re-render de React.
 */
function pintar(tema: Tema): void {
  document.documentElement.dataset.tema = tema;

  // La barra del navegador sigue al papel del tema. Se lee el valor computado
  // en vez de duplicar el hex: el archivo del tema es la única fuente de verdad.
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const papel = getComputedStyle(document.documentElement).getPropertyValue('--papel').trim();
  if (meta && papel) meta.content = papel;
}

/** Aplica el tema al arrancar y guarda la elección cuando vino por URL. */
export function aplicarTema(): Tema {
  const tema = temaActivo();
  const pedido = new URLSearchParams(location.search).get(CLAVE);
  if (esTema(pedido)) localStorage.setItem(CLAVE, pedido);
  pintar(tema);
  return tema;
}

/** Cambia el tema desde la app y lo deja guardado. */
export function setTema(tema: Tema): void {
  localStorage.setItem(CLAVE, tema);
  pintar(tema);
}
