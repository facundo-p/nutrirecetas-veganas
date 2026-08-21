import { describe, expect, test } from 'vitest';
import type { Perfil } from '../db/schema';
import { getSeedIndex } from '../seed';
import { edadEnAnios, objetivosDelPerfil } from './profile';
import { aporteDiarioEquivalente } from './supplements';

/**
 * El dataset trae en `perfil.json` los objetivos que la app "debería calcular"
 * para su perfil de ejemplo (varón, 75 kg, actividad 1.0): hierro 14.4 mg,
 * zinc 16.5 mg, calcio 1000 mg, yodo 150 µg, selenio 55 µg, proteína 75 g,
 * ALA 3.2 g, B12 y vitD cubiertos por suplemento. Se usan como golden.
 */

const idx = getSeedIndex();
const HOY = new Date('2026-08-19T12:00:00');

const perfilEjemplo: Perfil = {
  id: 1,
  sexo_para_requerimientos: 'masculino',
  fecha_nacimiento: '1990-01-01',
  peso_kg: 75,
  nivel_entrenamiento: 'sedentario',
  suplementos: [
    { nutriente_id: 'b12', dosis: 1000, unidad: 'µg', frecuencia: '2x_semana' },
    { nutriente_id: 'vitd', dosis: 15, unidad: 'µg', frecuencia: 'diaria' },
  ],
  overrides: [],
  nutrientes_destacados: [],
  creado_en: HOY.toISOString(),
  actualizado_en: HOY.toISOString(),
};

const objetivos = objetivosDelPerfil(perfilEjemplo, idx.seed.nutrientes, HOY);

const proteinaDe = (cambios: Partial<Perfil>) =>
  objetivosDelPerfil({ ...perfilEjemplo, ...cambios }, idx.seed.nutrientes, HOY);

describe('edad', () => {
  test('se deriva de la fecha de nacimiento', () => {
    expect(edadEnAnios('1990-01-01', HOY)).toBe(36);
  });

  test('todavía no cumplió años este año', () => {
    expect(edadEnAnios('1990-12-31', HOY)).toBe(35);
  });
});

describe('objetivos del perfil de ejemplo (golden de perfil.json)', () => {
  test('hierro: RDA 8 mg × factor vegano 1.8 = 14.4', () => {
    expect(objetivos.get('hierro')!.valor).toBeCloseTo(14.4, 2);
  });

  test('zinc: RDA 11 mg × 1.5 = 16.5', () => {
    expect(objetivos.get('zinc')!.valor).toBeCloseTo(16.5, 2);
  });

  test('calcio 1000 mg y yodo 150 µg salen directo de la RDA', () => {
    expect(objetivos.get('calcio')!.valor).toBeCloseTo(1000, 0);
    expect(objetivos.get('yodo')!.valor).toBeCloseTo(150, 0);
  });

  test('proteína: 0.8 g/kg × 1.25 (guía vegana) × 75 kg, sedentario = 75 g', () => {
    expect(objetivos.get('proteina')!.valor).toBeCloseTo(75, 0);
  });

  test('omega-3: ALA 1.6 g duplicada por la guía vegana = 3.2 g', () => {
    expect(objetivos.get('omega3')!.valor).toBeCloseTo(3.2, 1);
  });

  test('el entrenamiento solo mueve la proteína, no el resto', () => {
    const conFuerza = proteinaDe({ nivel_entrenamiento: 'fuerza' });
    expect(conFuerza.get('proteina')!.valor).toBeCloseTo(120, 0);
    expect(conFuerza.get('hierro')!.valor).toBeCloseTo(14.4, 2);
  });

  test('el g/kg de cada nivel es el que declara su fuente, sobre 75 kg', () => {
    // Fija el resultado, no el factor: si el ajuste vegano cambiara, los
    // números deportivos se moverían solos y este test lo canta.
    expect(proteinaDe({ nivel_entrenamiento: 'sedentario' }).get('proteina')!.valor).toBeCloseTo(75, 0);
    expect(proteinaDe({ nivel_entrenamiento: 'activo' }).get('proteina')!.valor).toBeCloseTo(82.5, 1);
    expect(proteinaDe({ nivel_entrenamiento: 'fuerza' }).get('proteina')!.valor).toBeCloseTo(120, 0);
    expect(proteinaDe({ nivel_entrenamiento: 'intenso' }).get('proteina')!.valor).toBeCloseTo(150, 0);
  });

  test('a los 60 el piso por edad sube la proteína sin pedirlo en el selector', () => {
    const mayor = { fecha_nacimiento: '1960-01-01', nivel_entrenamiento: 'sedentario' } as const;
    expect(proteinaDe(mayor).get('proteina')!.valor).toBeCloseTo(90, 0);
  });

  test('el piso por edad no le baja el objetivo a quien entrena', () => {
    const mayorQueEntrena = { fecha_nacimiento: '1960-01-01', nivel_entrenamiento: 'intenso' } as const;
    expect(proteinaDe(mayorQueEntrena).get('proteina')!.valor).toBeCloseTo(150, 0);
  });

  test('las unidades son de cantidad, no de RDA (proteína en g, no g/kg)', () => {
    expect(objetivos.get('proteina')!.unidad).toBe('g');
    expect(objetivos.get('hierro')!.unidad).toBe('mg');
    expect(objetivos.get('vita')!.unidad).toBe('µg RAE');
  });
});

