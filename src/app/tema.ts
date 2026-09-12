/**
 * El tema visual. Cada tema es un archivo en `src/styles/temas/`: su paleta
 * cruda y el contrato de roles que la app consume. Acá solo vive la elección,
 * no el color.
 *
 * Hay dos, papel (claro) y musgo (oscuro), y lo que se guarda es una
 * preferencia: `auto` sigue al modo del teléfono y las otras dos lo fijan.
 * Sumar un tema es crear `temas/tema-X.css` con el contrato completo,
 * importarlo en `styles/index.css` y sumarlo a `TEMAS` y al script inline de
 * `index.html`. El test `src/styles/contrato-de-temas.test.ts` verifica los
 * tres pasos.
 *
 * El `<html>` arranca con `data-tema` en el default y el script inline lo pisa
 * antes de pintar, con la misma resolución que `resolverTema`.
 */

export const TEMAS = ['papel', 'musgo'] as const;
export type Tema = (typeof TEMAS)[number];
/** La red de seguridad: el que se ve si el script de arranque no llega a correr. */
export const TEMA_DEFAULT: Tema = 'papel';
const TEMA_OSCURO: Tema = 'musgo';

export const PREFERENCIAS = ['auto', ...TEMAS] as const;
export type Preferencia = (typeof PREFERENCIAS)[number];

const CLAVE = 'tema';
const CONSULTA_OSCURO = '(prefers-color-scheme: dark)';

function esPreferencia(valor: string | null): valor is Preferencia {
  return valor !== null && (PREFERENCIAS as readonly string[]).includes(valor);
}

/**
 * La URL manda sobre lo guardado: los renders la usan. Cualquier otro valor —un
 * `g`, `e` o `f` de temas que ya no existen— cuenta como automático.
 */
export function leerPreferencia(enUrl: string | null, guardada: string | null): Preferencia {
  if (esPreferencia(enUrl)) return enUrl;
  return esPreferencia(guardada) ? guardada : 'auto';
}

export function resolverTema(preferencia: Preferencia, sistemaOscuro: boolean): Tema {
  if (preferencia !== 'auto') return preferencia;
  return sistemaOscuro ? TEMA_OSCURO : TEMA_DEFAULT;
}

export function preferenciaGuardada(): Preferencia {
  return leerPreferencia(null, localStorage.getItem(CLAVE));
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

/** Guarda la elección de Ajustes y la aplica en el momento. */
export function elegirPreferencia(preferencia: Preferencia): void {
  localStorage.setItem(CLAVE, preferencia);
  pintar(resolverTema(preferencia, matchMedia(CONSULTA_OSCURO).matches));
}

/**
 * Aplica el tema al arrancar y guarda la preferencia cuando vino por URL. En
 * automático, si el teléfono cambia de modo con la app abierta, la app lo sigue.
 *
 * Un valor viejo guardado no se borra: `localStorage` es común a la app y a
 * staging, y borrarlo desde acá le cambiaría el tema a la versión publicada.
 */
export function aplicarTema(): void {
  const enUrl = new URLSearchParams(location.search).get(CLAVE);
  if (esPreferencia(enUrl)) localStorage.setItem(CLAVE, enUrl);

  const sistema = matchMedia(CONSULTA_OSCURO);
  pintar(resolverTema(leerPreferencia(enUrl, localStorage.getItem(CLAVE)), sistema.matches));
  sistema.addEventListener('change', (cambio) => {
    if (preferenciaGuardada() === 'auto') pintar(resolverTema('auto', cambio.matches));
  });
}
