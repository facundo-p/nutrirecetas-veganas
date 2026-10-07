import { describe, expect, test } from 'vitest';
import { cuandoFue } from './cuando';

const hoy = new Date(2026, 7, 18, 9, 0);
const local = (mes: number, dia: number, hora = 20, anio = 2026) => new Date(anio, mes, dia, hora).toISOString();

describe('cuándo fue una cocción', () => {
  test('cuenta días de calendario, no de 24 horas', () => {
    expect(cuandoFue(local(7, 18, 7), hoy)).toBe('hoy');
    expect(cuandoFue(local(7, 17, 23), hoy)).toBe('ayer');
    expect(cuandoFue(local(7, 15), hoy)).toBe('hace 3 días');
    expect(cuandoFue(local(7, 12), hoy)).toBe('hace 6 días');
  });

  test('pasada la semana, la fecha corta; el año solo si es otro', () => {
    expect(cuandoFue(local(7, 11), hoy)).toBe('11 de agosto');
    expect(cuandoFue(local(11, 24, 20, 2025), hoy)).toBe('24 de diciembre de 2025');
  });
});