describe('suplementos', () => {
  test('el aporte diario equivalente reparte la dosis en la semana', () => {
    expect(aporteDiarioEquivalente({ nutriente_id: 'b12', dosis: 1000, unidad: 'µg', frecuencia: '2x_semana' })).toBeCloseTo(
      285.71,
      1,
    );
    expect(aporteDiarioEquivalente({ nutriente_id: 'vitd', dosis: 15, unidad: 'µg', frecuencia: 'diaria' })).toBe(15);
  });

  test('B12 1000 µg dos veces por semana apaga la exigencia alimentaria', () => {
    expect(objetivos.get('b12')!.cubierto_por_suplemento).toBe(true);
  });

  test('vitamina D 15 µg diarios cubre su objetivo', () => {
    expect(objetivos.get('vitd')!.cubierto_por_suplemento).toBe(true);
  });

  test('un suplemento que no alcanza suma su aporte pero no apaga la exigencia', () => {
    const flojo: Perfil = {
      ...perfilEjemplo,
      suplementos: [{ nutriente_id: 'vitd', dosis: 5, unidad: 'µg', frecuencia: 'diaria' }],
    };
    const o = objetivosDelPerfil(flojo, idx.seed.nutrientes, HOY).get('vitd')!;
    expect(o.cubierto_por_suplemento).toBe(false);
    expect(o.aporte_suplemento_diario).toBeCloseTo(5);
  });

  test('sin suplementos declarados, nada queda cubierto', () => {
    const sinSupl: Perfil = { ...perfilEjemplo, suplementos: [] };
    const o = objetivosDelPerfil(sinSupl, idx.seed.nutrientes, HOY);
    expect(o.get('b12')!.cubierto_por_suplemento).toBe(false);
    expect(o.get('b12')!.aporte_suplemento_diario).toBe(0);
  });
});

describe('overrides', () => {
  test('pisan la RDA y quedan marcados con su motivo', () => {
    const conOverride: Perfil = {
      ...perfilEjemplo,
      overrides: [{ nutriente_id: 'hierro', objetivo: 25, unidad: 'mg', motivo: 'ferritina baja (indicación médica)' }],
    };
    const o = objetivosDelPerfil(conOverride, idx.seed.nutrientes, HOY).get('hierro')!;
    expect(o.valor).toBe(25);
    expect(o.origen).toBe('override');
    expect(o.motivo_override).toContain('ferritina');
  });
});

describe('perfiles fuera de la ventana exacta', () => {
  test('un varón de 60 marca el objetivo de calcio como aproximado', () => {
    const mayor: Perfil = { ...perfilEjemplo, fecha_nacimiento: '1966-01-01' };
    const o = objetivosDelPerfil(mayor, idx.seed.nutrientes, HOY).get('calcio')!;
    expect(o.aproximada).toBe(true);
  });

  test('una mujer de 30 tiene objetivo de hierro más alto que un varón', () => {
    const mujer: Perfil = { ...perfilEjemplo, sexo_para_requerimientos: 'femenino', fecha_nacimiento: '1996-01-01' };
    const oMujer = objetivosDelPerfil(mujer, idx.seed.nutrientes, HOY).get('hierro')!;
    expect(oMujer.valor).toBeGreaterThan(objetivos.get('hierro')!.valor);
  });
});
