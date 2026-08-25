import { describe, expect, test } from 'vitest';
import type { Coccion, Consumo, Perfil } from '../db/schema';
import { getSeedIndex } from '../seed';
import { porcionesPorVentana, semaforo, type EstadoNutriente } from './traffic-light';
import { ventanaDia, ventanaSemanaMovil } from './windows';

const idx = getSeedIndex();
const HOY = new Date('2026-08-19T15:00:00'); // miércoles

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

/** Cocción sintética: se declara cuánto aporta CADA porción de cada nutriente. */
function coccion(id: number, porNutriente: Record<string, number>, cobertura = 100): Coccion {
  const por_nutriente = Object.fromEntries(
    Object.entries(porNutriente).map(([clave, valor]) => [
      clave,
      { intervalo: { min: valor, max: valor }, cobertura_pct: cobertura, ic: 8 },
    ]),
  );
  return {
    id,
    receta_id: 'r01',
    receta_nombre: 'Receta de prueba',
    seed_version: '1.0.0',
    fecha: HOY.toISOString(),
    porciones_rendidas: 4,
    factor_escala: 1,
    lineas: [],
    variaciones: [],
    nutricion_porcion: {
      masa_total_g: 400,
      kcal: { intervalo: { min: 500, max: 500 }, cobertura_pct: cobertura, ic: 8 },
      por_nutriente,
      alerta_b12: false,
    },
  };
}

function consumo(coccion_id: number, porciones: number, fecha: string): Consumo {
  return { id: coccion_id * 100 + porciones, coccion_id, fecha, porciones };
}

function correr(cocciones: Coccion[], consumos: Consumo[], perfilUsado = perfil): Map<string, EstadoNutriente> {
  const estados = semaforo({
    perfil: perfilUsado,
    nutrientes: idx.seed.nutrientes,
    consumos,
    cocciones: new Map(cocciones.map((c) => [c.id, c])),
    hoy: HOY,
  });
  return new Map(estados.map((e) => [e.nutriente_id, e]));
}

describe('ventanas', () => {
  test('el día es el día calendario local', () => {
    const v = ventanaDia(HOY);
    expect(v.desde.getHours()).toBe(0);
    expect(v.hasta.getHours()).toBe(23);
    expect(v.desde.getDate()).toBe(19);
  });

  test('la semana es móvil: incluye hoy y los 6 días previos', () => {
    const v = ventanaSemanaMovil(HOY);
    expect(v.desde.getDate()).toBe(13);
    expect(v.hasta.getDate()).toBe(19);
  });
});

describe('estados del semáforo', () => {
  // objetivo de hierro del perfil: 8 mg × 1.8 = 14.4 mg por día
  test('≥90 % del objetivo = cubierto', () => {
    const estados = correr([coccion(1, { hierro_mg: 14 })], [consumo(1, 1, HOY.toISOString())]);
    expect(estados.get('hierro')!.estado).toBe('cubierto');
  });

  test('entre 60 y 90 % = parcial', () => {
    const estados = correr([coccion(1, { hierro_mg: 10 })], [consumo(1, 1, HOY.toISOString())]);
    expect(estados.get('hierro')!.estado).toBe('parcial');
  });

  test('menos de 60 % = insuficiente', () => {
    const estados = correr([coccion(1, { hierro_mg: 4 })], [consumo(1, 1, HOY.toISOString())]);
    expect(estados.get('hierro')!.estado).toBe('insuficiente');
  });

  test('las porciones multiplican el aporte', () => {
    const estados = correr([coccion(1, { hierro_mg: 5 })], [consumo(1, 3, HOY.toISOString())]);
    expect(estados.get('hierro')!.consumido).toEqual({ min: 15, max: 15 });
    expect(estados.get('hierro')!.estado).toBe('cubierto');
  });

  test('sin registros no se pinta rojo: es sin datos', () => {
    const estados = correr([], []);
    expect(estados.get('hierro')!.estado).toBe('sin_datos');
  });

  test('con registros que no tienen ese nutriente, sigue siendo sin datos', () => {
    const estados = correr([coccion(1, { hierro_mg: 14 })], [consumo(1, 1, HOY.toISOString())]);
    expect(estados.get('yodo')!.estado).toBe('sin_datos');
  });
});

describe('cada nutriente en SU ventana', () => {
  const hace3dias = new Date('2026-08-16T13:00:00').toISOString();

  test('el hierro (día) no ve lo comido anteayer', () => {
    const estados = correr([coccion(1, { hierro_mg: 14 })], [consumo(1, 1, hace3dias)]);
    expect(estados.get('hierro')!.ventana).toBe('dia');
    expect(estados.get('hierro')!.estado).toBe('sin_datos');
  });

  test('el yodo (semana) sí lo ve, y su objetivo es el diario × 7', () => {
    // objetivo semanal: 150 µg × 7 = 1050 µg
    const estados = correr([coccion(1, { yodo_ug: 1000 })], [consumo(1, 1, hace3dias)]);
    const yodo = estados.get('yodo')!;
    expect(yodo.ventana).toBe('semana');
    expect(yodo.objetivo).toBeCloseTo(1050, 0);
    expect(yodo.estado).toBe('cubierto'); // 95 % del objetivo semanal
  });

  test('lo mismo repartido en la semana no alcanza para el objetivo semanal', () => {
    const estados = correr([coccion(1, { yodo_ug: 300 })], [consumo(1, 1, hace3dias)]);
    expect(estados.get('yodo')!.estado).toBe('insuficiente'); // 29 %
  });

  test('lo comido hace 8 días ya salió de la ventana semanal', () => {
    const hace8dias = new Date('2026-08-11T13:00:00').toISOString();
    const estados = correr([coccion(1, { yodo_ug: 900 })], [consumo(1, 1, hace8dias)]);
    expect(estados.get('yodo')!.estado).toBe('sin_datos');
  });
});

