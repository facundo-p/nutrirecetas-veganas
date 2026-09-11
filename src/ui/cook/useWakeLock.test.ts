// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { useWakeLock } from './useWakeLock';

class SentinelFalso extends EventTarget {
  soltado = false;
  async release() {
    this.soltado = true;
    this.dispatchEvent(new Event('release'));
  }
}

function instalarWakeLock(): SentinelFalso[] {
  const pedidos: SentinelFalso[] = [];
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: {
      request: async () => {
        const sentinel = new SentinelFalso();
        pedidos.push(sentinel);
        return sentinel;
      },
    },
  });
  return pedidos;
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock');
});

test('sin soporte no promete nada', () => {
  const { result } = renderHook(() => useWakeLock(true));
  expect(result.current).toBe(false);
});

test('retiene la pantalla y lo dice', async () => {
  instalarWakeLock();
  const { result } = renderHook(() => useWakeLock(true));
  await waitFor(() => expect(result.current).toBe(true));
});

test('si el navegador la suelta en segundo plano, la vuelve a pedir al volver', async () => {
  const pedidos = instalarWakeLock();
  const { result } = renderHook(() => useWakeLock(true));
  await waitFor(() => expect(result.current).toBe(true));

  act(() => {
    pedidos[0]!.dispatchEvent(new Event('release'));
  });
  expect(result.current).toBe(false);

  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await waitFor(() => expect(result.current).toBe(true));
  expect(pedidos).toHaveLength(2);
});

test('al salir la suelta', async () => {
  const pedidos = instalarWakeLock();
  const { result, unmount } = renderHook(() => useWakeLock(true));
  await waitFor(() => expect(result.current).toBe(true));
  unmount();
  expect(pedidos[0]!.soltado).toBe(true);
});
