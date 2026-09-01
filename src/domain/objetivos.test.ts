import { describe, expect, test } from 'vitest';
import type { Perfil } from '../db/schema';
import { getSeedIndex } from '../seed';
import { objetivosDeReferencia, porcentajeAfirmableSolo, porcentajeDeObjetivo } from './objetivos';

const idx = getSeedIndex();
const HOY = new Date('2026-08-19T12:00:00');

const perfil: Perfil = {
  id: 1,
  sexo_para_requerimientos: 'masculino',
  fecha_nacimiento: '1990-01-01',
  peso_kg: 75,
  nivel_entrenamiento: 'sedentario',
  nutrientes_destacados: [],
  creado_en: HOY.toISOString(),
  actualizado_en: HOY.toISOString(),
};

const conPerfil = () => objetivosDeReferencia(perfil, idx.seed.nutrientes, HOY);
const sinPerfil = () => objetivosDeReferencia(null, idx.seed.nutrientes, HOY);

describe('de dónde sale el objetivo', () => {
  test('con perfil, es el tuyo', () => {
    expect(conPerfil().fuente).toBe('perfil');
  });

  test('sin perfil, es la referencia adulta genérica y lo dice', () => {
    expect(sinPerfil().fuente).toBe('referencia-generica');
  });

  test('los dos caminos devuelven los 20 nutrientes: la UI no tiene que preguntar', () => {
    expect(conPerfil().porNutriente.size).toBe(idx.seed.nutrientes.length);
    expect(sinPerfil().porNutriente.size).toBe(idx.seed.nutrientes.length);
  });
});

describe('el objetivo con perfil respeta lo que ya calculaba el perfil', () => {
  test('hierro: RDA 8 mg × factor vegano 1.8 = 14,4', () => {
    expect(conPerfil().porNutriente.get('hierro')!.valor).toBeCloseTo(14.4, 2);
  });

  test('la proteína usa el peso declarado, no el de referencia', () => {
    const pesado = { ...perfil, peso_kg: 100 };
    const a = objetivosDeReferencia(perfil, idx.seed.nutrientes, HOY).porNutriente.get('proteina')!.valor;
    const b = objetivosDeReferencia(pesado, idx.seed.nutrientes, HOY).porNutriente.get('proteina')!.valor;
    expect(b).toBeGreaterThan(a);
  });
});

describe('el objetivo sin perfil', () => {
  test('el hierro genérico toma la entrada adulta más alta: la de mujer', () => {
    // 18 mg × 1.8 = 32,4. Sin saber quién sos, la app no puede quedarse corta.
    expect(sinPerfil().porNutriente.get('hierro')!.valor).toBeCloseTo(32.4, 1);
  });

  test('la proteína genérica se calcula sobre 70 kg', () => {
    // 0,8 g/kg × 1,25 × 70 = 70
    expect(sinPerfil().porNutriente.get('proteina')!.valor).toBeCloseTo(70, 0);
  });

  test('trae la unidad de cantidad, igual que con perfil', () => {
    expect(sinPerfil().porNutriente.get('proteina')!.unidad).toBe('g');
    expect(sinPerfil().porNutriente.get('hierro')!.unidad).toBe('mg');
  });
});

describe('el porcentaje', () => {
  const objetivo = { nutriente_id: 'hierro', nombre: 'Hierro', valor: 14.4, unidad: 'mg' };

  test('es el punto medio del aporte sobre el objetivo', () => {
    const aporte = { intervalo: { min: 3.4, max: 3.4 }, cobertura_pct: 95, ic: 8 };
    expect(porcentajeDeObjetivo(aporte, objetivo)).toBeCloseTo(23.6, 1);
  });

  test('usa el punto medio de la banda, no sus extremos', () => {
    const aporte = { intervalo: { min: 0, max: 14.4 }, cobertura_pct: 95, ic: 8 };
    expect(porcentajeDeObjetivo(aporte, objetivo)).toBeCloseTo(50, 1);
  });

  test('sin dato reportable no afirma nada: null, no cero (invariante 5)', () => {
    expect(porcentajeDeObjetivo(undefined, objetivo)).toBeNull();
    // ic null es "no sabemos", y un cero con cobertura baja tampoco se afirma
    expect(porcentajeDeObjetivo({ intervalo: { min: 0, max: 0 }, cobertura_pct: 7, ic: null }, objetivo)).toBeNull();
  });

  test('un cero con cobertura alta sí se afirma: es un cero real', () => {
    expect(porcentajeDeObjetivo({ intervalo: { min: 0, max: 0 }, cobertura_pct: 99, ic: 8 }, objetivo)).toBe(0);
  });

  test('sin objetivo no hay porcentaje que calcular', () => {
    expect(porcentajeDeObjetivo({ intervalo: { min: 3, max: 3 }, cobertura_pct: 95, ic: 8 }, undefined)).toBeNull();
  });
});

describe('un porcentaje que viaja solo, sin su banda al lado', () => {
  const b12 = { nutriente_id: 'b12', nombre: 'Vitamina B12', valor: 2.4, unidad: 'µg' };
  const proteina = { nutriente_id: 'proteina', nombre: 'Proteína', valor: 70, unidad: 'g' };

  test('una banda que toca el cero no se afirma: es la B12 de la levadura', () => {
    // el caso real de r21: entre 0 y 12,72 µg. El punto medio da 265 % de la
    // dosis, y el rango incluye "no tiene nada"
    const desdeCero = { intervalo: { min: 0, max: 12.72 }, cobertura_pct: 10, ic: 5 };
    expect(porcentajeAfirmableSolo(desdeCero, b12)).toBeNull();
  });

  test('tampoco con cobertura alta: lo que descalifica es la banda, no la cobertura', () => {
    // d08: entre 0 y 3,75 µg con 85 % de cobertura. Un piso de cobertura lo
    // habría dejado pasar
    const desdeCeroBienCubierto = { intervalo: { min: 0, max: 3.75 }, cobertura_pct: 85, ic: 6 };
    expect(porcentajeAfirmableSolo(desdeCeroBienCubierto, b12)).toBeNull();
  });

  test('una banda que no toca el cero se afirma, por floja que sea la cobertura', () => {
    // p12: 21,64 g exactos sobre el 46 % del plato. Lo que falta solo puede
    // sumar, nunca restar: la afirmación es una cota inferior y se sostiene
    const puntualConPocaCobertura = { intervalo: { min: 21.64, max: 21.64 }, cobertura_pct: 46, ic: 7 };
    expect(porcentajeAfirmableSolo(puntualConPocaCobertura, proteina)).toBeCloseTo(30.9, 1);
  });

  test('con la banda a la vista el porcentaje se sigue mostrando', () => {
    // en la tabla y en el ranking la banda va pegada al número, así que el punto
    // medio no miente y no hace falta la regla
    const desdeCero = { intervalo: { min: 0, max: 12.72 }, cobertura_pct: 10, ic: 5 };
    expect(porcentajeDeObjetivo(desdeCero, b12)).not.toBeNull();
  });
});
