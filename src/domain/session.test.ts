import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../seed';
import { midpoint } from './interval';
import { avisosDeEscalado, escalarReceta, esHorneada } from './scaling';
import {
  advertenciaDesmarcar,
  lineaAgregada,
  lineasIniciales,
  nutricionSesion,
  sustituirLinea,
  variacionesDe,
  type LineaSesion,
} from './session';

const idx = getSeedIndex();
const r01 = idx.recipeById.get('r01')!; // sopa de lentejas: tiene lentejas imprescindibles y especias
const p31 = idx.recipeById.get('p31')!; // pastafrola: horneada

describe('escalado', () => {
  test('×2 duplica los gramos de todas las líneas', () => {
    const { lineas } = escalarReceta(r01, 2, idx.seed);
    for (const [i, linea] of lineas.entries()) {
      expect(linea.g_aprox).toBeCloseTo(r01.lineas[i]!.g_aprox * 2);
    }
  });

  test('las porciones acompañan al factor', () => {
    expect(escalarReceta(r01, 2, idx.seed).porciones).toBe(r01.porciones_num! * 2);
  });

  test('sin cambio de factor no hay avisos', () => {
    expect(avisosDeEscalado(r01, 1, idx.seed)).toEqual([]);
  });

  test('las especias y la sal disparan "ajustá a gusto" con sus nombres', () => {
    const aviso = avisosDeEscalado(r01, 2, idx.seed).find((a) => a.tipo === 'ajustar_a_gusto');
    expect(aviso).toBeDefined();
    expect(aviso!.ingredientes!.length).toBeGreaterThan(0);
  });

  test('el tiempo de cocción nunca se escala, pero se avisa que hay que revisarlo', () => {
    const { lineas: _, avisos } = escalarReceta(r01, 3, idx.seed);
    expect(avisos.some((a) => a.tipo === 'revisar_tiempo')).toBe(true);
  });

  test('una receta horneada agranda el aviso: tandas o múltiplo del molde', () => {
    expect(esHorneada(p31)).toBe(true);
    expect(avisosDeEscalado(p31, 2, idx.seed).some((a) => a.tipo === 'horneado')).toBe(true);
  });

  test('achicar una receta horneada no dispara el aviso de molde', () => {
    expect(avisosDeEscalado(p31, 0.5, idx.seed).some((a) => a.tipo === 'horneado')).toBe(false);
  });
});

describe('sesión de cocina', () => {
  const lineas = lineasIniciales(r01, 1, idx.seed);
  const nutricionBase = nutricionSesion(lineas, r01, r01.porciones_num!, idx);

  test('arranca con todas las líneas activas y la nutrición de la receta', () => {
    expect(lineas.every((l) => l.activa)).toBe(true);
    const original = midpoint(nutricionBase.kcal.intervalo);
    expect(original).toBeCloseTo(977.76, 0);
  });

  test('desmarcar un imprescindible advierte citando su función', () => {
    const imprescindible = lineas.find((l) => l.imprescindible)!;
    const advertencia = advertenciaDesmarcar(imprescindible);
    expect(advertencia).toContain(imprescindible.nombre);
    if (imprescindible.funcion) expect(advertencia).toContain(imprescindible.funcion);
  });

  test('una línea que no es imprescindible no advierte nada', () => {
    const comun = lineas.find((l) => !l.imprescindible)!;
    expect(advertenciaDesmarcar(comun)).toBeNull();
  });

  test('la nutrición se mueve al desmarcar una línea', () => {
    const conLenteja = lineas.findIndex((l) => l.ref.tipo === 'ingrediente' && l.ref.id === 'lentejas_turcas');
    const sinLentejas: LineaSesion[] = lineas.map((l, i) => (i === conLenteja ? { ...l, activa: false } : l));
    const nueva = nutricionSesion(sinLentejas, r01, r01.porciones_num!, idx);
    expect(midpoint(nueva.kcal.intervalo)).toBeLessThan(midpoint(nutricionBase.kcal.intervalo));
    expect(nueva.por_nutriente.prot_g.intervalo.max).toBeLessThan(nutricionBase.por_nutriente.prot_g.intervalo.max);
  });

  test('sustituir por un ingrediente resoluble recalcula y recuerda el original', () => {
    const objetivo = lineas.find((l) => l.sustitutos.some((s) => s.tipo === 'id'))!;
    const sustituto = objetivo.sustitutos.find((s) => s.tipo === 'id')!;
    const cambiada = sustituirLinea(objetivo, { tipo: 'ingrediente', id: sustituto.valor }, idx.seed);
    expect(cambiada.original!.nombre).toBe(objetivo.nombre);
    expect(cambiada.nombre).not.toBe(objetivo.nombre);
    const nueva = nutricionSesion(
      lineas.map((l) => (l.key === objetivo.key ? cambiada : l)),
      r01,
      r01.porciones_num!,
      idx,
    );
    expect(nueva.masa_total_g).toBeCloseTo(nutricionBase.masa_total_g);
  });

  test('agregar un ingrediente de la base suma su aporte', () => {
    const conEspinaca = [...lineas, lineaAgregada({ tipo: 'ingrediente', id: 'espinaca' }, 100, idx.seed, 'extra-1')];
    const nueva = nutricionSesion(conEspinaca, r01, r01.porciones_num!, idx);
    expect(nueva.masa_total_g).toBeCloseTo(nutricionBase.masa_total_g + 100);
    expect(nueva.por_nutriente.hierro_mg.intervalo.max).toBeGreaterThan(
      nutricionBase.por_nutriente.hierro_mg.intervalo.max,
    );
  });

  test('las variaciones quedan listas para el registro', () => {
    const objetivo = lineas.find((l) => l.sustitutos.some((s) => s.tipo === 'id'))!;
    const modificadas: LineaSesion[] = [
      ...lineas.map((l, i) =>
        i === 0 ? { ...l, activa: false } : l.key === objetivo.key ? sustituirLinea(l, { tipo: 'ingrediente', id: 'papa' }, idx.seed) : l,
      ),
      lineaAgregada({ tipo: 'ingrediente', id: 'espinaca' }, 80, idx.seed, 'extra-1'),
    ];
    const variaciones = variacionesDe(modificadas);
    expect(variaciones).toContainEqual({ tipo: 'desmarcado', nombre: lineas[0]!.nombre });
    expect(variaciones.some((v) => v.tipo === 'sustituido' && v.detalle === 'por Papa')).toBe(true);
    expect(variaciones).toContainEqual({ tipo: 'agregado', nombre: 'Espinaca', detalle: '80 g' });
  });

  test('la sesión no muta la receta de la semilla', () => {
    const antes = JSON.stringify(idx.recipeById.get('r01'));
    nutricionSesion(lineas.map((l) => ({ ...l, activa: false })), r01, 4, idx);
    expect(JSON.stringify(idx.recipeById.get('r01'))).toBe(antes);
  });
});
