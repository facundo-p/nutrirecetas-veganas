import { describe, expect, test } from 'vitest';
import { loadRawData } from './load';
import { CURATED_SOURCES } from './curated-tables';

/**
 * El catálogo que traduce `fuente.ref` vive repartido en tres formas del
 * dataset. Estos tests fijan que las tres entren y que ninguna receta quede
 * mostrando su código crudo (#149).
 */
const raw = loadRawData();

describe('catálogo de fuentes', () => {
  test('entran las tres formas: fuentes, meta.fuente_libro y meta.origen', () => {
    expect(raw.fuentes['mb']?.nombre).toBe('Minimalist Baker (Dana Shultz)');
    expect(raw.fuentes['libro_vgourmet']?.nombre).toContain('250 Recetas Veganas Proteicas');
    expect(raw.fuentes['recetario_personal']?.nombre).toBe('Recetario personal de Facu');
  });

  test('los sets 1 y 2 se funden sin que el 2 borre la credencial del 1', () => {
    // Los dos declaran `mb`, `rpl`, `ck` y `bbc`; solo el set 1 trae credencial.
    for (const ref of ['mb', 'rpl', 'ck', 'bbc']) {
      expect(raw.fuentes[ref]?.credencial, ref).toBeDefined();
      expect(raw.fuentes[ref]?.url, ref).toMatch(/^https:\/\//);
    }
  });

  test('la url null del dataset no llega como null', () => {
    // zahav es un libro: el dataset le pone `url: null`
    expect(raw.fuentes['zahav']?.nombre).toContain('Zahav');
    expect(raw.fuentes['zahav']).not.toHaveProperty('url');
  });

  test('T13 saca de la UI el texto que el dataset escribió para el pipeline', () => {
    const credencial = raw.fuentes['libro_vgourmet']?.credencial ?? '';
    expect(credencial).toBe('autoeditado, sin certificación externa');
    // vocabulario interno que no le dice nada a quien cocina
    expect(credencial).not.toMatch(/\bIC\b|por-probar/);
  });

  test('cada override de T13 apunta a una fuente que existe', () => {
    for (const ref of Object.keys(CURATED_SOURCES)) expect(raw.fuentes[ref], ref).toBeDefined();
  });

  test('ninguna receta se queda sin traducción para su fuente', () => {
    const refs = Object.values(raw.sets)
      .flat()
      .flatMap((r) => [r.fuente?.ref, r.fuente?.ref_secundaria])
      .filter((r): r is string => r !== undefined);
    expect(refs.length).toBeGreaterThan(80);
    expect([...new Set(refs)].filter((r) => raw.fuentes[r] === undefined)).toEqual([]);
  });
});
