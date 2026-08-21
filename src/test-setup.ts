import { afterEach } from 'vitest';

/**
 * Sin esto, cada `render` apila un DOM nuevo sobre el anterior y las consultas
 * encuentran elementos duplicados de tests previos. Solo aplica a los tests con
 * entorno jsdom; los del dominio corren en node y no tienen document.
 */
afterEach(async () => {
  if (typeof document === 'undefined') return;
  const { cleanup } = await import('@testing-library/react');
  cleanup();
});
