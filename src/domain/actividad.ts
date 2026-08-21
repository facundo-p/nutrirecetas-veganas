/**
 * La escalera de proteína y de dónde sale cada número.
 *
 * El dataset describe población general vegana ("1.0-1.2 g/kg en >60 años o
 * entrenamiento de fuerza", confianza 6) y ese techo no alcanza para alguien
 * que entrena en serio: la literatura deportiva es más específica y más fuerte,
 * así que manda ella en los dos niveles de entrenamiento.
 *
 * Los factores se aplican sobre la base vegana de 1 g/kg (RDA 0.8 × 1.25), por
 * lo que cada factor es también el objetivo en g/kg. `profile.test.ts` fija ese
 * resultado para que un cambio en el factor vegano no corra estos números sin
 * que nadie se entere.
 */

export const NIVELES_ENTRENAMIENTO = ['sedentario', 'activo', 'fuerza', 'intenso'] as const;
export type NivelEntrenamiento = (typeof NIVELES_ENTRENAMIENTO)[number];

export interface NivelDeEntrenamiento {
  factor: number;
  etiqueta: string;
  ayuda: string;
  /** De dónde sale el factor: sin fuente no se agrega un nivel. */
  base: string;
  confianza: number;
}

export const ENTRENAMIENTO: Record<NivelEntrenamiento, NivelDeEntrenamiento> = {
  sedentario: {
    factor: 1,
    etiqueta: 'Sedentario',
    ayuda: 'trabajo de escritorio, poco movimiento',
    base: 'Dataset: "Práctico: ~1.0 g/kg (digestibilidad vegetal algo menor)" — AND Position Vegetarian Diets 2016',
    confianza: 6,
  },
  activo: {
    factor: 1.1,
    etiqueta: 'Activo',
    ayuda: 'caminás bastante o entrenás liviano',
    base: 'Dataset: rango práctico 1.0-1.2 g/kg — AND Position Vegetarian Diets 2016',
    confianza: 6,
  },
  fuerza: {
    factor: 1.6,
    etiqueta: 'Entrenás fuerza',
    ayuda: 'pesas dos o tres veces por semana',
    base: 'ISSN Position Stand: 1.4-2.0 g/kg para quien entrena; los metaanálisis ubican el punto de rendimientos decrecientes cerca de 1.6',
    confianza: 8,
  },
  intenso: {
    factor: 2,
    etiqueta: 'Entrenamiento intenso',
    ayuda: 'pesas cuatro veces por semana o más, o buscás hipertrofia',
    base: 'ISSN Position Stand: extremo alto del rango 1.4-2.0 para entrenados de fuerza, y una dieta vegana suma 10-20 % por digestibilidad (DIAAS más bajo)',
    confianza: 8,
  },
};

/**
 * El dataset dice ">60 años" y acá se cuenta desde los 60 cumplidos: redondear
 * para el lado de pedir más proteína es el error barato de los dos. No está en
 * el selector porque no es una elección — la edad ya está en el perfil.
 */
export const PISO_POR_EDAD = {
  desde_anios: 60,
  factor: 1.2,
  base: 'Dataset: "1.0-1.2 en >60 años o entrenamiento de fuerza" — AND Position Vegetarian Diets 2016',
  confianza: 6,
} as const;

/**
 * Gana el más alto: la edad levanta un piso, no reemplaza al entrenamiento.
 * Alguien de 61 que entrena intenso necesita lo que pide el entrenamiento.
 */
export function factorDeProteina(nivel: NivelEntrenamiento, edad: number): number {
  const porEdad = edad >= PISO_POR_EDAD.desde_anios ? PISO_POR_EDAD.factor : 1;
  return Math.max(ENTRENAMIENTO[nivel].factor, porEdad);
}
