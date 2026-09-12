/**
 * Las láminas: grabados de verduras de dominio público (Vilmorin-Andrieux, *Les
 * Plantes potagères*, 1883, y otras obras de la época), pasados a máscara de
 * tinta por `scripts/laminas.mjs`. Los originales y sus fuentes están en
 * `docs/assets/laminas/`.
 *
 * Vive en `seed/` y no en `ui/` porque la usan las dos puntas: la semilla, que
 * rechaza una receta con una lámina que no existe, y la UI, que la dibuja.
 */
export const LAMINAS = [
  'ajo',
  'arroz',
  'banana',
  'batata',
  'berenjena',
  'calabaza',
  'cebolla',
  'choclo',
  'coco',
  'coliflor',
  'datil',
  'espinaca',
  'frutilla',
  'garbanzo',
  'lechuga',
  'lentejas',
  'limon',
  'mandioca',
  'mani',
  'manzana',
  'membrillo',
  'morron',
  'nabo',
  'papa',
  'perejil',
  'porotos',
  'puerro',
  'repollo',
  'soja',
  'tomate',
  'trigo',
  'zanahoria',
] as const;

export type LaminaId = (typeof LAMINAS)[number];