describe('bandas de incertidumbre', () => {
  test('si el intervalo cruza un umbral, queda al borde', () => {
    const conBanda: Coccion = {
      ...coccion(1, {}),
      nutricion_porcion: {
        masa_total_g: 400,
        kcal: { intervalo: { min: 500, max: 500 }, cobertura_pct: 100, ic: 8 },
        // 8 a 14 mg contra un objetivo de 14.4: el punto medio (11) es parcial,
        // pero la banda va de insuficiente a casi cubierto
        por_nutriente: { hierro_mg: { intervalo: { min: 8, max: 14 }, cobertura_pct: 100, ic: 6 } },
        alerta_b12: false,
      },
    };
    const estados = correr([conBanda], [consumo(1, 1, HOY.toISOString())]);
    expect(estados.get('hierro')!.estado).toBe('parcial');
    expect(estados.get('hierro')!.al_borde).toBe(true);
  });

  test('un valor puntual no queda al borde', () => {
    const estados = correr([coccion(1, { hierro_mg: 14 })], [consumo(1, 1, HOY.toISOString())]);
    expect(estados.get('hierro')!.al_borde).toBe(false);
  });
});

describe('suplementos e invariantes de seguridad', () => {
  test('un suplemento que cumple apaga la exigencia alimentaria de B12', () => {
    const conSupl: Perfil = {
      ...perfil,
      suplementos: [{ nutriente_id: 'b12', dosis: 1000, unidad: 'µg', frecuencia: '2x_semana' }],
    };
    const estados = correr([], [], conSupl);
    expect(estados.get('b12')!.estado).toBe('cubierto_por_suplemento');
  });

  test('el magnesio alimentario no alerta exceso aunque supere el UL (invariante 7)', () => {
    // UL de magnesio: 350 mg, con ul_nota que lo limita a suplementos
    const estados = correr([coccion(1, { magnesio_mg: 900 })], [consumo(1, 1, HOY.toISOString())]);
    expect(estados.get('magnesio')!.exceso_ul).toBe(false);
  });

  test('un nutriente con UL sin nota sí alerta exceso', () => {
    // zinc: UL 40 mg y sin ul_nota
    const estados = correr([coccion(1, { zinc_mg: 60 })], [consumo(1, 1, HOY.toISOString())]);
    expect(estados.get('zinc')!.exceso_ul).toBe(true);
  });
});

describe('trazabilidad del objetivo', () => {
  test('el estado dice de dónde salió el objetivo y si es aproximado', () => {
    const estados = correr([], []);
    expect(estados.get('hierro')!.origen_objetivo).toBe('rda');
    expect(estados.get('hierro')!.unidad).toBe('mg');
  });
});

describe('porciones por ventana', () => {
  const contar = (cocciones: Coccion[], consumos: Consumo[]) =>
    porcionesPorVentana({ cocciones: new Map(cocciones.map((c) => [c.id, c])), consumos, hoy: HOY });

  const haceDias = (dias: number) => {
    const fecha = new Date(HOY);
    fecha.setDate(fecha.getDate() - dias);
    return fecha.toISOString();
  };

  test('sin consumos, las dos ventanas están en cero', () => {
    expect(contar([coccion(1, { hierro_mg: 5 })], [])).toEqual({ dia: 0, semana: 0 });
  });

  test('lo de hoy cuenta en las dos ventanas', () => {
    expect(contar([coccion(1, { hierro_mg: 5 })], [consumo(1, 2, HOY.toISOString())])).toEqual({ dia: 2, semana: 2 });
  });

  test('lo de anteayer cuenta en la semana pero no en el día', () => {
    expect(contar([coccion(1, { hierro_mg: 5 })], [consumo(1, 1.5, haceDias(2))])).toEqual({ dia: 0, semana: 1.5 });
  });

  test('lo de hace 8 días no cuenta en ninguna: la semana es móvil', () => {
    expect(contar([coccion(1, { hierro_mg: 5 })], [consumo(1, 3, haceDias(8))])).toEqual({ dia: 0, semana: 0 });
  });

  test('un consumo huérfano no cuenta: el semáforo tampoco lo suma', () => {
    expect(contar([], [consumo(99, 2, HOY.toISOString())])).toEqual({ dia: 0, semana: 0 });
  });
});
