// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DURACION_ESCALADO_MS, factorEnElCamino, suavizar, useFactorAnimado } from './useFactorAnimado';

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

describe('el viaje, cuadro a cuadro', () => {
  const conMovimiento = (reducido: boolean) => vi.stubGlobal('matchMedia', () => ({ matches: reducido }));
  const avanzar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
  const montar = () => renderHook(({ factor }) => useFactorAnimado(factor), { initialProps: { factor: 1 } });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    conMovimiento(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('pasa por el medio, llega al destino y deja de teñir', () => {
    const { result, rerender } = montar();
    rerender({ factor: 2 });
    expect(result.current.animando).toBe(true);
    avanzar(DURACION_ESCALADO_MS / 2);
    expect(result.current.mostrado).toBeGreaterThan(1);
    expect(result.current.mostrado).toBeLessThan(2);
    avanzar(DURACION_ESCALADO_MS);
    expect(result.current).toEqual({ mostrado: 2, animando: false });
  });

  test('un cambio en pleno viaje sale desde donde iba, no desde el principio', () => {
    const { result, rerender } = montar();
    rerender({ factor: 2 });
    avanzar(DURACION_ESCALADO_MS / 2);
    const aMitad = result.current.mostrado;
    rerender({ factor: 1 });
    avanzar(50);
    expect(result.current.mostrado).toBeLessThan(aMitad);
    expect(result.current.mostrado).toBeGreaterThan(1);
    avanzar(DURACION_ESCALADO_MS);
    expect(result.current).toEqual({ mostrado: 1, animando: false });
  });

  test('con movimiento reducido salta directo al valor final', () => {
    conMovimiento(true);
    const { result, rerender } = montar();
    rerender({ factor: 3 });
    expect(result.current).toEqual({ mostrado: 3, animando: false });
  });
});
