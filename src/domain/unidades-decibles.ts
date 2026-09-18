import { cabezaDeUnidad } from './rounding';

/**
 * Cómo se dice una unidad dentro de la prosa de un paso. `unidad_display` es
 * texto libre —296 valores entre las líneas que entran en algún paso— y la
 * unidad real es la cabeza: `taza_cocidos_calientes` mide en tazas, y lo que
 * sigue describe. La descripción ya la dice el paso.
 *
 * Sin entrada acá una cantidad no se puede escribir, y el build rechaza el
 * token: más vale un paso que no dice la cantidad que uno que la dice mal. Eso
 * deja afuera a las piezas descriptivas (`mediana`, `grande`, `jugo`), donde la
 * unidad es el adjetivo y el sustantivo que habría que pluralizar está en la
 * prosa. Para esas, la cantidad la dice la lista de ingredientes.
 */
export interface UnidadDecible {
  genero: 'm' | 'f';
  singular: string;
  plural: string;
  /** Invariables que se leen siempre en plural: «los 400 g», nunca «el 1 g». */
  siemprePlural?: true;
}

const UNIDAD_EN_PALABRAS: Record<string, UnidadDecible> = {
  g: { genero: 'm', singular: 'g', plural: 'g', siemprePlural: true },
  ml: { genero: 'm', singular: 'ml', plural: 'ml', siemprePlural: true },
  taza: { genero: 'f', singular: 'taza', plural: 'tazas' },
  cda: { genero: 'f', singular: 'cucharada', plural: 'cucharadas' },
  cdta: { genero: 'f', singular: 'cucharadita', plural: 'cucharaditas' },
  diente: { genero: 'm', singular: 'diente', plural: 'dientes' },
  hoja: { genero: 'f', singular: 'hoja', plural: 'hojas' },
  rama: { genero: 'f', singular: 'rama', plural: 'ramas' },
  rebanada: { genero: 'f', singular: 'rebanada', plural: 'rebanadas' },
  pizca: { genero: 'f', singular: 'pizca', plural: 'pizcas' },
  chorrito: { genero: 'm', singular: 'chorrito', plural: 'chorritos' },
  chorro: { genero: 'm', singular: 'chorro', plural: 'chorros' },
  gota: { genero: 'f', singular: 'gota', plural: 'gotas' },
  puñado: { genero: 'm', singular: 'puñado', plural: 'puñados' },
  lata: { genero: 'f', singular: 'lata', plural: 'latas' },
  paquete: { genero: 'm', singular: 'paquete', plural: 'paquetes' },
  atado: { genero: 'm', singular: 'atado', plural: 'atados' },
  vaso: { genero: 'm', singular: 'vaso', plural: 'vasos' },
  bloque: { genero: 'm', singular: 'bloque', plural: 'bloques' },
  cubito: { genero: 'm', singular: 'cubito', plural: 'cubitos' },
  planta: { genero: 'f', singular: 'planta', plural: 'plantas' },
  tira: { genero: 'f', singular: 'tira', plural: 'tiras' },
};

/** El dataset escribe la misma unidad de varias formas; todas miden igual. */
const ALIAS: Record<string, string> = {
  gr: 'g',
  gramo: 'g',
  gramos: 'g',
  cc: 'ml',
  cdas: 'cda',
  cucharada: 'cda',
  cucharadas: 'cda',
  cdtas: 'cdta',
  cucharadita: 'cdta',
  cucharaditas: 'cdta',
  tazas: 'taza',
  dientes: 'diente',
  hojas: 'hoja',
  ramas: 'rama',
  rebanadas: 'rebanada',
  pizcas: 'pizca',
  chorritos: 'chorrito',
  gotas: 'gota',
  punado: 'puñado',
  punados: 'puñado',
  puñados: 'puñado',
  latas: 'lata',
  vasos: 'vaso',
  tiras: 'tira',
  cubitos: 'cubito',
};

export function unidadDecible(unidadDisplay: string): UnidadDecible | null {
  const cabeza = cabezaDeUnidad(unidadDisplay);
  return UNIDAD_EN_PALABRAS[ALIAS[cabeza] ?? cabeza] ?? null;
}
