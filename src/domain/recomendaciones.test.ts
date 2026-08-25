import { describe, expect, test } from 'vitest';
import type { Coccion, Overlay, Perfil } from '../db/schema';
import { getSeedIndex } from '../seed';
import { nutritionOf } from '../ui/common/nutritionCache';
import { CRITERIOS, PESOS_POR_DEFECTO, recomendar, type Criterio, type EntradaRecomendacion } from './recomendaciones';
import { semaforo } from './traffic-light';

const idx = getSeedIndex();
const HOY = new Date('2026-08-19T15:00:00'); // agosto: invierno en AMBA

const perfil: Perfil = {
  id: 1,
  sexo_para_requerimientos: 'masculino',
  fecha_nacimiento: '1990-01-01',
  peso_kg: 75,
  nivel_entrenamiento: 'sedentario',
  suplementos: [],
  overrides: [],
  nutrientes_destacados: [],
  creado_en: HOY.toISOString(),
  actualizado_en: HOY.toISOString(),
};

function coccion(id: number, receta_id: string, diasAtras: number): Coccion {
  const fecha = new Date(HOY);
  fecha.setDate(fecha.getDate() - diasAtras);
  return {
    id,
    receta_id,
    receta_nombre: idx.recipeById.get(receta_id)?.nombre ?? receta_id,
    seed_version: '1.0.0',
    fecha: fecha.toISOString(),
    porciones_rendidas: 4,
    factor_escala: 1,
    lineas: [],
    variaciones: [],
    nutricion_porcion: {
      masa_total_g: 400,
      kcal: { intervalo: { min: 400, max: 400 }, cobertura_pct: 99, ic: 8 },
      por_nutriente: {},
      alerta_b12: false,
    },
  };
}

function entrada(over: Partial<EntradaRecomendacion> = {}): EntradaRecomendacion {
  const cocciones = over.cocciones ?? [];
  const consumos = over.consumos ?? [];
  const perfilUsado = over.perfil ?? perfil;
  return {
    idx,
    perfil: perfilUsado,
    estados: semaforo({
      perfil: perfilUsado,
      nutrientes: idx.seed.nutrientes,
      consumos,
      cocciones: new Map(cocciones.map((c) => [c.id, c])),
      hoy: HOY,
    }),
    cocciones,
    consumos,
    overlays: [],
    mes: 8,
    hoy: HOY,
    nutricionDe: (id) => nutritionOf(idx, id),
    ...over,
  };
}

const idsDe = (e: EntradaRecomendacion, opciones = {}) => recomendar(e, opciones).map((r) => r.receta.id);

