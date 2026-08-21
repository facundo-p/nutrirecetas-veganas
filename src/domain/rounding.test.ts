import { describe, expect, test } from 'vitest';
import type { Line } from '../seed/schema';
import { familiaDeUnidad, redondearCantidad, redondearLinea } from './rounding';

function linea(cantidad: number, unidad_display: string, g_aprox: number): Line {
  return { ref: { tipo: 'ingrediente', id: 'x' }, cantidad, unidad_display, g_aprox, sustitutos: [] };
}

describe('familiaDeUnidad', () => {
  test('la familia sale de la cabeza del texto libre, no del valor completo', () => {
    expect(familiaDeUnidad('g_secas')).toBe('peso');
    expect(familiaDeUnidad('ml_caliente')).toBe('peso');
    expect(familiaDeUnidad('g (1.5 taza)')).toBe('peso');
    expect(familiaDeUnidad('cda_ahumado')).toBe('medida');
    expect(familiaDeUnidad('taza_base + 1.25 relleno')).toBe('medida');
    expect(familiaDeUnidad('diente_chico')).toBe('pieza');
    expect(familiaDeUnidad('chorrito_final')).toBe('a_ojo');
  });

  test('las cuatro familias cubren las unidades más usadas del dataset', () => {
    for (const u of ['g', 'ml']) expect(familiaDeUnidad(u)).toBe('peso');
    for (const u of ['cda', 'cdas', 'cdta', 'taza', 'vaso']) expect(familiaDeUnidad(u)).toBe('medida');
    for (const u of ['unidad', 'diente', 'mediana', 'hoja', 'rama', 'jugo', 'atado']) {
      expect(familiaDeUnidad(u)).toBe('pieza');
    }
    for (const u of ['pizca', 'chorro', 'gotas', 'puñado', 'punado', 'cn']) {
      expect(familiaDeUnidad(u)).toBe('a_ojo');
    }
  });

  test('una unidad desconocida cae en pieza: es la que se puede partir en cuartos', () => {
    expect(familiaDeUnidad('bloque_prensado')).toBe('pieza');
    expect(familiaDeUnidad('mitad_rojo_mitad_verde')).toBe('pieza');
  });
});

describe('redondearCantidad', () => {
  test('peso: el escalón crece con la magnitud y nunca deja decimales de gramo', () => {
    expect(redondearCantidad(208.33333333333334, 'peso')).toBe(210);
    expect(redondearCantidad(68.66666666666667, 'peso')).toBe(70);
    expect(redondearCantidad(12.4, 'peso')).toBe(12);
    expect(redondearCantidad(2.5, 'peso')).toBe(3);
    expect(redondearCantidad(750, 'peso')).toBe(750);
  });

  test('peso: un resultado que ya es entero se respeta — la mitad de 250 g es 125 g', () => {
    expect(redondearCantidad(125, 'peso')).toBe(125);
    expect(redondearCantidad(64, 'peso')).toBe(64);
    expect(redondearCantidad(124.99999999999999, 'peso')).toBe(125);
  });

  test('peso: por debajo del gramo se conserva un decimal en vez de mentir un cero', () => {
    expect(redondearCantidad(0.8333333333333334, 'peso')).toBe(0.8);
    expect(redondearCantidad(0.05, 'peso')).toBe(0.1);
    expect(redondearCantidad(0, 'peso')).toBe(0);
  });

  test('medida de cocina: siempre cuartos, como la cuchara medidora', () => {
    expect(redondearCantidad(1.6666666666666667, 'medida')).toBe(1.75);
    expect(redondearCantidad(1.125, 'medida')).toBe(1.25);
    expect(redondearCantidad(2.5, 'medida')).toBe(2.5);
    expect(redondearCantidad(10.83, 'medida')).toBe(10.75);
  });

  test('pieza: cuartos abajo, medios en el medio, enteros arriba', () => {
    expect(redondearCantidad(0.8333333333333334, 'pieza')).toBe(0.75);
    expect(redondearCantidad(2.5, 'pieza')).toBe(2.5);
    expect(redondearCantidad(3.3333333333333335, 'pieza')).toBe(3.5);
    expect(redondearCantidad(10.833333333333334, 'pieza')).toBe(11);
  });

  test('piso de un cuarto: ninguna cantidad partible se desvanece en cero', () => {
    expect(redondearCantidad(0.1, 'medida')).toBe(0.25);
    expect(redondearCantidad(0.1, 'pieza')).toBe(0.25);
  });

  test('a ojo: una pizca es una pizca, no tres cuartos de pizca', () => {
    expect(redondearCantidad(0.8333333333333334, 'a_ojo')).toBe(1);
    expect(redondearCantidad(0.1, 'a_ojo')).toBe(1);
    expect(redondearCantidad(2.4, 'a_ojo')).toBe(2);
  });
});

describe('redondearLinea', () => {
  test('la cantidad redondeada manda: los gramos se derivan de ella, no del lineal', () => {
    const base = linea(1, 'mediana', 150);
    const r = redondearLinea(linea(0.8333333333333334, 'mediana', 125), base);
    expect(r.cantidad).toBe(0.75);
    expect(r.g_aprox).toBe(110); // 150 × ¾ = 112,5, y el escalón de peso lo deja en 110
  });

  test('cuando la unidad ya es el gramo, cantidad y gramos no se separan', () => {
    const base = linea(250, 'g_secas', 250);
    const r = redondearLinea(linea(208.33333333333334, 'g_secas', 208.33333333333334), base);
    expect(r.cantidad).toBe(210);
    expect(r.g_aprox).toBe(210);
  });

  test('una línea sin cantidad base no puede derivar nada: se redondea el gramo escalado', () => {
    const base = linea(0, 'cn', 20);
    const r = redondearLinea(linea(0, 'cn', 16.666666666666668), base);
    expect(r.g_aprox).toBe(17);
  });

  test('lo que no es cantidad ni gramos viaja intacto', () => {
    const base = linea(2, 'diente', 8);
    const escalada = { ...linea(1.6666666666666667, 'diente', 6.666666666666667), funcion: 'aromática' };
    const r = redondearLinea(escalada, base);
    expect(r.unidad_display).toBe('diente');
    expect(r.funcion).toBe('aromática');
    expect(r.ref).toEqual({ tipo: 'ingrediente', id: 'x' });
  });
});
