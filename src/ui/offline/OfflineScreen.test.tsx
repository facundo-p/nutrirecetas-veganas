// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getSeedIndex } from '../../seed';
import { OfflineScreen } from './OfflineScreen';

afterEach(() => vi.restoreAllMocks());

describe('pantalla sin conexión', () => {
  test('cuenta lo guardado desde la semilla, no con un número escrito', () => {
    const { seed } = getSeedIndex();
    const { container } = render(<OfflineScreen />);
    const cifras = [...container.querySelectorAll('.sin-conexion-cuenta .cifra')].map((c) => c.textContent);
    expect(cifras).toEqual([String(seed.recetas.length), String(seed.ingredientes.length)]);
  });

  test('inventaria qué funciona y qué espera a la conexión, con la «i»', () => {
    render(<OfflineScreen />);
    expect(screen.getByRole('heading', { name: 'Funciona' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Espera a la conexión' })).toBeDefined();
    expect(screen.getByRole('button', { name: /lo que explica esta pantalla/ })).toBeDefined();
  });

  test('sin conexión lo dice; con conexión, que anda igual', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { unmount } = render(<OfflineScreen />);
    expect(screen.getByText('Sin conexión')).toBeDefined();
    unmount();

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    render(<OfflineScreen />);
    expect(screen.getByText('Funciona sin conexión')).toBeDefined();
  });
});
