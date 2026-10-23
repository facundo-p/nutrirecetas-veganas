import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import type { Equivalences, Seed } from '../../src/seed/schema';
import {
  auditarGramos,
  construirTablas,
  familiaDeLinea,
  referenciaDeLinea,
  resumenDeGramos,
  toleranciaDeRedondeo,
  type Resolucion,
} from './gramos';

function equivalenciasStub(extra: Partial<Equivalences> = {}): Equivalences {
  return {
    volumen_ml: {
      taza: { ml: 240, confianza: 9 },
      taza_te_ar: { ml: 200, confianza: 6 },
      cda: { ml: 15, confianza: 9 },
      cdta: { ml: 5, confianza: 9 },
      vaso: { ml: 225, confianza: 6 },
    },
    peso_por_volumen: [],
    peso_por_unidad: [],
    conversion_seco_cocido: [],
    envases_locales_ar: [],
    horno_celsius: [],
    ...extra,
  };
}

const vol = (ingrediente_id: string, medida: string, g: number) => ({
  ingrediente_id, medida, g, confianza: 8,
});
const pieza = (ingrediente_id: string, tamano: string, g: number, rango?: [number, number]) => ({
  ingrediente_id, tamano, g, rango, confianza: 8,
});

function resolver(equivalencias: Equivalences, id: string, unidad: string): Resolucion {
  return referenciaDeLinea(id, unidad, construirTablas(equivalencias));
}

const ml = construirTablas(equivalenciasStub()).mlPorMedida;

describe('familia de la línea', () => {
  test('`ml` es volumen, no peso: 40 ml de aceite son 36 g', () => {
    // `familiaDeUnidad` de rounding.ts lo mete en `peso`, que es correcto para
    // redondear y falso para convertir. Por eso el guardia no la reusa.
    expect(familiaDeLinea('ml', ml)).toBe('volumen');
    expect(familiaDeLinea('cc', ml)).toBe('volumen');
    expect(familiaDeLinea('g', ml)).toBe('peso');
    expect(familiaDeLinea('g_escurrido', ml)).toBe('peso');
  });

  test('la cabeza manda, y el `+` gana sobre todo', () => {
    expect(familiaDeLinea('taza_cocido_FRIO', ml)).toBe('volumen');
    expect(familiaDeLinea('cucharadas', ml)).toBe('volumen');
    expect(familiaDeLinea('diente_chico', ml)).toBe('pieza');
    expect(familiaDeLinea('pizca', ml)).toBe('a_ojo');
    expect(familiaDeLinea('g_masa + 150 crumble', ml)).toBe('compuesta');
    expect(familiaDeLinea('taza_base + 1.25 relleno', ml)).toBe('compuesta');
  });
});

