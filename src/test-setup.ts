import { afterEach, beforeAll } from 'vitest';

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

/**
 * El segundo que `waitFor` da por defecto no alcanza en el runner de CI, que es
 * bastante más lento que la máquina de Facu. La causa es siempre la misma:
 * montar una pantalla que calcula la nutrición de las 84 recetas ocupa el hilo,
 * y el `liveQuery` de Dexie que la prueba está esperando llega después.
 *
 * Se configura acá y no test por test porque el que falla es el que corre en el
 * peor momento, no uno en particular: fueron dos distintos en dos corridas. Los
 * que fallan de verdad siguen fallando, solo que tardan más en decirlo.
 */
beforeAll(async () => {
  if (typeof document === 'undefined') return;
  const { configure } = await import('@testing-library/react');
  configure({ asyncUtilTimeout: 5000 });
});
