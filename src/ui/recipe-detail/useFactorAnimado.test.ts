import { describe, expect, test } from 'vitest';
import { DURACION_ESCALADO_MS, factorEnElCamino, suavizar } from './useFactorAnimado';

describe('el escalado viaja, no salta', () => {
  test('arranca en el factor de partida y llega exacto al de destino', () => {
    expect(factorEnElCamino(1, 2, 0)).toBe(1);
    expect(factorEnElCamino(1, 2, DURACION_ESCALADO_MS)).toBe(2);
    expect(factorEnElCamino(1, 2, DURACION_ESCALADO_MS * 3)).toBe(2);
  });

  test('frena al llegar: en la mitad del tiempo ya recorrió más de la mitad del camino', () => {
    expect(suavizar(0.5)).toBeCloseTo(0.875, 3);
    expect(factorEnElCamino(1, 2, DURACION_ESCALADO_MS / 2)).toBeGreaterThan(1.5);
  });

  test('bajando, igual', () => {
    expect(factorEnElCamino(2, 1, DURACION_ESCALADO_MS / 2)).toBeLessThan(1.5);
    expect(factorEnElCamino(2, 1, DURACION_ESCALADO_MS)).toBe(1);
  });
});
