import { afterEach, describe, expect, test, vi } from 'vitest';

/**
 * En GitHub Pages, main y staging viven bajo el mismo origen — y **IndexedDB es
 * por origen, no por ruta**. Con un nombre de base fijo, probar algo en staging
 * escribiría sobre el historial de cocciones real, y una migración de esquema en
 * staging migraría los datos de producción. Es el riesgo #2 del proyecto
 * disparado a propósito, cada vez que se quiera probar algo.
 *
 * `DB_NAME` se calcula al importar el módulo, así que cada caso resetea el
 * registro de módulos y vuelve a importar con el entorno ya puesto.
 *
 * Esto cubre la lógica. Lo que protege de verdad es la verificación del bundle
 * ya construido en `.github/workflows/pages.yml`: un test pasa aunque el flag
 * nunca llegue al build.
 */

async function nombreConEntorno(entorno: string | undefined): Promise<string> {
  vi.resetModules();
  if (entorno === undefined) vi.stubEnv('VITE_ENTORNO', '');
  else vi.stubEnv('VITE_ENTORNO', entorno);
  const { DB_NAME } = await import('./db');
  return DB_NAME;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('nombre de la base según el entorno', () => {
  test('staging usa una base aparte', async () => {
    expect(await nombreConEntorno('staging')).toBe('nutrirecetas_user_staging');
  });

  test('producción usa la base real', async () => {
    expect(await nombreConEntorno('produccion')).toBe('nutrirecetas_user');
  });

  test('sin entorno declarado (dev y tests) usa la base real', async () => {
    expect(await nombreConEntorno(undefined)).toBe('nutrirecetas_user');
  });

  test('un entorno desconocido no cae en la base de staging', async () => {
    expect(await nombreConEntorno('lo-que-sea')).toBe('nutrirecetas_user');
  });
});