describe('resolución de fila', () => {
  test('la cabeza sola encuentra la fila única', () => {
    const eq = equivalenciasStub({ peso_por_volumen: [vol('azucar', 'taza', 200)] });
    expect(resolver(eq, 'azucar', 'taza')).toMatchObject({ g_por_medida: 200, via: 'clave' });
  });

  test('con crudo y cocido, el sufijo elige; sin sufijo queda ambigua', () => {
    const eq = equivalenciasStub({
      peso_por_volumen: [vol('arroz_blanco', 'taza_crudo', 198), vol('arroz_blanco', 'taza_cocido', 175)],
    });
    expect(resolver(eq, 'arroz_blanco', 'taza_cocido_FRIO')).toMatchObject({ g_por_medida: 175, via: 'sufijo' });
    // el género no coincide entre el dataset y la tabla: `cruda` → `crudo`
    expect(resolver(eq, 'arroz_blanco', 'taza_cruda')).toMatchObject({ g_por_medida: 198 });
    expect(resolver(eq, 'arroz_blanco', 'taza')).toEqual({ ambigua: ['taza_crudo', 'taza_cocido'] });
  });

  test('las candidatas que difieren solo por tamaño caen en la mediana', () => {
    const eq = equivalenciasStub({
      peso_por_unidad: [pieza('cebolla', 'chica', 110), pieza('cebolla', 'mediana', 150), pieza('cebolla', 'grande', 250)],
    });
    // `unidad` no nombra ninguna fila: se infiere la pieza, y el informe lo dice.
    expect(resolver(eq, 'cebolla', 'unidad')).toMatchObject({ g_por_medida: 150, via: 'pieza' });
    expect(resolver(eq, 'cebolla', 'grande')).toMatchObject({ g_por_medida: 250 });
  });

  test('con la fila de taza se derivan cda, cdta y ml', () => {
    const eq = equivalenciasStub({ peso_por_volumen: [vol('azucar_impalpable', 'taza', 240)] });
    expect(resolver(eq, 'azucar_impalpable', 'cda')).toMatchObject({ g_por_medida: 15, via: 'derivada_ml' });
    expect(resolver(eq, 'azucar_impalpable', 'cdta')).toMatchObject({ g_por_medida: 5 });
    expect(resolver(eq, 'azucar_impalpable', 'ml')).toMatchObject({ g_por_medida: 1 });
  });

  test('`taza_te_ar` no puede hacerse pasar por `taza`', () => {
    // Su cabeza es `taza`; si entrara al mapa de medidas, toda taza mediría 200 ml.
    expect(ml.get('taza')).toBe(240);
    expect(ml.has('taza_te_ar')).toBe(false);
  });

  test('el pseudo-id llega solo a los ingredientes del mapa', () => {
    const eq = equivalenciasStub({ peso_por_volumen: [vol('aceite', 'taza', 218), vol('aceite', 'cda', 13.5)] });
    expect(resolver(eq, 'aceite_oliva', 'cda')).toMatchObject({ g_por_medida: 13.5, via: 'pseudo' });
    // `categoria === 'aceite'` arrastraría al coco, que el dataset mide a 200 g/taza.
    expect(resolver(eq, 'aceite_coco', 'taza')).toBeNull();
    expect(resolver(eq, 'margarina', 'taza')).toBeNull();
  });

  test('la pieza descriptiva cae en la pieza entera', () => {
    const eq = equivalenciasStub({ peso_por_unidad: [pieza('banana', 'mediana_pelada', 118)] });
    // «2 bananas muy maduras» mide bananas, no «muys».
    expect(resolver(eq, 'banana', 'muy_maduras')).toMatchObject({ g_por_medida: 118, via: 'pieza' });
    expect(resolver(eq, 'banana', 'pisada')).toMatchObject({ g_por_medida: 118 });
  });

  test('una fila que no nombra la pieza entera no se usa para inferir', () => {
    // `pulpa` no es «una palta»: la línea que la use tiene que decirlo.
    const eq = equivalenciasStub({ peso_por_unidad: [pieza('palta', 'entera', 200), pieza('palta', 'pulpa', 140)] });
    expect(resolver(eq, 'palta', 'guacamole')).toMatchObject({ g_por_medida: 200, clave: 'entera' });
  });

  test('sin filas del ingrediente, no hay referencia', () => {
    expect(resolver(equivalenciasStub(), 'vinagre', 'cda')).toBeNull();
  });
});

describe('tolerancia', () => {
  test('es medio escalón de redondearPeso', () => {
    expect(toleranciaDeRedondeo(0.75)).toBe(0.05);
    expect(toleranciaDeRedondeo(13.5)).toBe(0.5);
    expect(toleranciaDeRedondeo(60)).toBe(2.5);
    expect(toleranciaDeRedondeo(132)).toBe(5);
  });
});

function auditarUna(equivalencias: Equivalences, id: string, unidad: string, cantidad: number, g: number) {
  const seed = {
    equivalencias,
    recetas: [
      {
        id: 'rX',
        lineas: [{ ref: { tipo: 'ingrediente' as const, id }, cantidad, unidad_display: unidad, g_aprox: g }],
      },
    ],
  } as unknown as Omit<Seed, 'content_hash'>;
  return auditarGramos(seed)[0]!.veredicto;
}

describe('veredicto', () => {
  const azucar = equivalenciasStub({ peso_por_volumen: [vol('azucar', 'taza', 200)] });
  const aceite = equivalenciasStub({ peso_por_volumen: [vol('aceite', 'cda', 13.5)] });

  test('el ruido de redondeo de fracciones NO se marca', () => {
    // 0,66 taza × 200 = 132; el dataset escribió 130. Es el caso por el que la
    // tolerancia no puede ser un porcentaje.
    expect(auditarUna(azucar, 'azucar', 'taza', 0.66, 130).estado).toBe('coherente');
  });

  test('una sola tarifa redondeada al gramo por línea NO se marca', () => {
    // 13 / 13,3 / 13,5 g por cucharada son 13,5 redondeado, no tres tarifas.
    expect(auditarUna(aceite, 'aceite_oliva', 'cda', 1, 13).estado).toBe('coherente');
    expect(auditarUna(aceite, 'aceite_oliva', 'cda', 3, 40).estado).toBe('coherente');
    expect(auditarUna(aceite, 'aceite_oliva', 'cda', 2, 27).estado).toBe('coherente');
  });

  test('el rango declarado le gana a la tolerancia', () => {
    const eq = equivalenciasStub({ peso_por_unidad: [pieza('ajo', 'diente', 4, [3, 6])] });
    expect(auditarUna(eq, 'ajo', 'diente_chico', 1, 3).estado).toBe('coherente');
    expect(auditarUna(eq, 'ajo', 'diente', 1, 8).estado).toBe('divergente');
  });

  test('un error sistemático sí se marca', () => {
    const eq = equivalenciasStub({ peso_por_volumen: [vol('azucar_impalpable', 'taza', 113)] });
    expect(auditarUna(eq, 'azucar_impalpable', 'taza', 1, 150)).toMatchObject({
      estado: 'divergente', esperado_g: 113,
    });
  });

  test('el peso directo se compara contra su propia cantidad', () => {
    expect(auditarUna(equivalenciasStub(), 'garbanzos', 'g', 100, 100).estado).toBe('peso_directo');
    // `g_lata` 400 → 240 es el peso escurrido: diverge, y por eso se mira.
    expect(auditarUna(equivalenciasStub(), 'durazno_almibar', 'g_lata', 400, 240).estado).toBe('divergente');
  });

  test('la compuesta no se compara nunca', () => {
    // `cantidad` describe el primer sumando y `g_aprox` el total.
    expect(auditarUna(azucar, 'azucar', 'taza_base + 1.25 relleno', 0.66, 380)).toEqual({
      estado: 'no_aplica', motivo: 'compuesta',
    });
  });
});