describe('el motor', () => {
  test('recomienda algo aun con la base vacía', () => {
    const rec = recomendar(entrada());
    expect(rec.length).toBeGreaterThan(0);
    expect(rec.length).toBeLessThanOrEqual(3);
    expect(rec[0]!.motivos.length).toBeGreaterThan(0);
  });

  test('nunca recomienda un preparado ni una variante: no son una comida', () => {
    const todas = recomendar(entrada(), { limite: 200 });
    expect(todas.length).toBeGreaterThan(10);
    for (const { receta } of todas) {
      expect(receta.es_preparado).not.toBe(true);
      expect(receta.variante_de).toBeUndefined();
    }
  });

  test('el orden es estable: mismo contexto, mismo resultado', () => {
    expect(idsDe(entrada())).toEqual(idsDe(entrada()));
  });

  test('cambiar los pesos cambia el orden', () => {
    const e = entrada({ overlays: [{ receta_id: 'r04', favorita: true, actualizado_en: HOY.toISOString() }] });
    const soloFavoritas = idsDe(e, { pesos: { favoritas: 1 } });
    expect(soloFavoritas[0]).toBe('r04');
    expect(idsDe(e, { pesos: { 'de-estacion': 1 } })[0]).not.toBe('r04');
  });

  test('null no es cero: callarse no baja el puntaje, puntuar cero sí', () => {
    const habla: Criterio = { id: 'habla', descripcion: '', evaluar: () => ({ puntaje: 1, motivo: 'sí' }) };
    const callado: Criterio = { id: 'otro', descripcion: '', evaluar: () => null };
    const cero: Criterio = { id: 'otro', descripcion: '', evaluar: () => ({ puntaje: 0, motivo: '' }) };
    const pesos = { habla: 1, otro: 1 };
    const con = (c: Criterio) => recomendar(entrada(), { criterios: [habla, c], pesos, limite: 1 })[0]!.puntaje;
    expect(con(callado)).toBeGreaterThan(con(cero));
  });

  test('un criterio callado para todas no cambia el orden', () => {
    // sin overlays nadie es favorita: el criterio favoritas no opina de ninguna
    const conFavoritas = idsDe(entrada(), { pesos: { favoritas: 0.9, 'de-estacion': 0.1 }, limite: 20 });
    const soloEstacion = idsDe(entrada(), { pesos: { 'de-estacion': 1 }, limite: 20 });
    expect(conFavoritas).toEqual(soloEstacion);
  });

  test('convencer a dos criterios vale más que convencer al único que te mira', () => {
    // el promedio sobre poco peso se va a los extremos, y ahí una receta de la
    // que sabemos una sola cosa empataba con una que convence a todos
    const todas: Criterio = { id: 'todas', descripcion: '', evaluar: () => ({ puntaje: 1, motivo: 'a' }) };
    const soloR04: Criterio = {
      id: 'soloR04',
      descripcion: '',
      evaluar: (receta) => (receta.id === 'r04' ? { puntaje: 1, motivo: 'b' } : null),
    };
    const rec = recomendar(entrada(), { criterios: [todas, soloR04], pesos: { todas: 0.5, soloR04: 0.5 }, limite: 200 });
    expect(rec[0]!.receta.id).toBe('r04');
    expect(rec[0]!.puntaje).toBeGreaterThan(rec[1]!.puntaje);
  });

  test('ninguna receta llega al puntaje máximo: nadie convence a todos los criterios', () => {
    const todas = recomendar(entrada(), { limite: 200 });
    expect(todas.filter((r) => r.puntaje >= 0.999)).toHaveLength(0);
  });

  test('no repite tipo de receta mientras haya de otro: tres postres son uno repetido', () => {
    const rec = recomendar(entrada());
    const tipos = rec.map((r) => r.receta.tipo);
    expect(new Set(tipos).size).toBe(tipos.length);
  });

  test('si no hay de otro tipo, completa con lo que haya', () => {
    const soloDulces: Criterio = {
      id: 'soloDulces',
      descripcion: '',
      evaluar: (receta) => (receta.tipo === 'dulce' ? { puntaje: 1, motivo: 'dulce' } : null),
    };
    const rec = recomendar(entrada(), { criterios: [soloDulces], pesos: { soloDulces: 1 } });
    expect(rec).toHaveLength(3);
    for (const r of rec) expect(r.receta.tipo).toBe('dulce');
  });

  test('todos los criterios declarados tienen peso por defecto, y al revés', () => {
    expect(CRITERIOS.map((c) => c.id).sort()).toEqual(Object.keys(PESOS_POR_DEFECTO).sort());
  });
});

describe('criterio: favoritas', () => {
  const overlays: Overlay[] = [{ receta_id: 'r04', favorita: true, actualizado_en: HOY.toISOString() }];

  test('una favorita puntúa y lo dice', () => {
    const rec = recomendar(entrada({ overlays }), { pesos: { favoritas: 1 } });
    expect(rec[0]!.receta.id).toBe('r04');
    expect(rec[0]!.motivos[0]).toMatch(/favorita/i);
  });

  test('sin favoritas el criterio no opina de nadie', () => {
    expect(recomendar(entrada(), { pesos: { favoritas: 1 } })).toHaveLength(0);
  });
});

describe('criterio: novedad', () => {
  test('lo cocinado hace dos días queda al fondo', () => {
    const e = entrada({ cocciones: [coccion(1, 'r04', 2)] });
    const todas = recomendar(e, { pesos: { novedad: 1 }, limite: 200 });
    expect(todas.at(-1)!.receta.id).toBe('r04');
    expect(todas[0]!.puntaje).toBeGreaterThan(todas.at(-1)!.puntaje);
  });

  test('lo cocinado hace tres meses deja de penalizar, pero ya no es novedad', () => {
    const pesos = { novedad: 1, 'de-estacion': 1 };
    const r04De = (cocciones: Coccion[]) =>
      recomendar(entrada({ cocciones }), { pesos, limite: 200 }).find((r) => r.receta.id === 'r04');

    const recien = r04De([coccion(1, 'r04', 2)]);
    const vieja = r04De([coccion(1, 'r04', 90)]);
    const virgen = r04De([]);

    // recién hecha: novedad opina 0 y arrastra el promedio hacia abajo
    expect(vieja!.puntaje).toBeGreaterThan(recien!.puntaje);
    // hace 90 días ya no penaliza, pero tampoco recupera el empujón de novedad
    expect(vieja!.motivos).not.toContain('no la probaste todavía');
    expect(virgen!.motivos).toContain('no la probaste todavía');
  });

  test('solo las que la semilla marca por probar reciben el empujón de novedad', () => {
    const rec = recomendar(entrada(), { pesos: { novedad: 1 }, limite: 200 });
    for (const { receta } of rec) expect(receta.estado).toBe('por-probar');
  });
});

