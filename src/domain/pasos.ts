/**
 * Las cantidades de un paso no se escriben: se referencian. `{tomate_triturado}`
 * es la línea de tomate de ese paso, y se dibuja con la cantidad que la receta
 * tiene puesta ahora. Un número escrito a mano queda fijo, y al ajustar las
 * porciones el paso pasa a decir algo falso mientras la lista dice lo correcto.
 *
 * El sustantivo queda siempre fuera del token: el paso nombra al ingrediente
 * igual que antes, y solo la cantidad se calcula.
 *
 *   '{tomate_triturado} de tomate triturado'  →  «los 400 g de tomate triturado»
 *   '{~agua} de agua fría'                    →  «900 ml de agua fría»
 *
 * `{~id}` es el mismo token sin artículo, para la prosa que ya trae el suyo o
 * no lleva ninguno («con 900 ml de agua»). `{id#2}` elige la segunda línea de
 * ese ingrediente cuando el paso tiene dos.
 */
const TOKEN = /\{(~?)([a-z0-9_]+)(?:#(\d+))?\}/g;

export interface TokenDePaso {
  /** El token tal cual está escrito, para nombrarlo en el error del build. */
  crudo: string;
  id: string;
  articulo: boolean;
  /** Cuál de las líneas de ese ingrediente, si el paso tiene más de una. */
  ocurrencia: number;
}

/**
 * Una línea como la ve un paso. El `id` es con el que la nombra el token: el de
 * la receta, no el del sustituto, porque el paso se escribió nombrando al
 * original. La cantidad, en cambio, es la que se está mostrando.
 */
export interface LineaDePaso {
  id: string;
  cantidad: number;
  unidad_display: string;
}

export type TrozoDePaso =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'cantidad'; linea: LineaDePaso; articulo: boolean };

function leerToken(match: RegExpMatchArray): TokenDePaso {
  return {
    crudo: match[0],
    articulo: match[1] !== '~',
    id: match[2]!,
    ocurrencia: match[3] === undefined ? 1 : Number(match[3]),
  };
}

export function tokensDePaso(texto: string): TokenDePaso[] {
  return [...texto.matchAll(TOKEN)].map(leerToken);
}

export function lineaDelToken(token: TokenDePaso, enElPaso: readonly LineaDePaso[]): LineaDePaso | null {
  return enElPaso.filter((linea) => linea.id === token.id)[token.ocurrencia - 1] ?? null;
}

export function partirPaso(texto: string, enElPaso: readonly LineaDePaso[]): TrozoDePaso[] {
  const trozos: TrozoDePaso[] = [];
  let desde = 0;
  for (const match of texto.matchAll(TOKEN)) {
    const token = leerToken(match);
    const linea = lineaDelToken(token, enElPaso);
    if (match.index > desde) trozos.push({ tipo: 'texto', texto: texto.slice(desde, match.index) });
    // Un token sin línea no llega a la app: el build lo rechaza. Si igual
    // llegara, se muestra crudo y el test de render lo caza con las llaves.
    trozos.push(
      linea === null
        ? { tipo: 'texto', texto: token.crudo }
        : { tipo: 'cantidad', linea, articulo: token.articulo },
    );
    desde = match.index + match[0].length;
  }
  if (desde < texto.length) trozos.push({ tipo: 'texto', texto: texto.slice(desde) });
  return trozos;
}
