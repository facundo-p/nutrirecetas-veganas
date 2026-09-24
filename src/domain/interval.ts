import type { Interval } from '../seed/schema';

/**
 * Aritmética de intervalos {min, max} de punta a punta: todo valor interno del
 * motor es un intervalo (los puntuales, colapsados). El punto medio solo miente
 * si escondés la banda — acá no se esconde (arquitectura §5).
 */

export function interval(value: number): Interval {
  return { min: value, max: value };
}

export function add(a: Interval, b: Interval): Interval {
  return { min: a.min + b.min, max: a.max + b.max };
}

export function scale(a: Interval, k: number): Interval {
  return { min: a.min * k, max: a.max * k };
}

export function midpoint(a: Interval): number {
  return (a.min + a.max) / 2;
}

/** Debajo de esto la diferencia entre las puntas es ruido de punto flotante. */
const RANGO_DESPRECIABLE = 1e-9;

/** Si el intervalo es una banda de verdad y no un valor puntual. */
export function tieneBanda(a: Interval): boolean {
  return a.max - a.min > RANGO_DESPRECIABLE;
}

export function sum(xs: Interval[]): Interval {
  return xs.reduce(add, interval(0));
}