describe('criterio: hueco nutricional', () => {
  test('sin huecos el criterio no opina: nadie registró nada', () => {
    // sin consumos todo queda en "sin datos", que no es una falta
    expect(recomendar(entrada(), { pesos: { 'hueco-nutricional': 1 } })).toHaveLength(0);
  });

  test('con un hueco real, recomienda recetas que lo tapan y lo explica', () => {
    const conHierro: Coccion = {
      ...coccion(1, 'r01', 0),
      nutricion_porcion: {
        masa_total_g: 400,
        kcal: { intervalo: { min: 400, max: 400 }, cobertura_pct: 99, ic: 8 },
        // 5 mg de hierro contra un objetivo de 14,4: queda en "insuficiente"
        por_nutriente: { hierro_mg: { intervalo: { min: 5, max: 5 }, cobertura_pct: 95, ic: 8 } },
        alerta_b12: false,
      },
    };
    const e = entrada({
      cocciones: [conHierro],
      consumos: [{ id: 1, coccion_id: 1, fecha: HOY.toISOString(), porciones: 1 }],
    });
    const rec = recomendar(e, { pesos: { 'hueco-nutricional': 1 } });
    expect(rec.length).toBeGreaterThan(0);
    expect(rec[0]!.motivos.join(' ')).toMatch(/tapa el \d+ % del hueco de /);
  });

  test('un nutriente cubierto por suplemento no cuenta como hueco (invariante 4)', () => {
    const conB12: Perfil = {
      ...perfil,
      suplementos: [{ nutriente_id: 'b12', dosis: 1000, unidad: 'µg', frecuencia: 'diaria' }],
    };
    // una cocción con algo de b12 y algo de hierro, comida hoy: los dos quedarían
    // por debajo del objetivo, pero el suplemento apaga la exigencia del b12
    const conAmbos: Coccion = {
      ...coccion(1, 'r01', 0),
      nutricion_porcion: {
        masa_total_g: 400,
        kcal: { intervalo: { min: 400, max: 400 }, cobertura_pct: 99, ic: 8 },
        por_nutriente: {
          hierro_mg: { intervalo: { min: 5, max: 5 }, cobertura_pct: 95, ic: 8 },
          b12_ug: { intervalo: { min: 0.2, max: 0.2 }, cobertura_pct: 95, ic: 8 },
        },
        alerta_b12: false,
      },
    };
    const consumos = [{ id: 1, coccion_id: 1, fecha: HOY.toISOString(), porciones: 1 }];

    const espiados: string[][] = [];
    const espia: Criterio = {
      id: 'espia',
      descripcion: 'solo para el test: mira los huecos que el motor armó',
      evaluar(_receta, ctx) {
        espiados.push(ctx.huecos.map((h) => h.nutriente.id));
        return null;
      },
    };

    recomendar(entrada({ perfil: conB12, cocciones: [conAmbos], consumos }), {
      criterios: [espia],
      pesos: { espia: 1 },
    });
    expect(espiados[0]!).toContain('hierro');
    expect(espiados[0]!).not.toContain('b12');
  });
});

describe('criterio: de estación', () => {
  test('en agosto y en febrero no recomienda lo mismo', () => {
    const agosto = idsDe(entrada({ mes: 8 }), { pesos: { 'de-estacion': 1 } });
    const febrero = idsDe(entrada({ mes: 2 }), { pesos: { 'de-estacion': 1 } });
    expect(agosto).not.toEqual(febrero);
  });

  test('el motivo cuenta los ingredientes en pico', () => {
    const rec = recomendar(entrada({ mes: 8 }), { pesos: { 'de-estacion': 1 } });
    expect(rec[0]!.motivos[0]).toMatch(/ingrediente/);
  });
});

describe('criterio: puntaje', () => {
  test('el IC que le pusiste manda sobre la candidata a clásica', () => {
    const overlays: Overlay[] = [{ receta_id: 'r04', ic_usuario: 10, actualizado_en: HOY.toISOString() }];
    const rec = recomendar(entrada({ overlays }), { pesos: { puntaje: 1 } });
    expect(rec[0]!.receta.id).toBe('r04');
    expect(rec[0]!.motivos[0]).toMatch(/10/);
  });

  test('el ic de la semilla no se usa: mide confianza del dato, no qué tan rica es', () => {
    const rec = recomendar(entrada(), { pesos: { puntaje: 1 }, limite: 200 });
    for (const { receta } of rec) expect(receta.candidata_clasica).toBe(true);
  });
});