describe('coherencia dentro del grupo', () => {
  function auditarGrupo(lineas: readonly [string, number, number][]) {
    const seed = {
      equivalencias: equivalenciasStub(),
      recetas: lineas.map(([unidad, cantidad, g], i) => ({
        id: `r${i}`,
        lineas: [{ ref: { tipo: 'ingrediente' as const, id: 'x' }, cantidad, unidad_display: unidad, g_aprox: g }],
      })),
    } as unknown as Omit<Seed, 'content_hash'>;
    return auditarGramos(seed).map((l) => l.veredicto.estado);
  }

  test('con mayoría, se marca solo la disidente', () => {
    expect(auditarGrupo([['cdta', 1, 2], ['cdta', 1, 2], ['cdta_llena', 1, 3]])).toEqual([
      'sin_referencia', 'sin_referencia', 'incoherente_en_grupo',
    ]);
  });

  test('con n=2 y desacuerdo se marcan las dos: ninguna manda', () => {
    expect(auditarGrupo([['cda_rebozar', 3, 15], ['cda_topping', 1, 7]])).toEqual([
      'incoherente_en_grupo', 'incoherente_en_grupo',
    ]);
  });

  test('una línea sola no es incoherente con nadie', () => {
    expect(auditarGrupo([['cdta', 1, 2]])).toEqual(['sin_referencia']);
  });

  test('una línea con referencia no entra al chequeo de grupo', () => {
    // Si no, recibiría dos veredictos por la misma cantidad.
    const eq = equivalenciasStub({ peso_por_volumen: [vol('x', 'cda', 12)] });
    const seed = {
      equivalencias: eq,
      recetas: [
        { id: 'a', lineas: [{ ref: { tipo: 'ingrediente' as const, id: 'x' }, cantidad: 1, unidad_display: 'cda', g_aprox: 12 }] },
        { id: 'b', lineas: [{ ref: { tipo: 'ingrediente' as const, id: 'x' }, cantidad: 3, unidad_display: 'cda_mezcla', g_aprox: 30 }] },
      ],
    } as unknown as Omit<Seed, 'content_hash'>;
    expect(auditarGramos(seed).map((l) => l.veredicto.estado)).toEqual(['coherente', 'divergente']);
  });
});

describe('la semilla publicada', () => {
  const seedPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'seed', 'seed.json');
  const seed = JSON.parse(readFileSync(seedPath, 'utf8')) as Seed;
  const resumen = resumenDeGramos(auditarGramos(seed));

  /**
   * Trinquete de cobertura: sube con cada lote de T18 y nunca baja. Lo que ya
   * se pudo verificar no se deja de verificar. Si una receta se borró y el
   * número bajó legítimamente, se baja a mano en el mismo commit.
   */
  const LINEAS_CON_REFERENCIA_MINIMAS = 504;

  test('toda línea queda auditada', () => {
    const lineas = seed.recetas.reduce((n, r) => n + r.lineas.length, 0);
    expect(resumen.total).toBe(lineas);
  });

  test('la cobertura no baja', () => {
    expect(resumen.conReferencia).toBeGreaterThanOrEqual(LINEAS_CON_REFERENCIA_MINIMAS);
  });

  /**
   * Todavía no rompe: las 31 líneas ajustables son el insumo del gate de datos
   * (#210). Cuando T16 y T17 las cubran, este test pasa a exigir cero.
   */
  test('las líneas ajustables están contadas y no crecen', () => {
    expect(resumen.ajustables).toBeLessThanOrEqual(31);
  });
});
