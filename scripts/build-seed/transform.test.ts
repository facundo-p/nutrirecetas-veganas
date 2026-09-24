import { beforeAll, describe, expect, test } from 'vitest';
import { CURATED_LAMINAS, CURATED_STEPS, CURATED_TYPES } from './curated-tables';
import { loadRawData, type RawData } from './load';
import {
  aplicarTipoCurado,
  laminaDeReceta,
  toNutrientValue,
  transformIngredient,
  transformNutrient,
  transformRecipes,
  transformSeasonality,
  transformStorage,
  validarPasos,
} from './transform';
import type { Line, Recipe } from '../../src/seed/schema';

let raw: RawData;
let recipes: Recipe[];
let byId: Map<string, Recipe>;

beforeAll(() => {
  raw = loadRawData();
  const equipmentIds = new Set(
    (raw.utensilios.equipos as Array<{ id: string }>).map((e) => e.id),
  );
  recipes = transformRecipes(raw, equipmentIds);
  byId = new Map(recipes.map((r) => [r.id, r]));
});

describe('carga', () => {
  test('inventario completo: 84 recetas, 158 ingredientes, 20 nutrientes, 15 reglas', () => {
    expect(raw.sets[1]).toHaveLength(10);
    expect(raw.sets[2]).toHaveLength(20);
    expect(raw.sets[3]).toHaveLength(9);
    expect(raw.sets.P).toHaveLength(45);
    expect(raw.ingredientes).toHaveLength(158);
    expect(raw.nutrientes).toHaveLength(20);
    expect(raw.reglas).toHaveLength(15);
  });
});

describe('unificación de recetas', () => {
  test('produce las 84 recetas', () => {
    expect(recipes).toHaveLength(84);
  });

  test('set 1 queda tipado como salada con estado/ic unificados', () => {
    const r01 = byId.get('r01')!;
    expect(r01.tipo).toBe('salada');
    expect(r01.set_origen).toBe(1);
    expect(r01.estado).toBe('por-probar');
    expect(r01.ic).toBeGreaterThanOrEqual(1);
  });

  test('el budín de chía es dulce, no salado (T12, issue #136)', () => {
    // El set 1 no trae tipo y el pipeline lo asume salado; r10 es un desayuno
    // con banana, kiwi y dátiles. Las otras nueve del set sí son saladas.
    expect(byId.get('r10')!.tipo).toBe('dulce');
    const resto = recipes.filter((r) => r.set_origen === 1 && r.id !== 'r10');
    expect(resto).toHaveLength(9);
    for (const r of resto) expect(r.tipo, r.id).toBe('salada');
  });

  test('una entrada de T12 que repite el tipo derivado rompe el build', () => {
    expect(() => aplicarTipoCurado('r01', 'salada', { r01: { tipo: 'salada' } })).toThrow(
      /no corrige nada/,
    );
    expect(aplicarTipoCurado('r01', 'salada', { r01: { tipo: 'dulce' } })).toBe('dulce');
    expect(aplicarTipoCurado('r01', 'salada', {})).toBe('salada');
  });

  test('T12 solo corrige recetas que existen', () => {
    const ids = new Set(recipes.map((r) => r.id));
    expect(Object.keys(CURATED_TYPES).filter((id) => !ids.has(id))).toEqual([]);
  });

  test('set P conserva estado probada con ic 8', () => {
    const p19 = byId.get('p19')!;
    expect(p19.estado).toBe('probada');
    expect(p19.ic).toBe(8);
  });
});

describe('la lámina de cada receta (T15)', () => {
  test('toda receta sale con su lámina', () => {
    expect(recipes.filter((r) => r.lamina === undefined).map((r) => r.id)).toEqual([]);
  });

  test('una variante sin entrada propia hereda la de su madre', () => {
    const sushi = byId.get('p18')!;
    expect(sushi.variante_de).toBe('r13');
    expect(CURATED_LAMINAS.p18).toBeUndefined();
    expect(sushi.lamina).toBe(byId.get('r13')!.lamina);
  });

  test('una entrada que repite lo que la variante ya hereda rompe el build', () => {
    expect(() => laminaDeReceta('p18', 'r13', { r13: 'arroz', p18: 'arroz' })).toThrow(/no cambia nada/);
    expect(laminaDeReceta('p18', 'r13', { r13: 'arroz', p18: 'soja' })).toEqual({ lamina: 'soja' });
    expect(laminaDeReceta('r13', undefined, {})).toEqual({});
  });

  test('T15 solo nombra recetas que existen', () => {
    const ids = new Set(recipes.map((r) => r.id));
    expect(Object.keys(CURATED_LAMINAS).filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe('porciones (T1)', () => {
  test('numéricas pasan directo', () => {
    expect(byId.get('r01')!.porciones_num).toBeGreaterThan(0);
  });

  test('string con número explícito usa la tabla curada y conserva el display original', () => {
    const p31 = byId.get('p31')!;
    expect(p31.porciones_num).toBe(10);
    expect(p31.porciones_display).toBe('molde 22-25 cm (10 porciones)');
  });

  test('"libre" queda sin porciones (nutrición por 100 g)', () => {
    expect(byId.get('p11')!.porciones_num).toBeNull();
  });
});

describe('preparados (T2/T3)', () => {
  test('hay 11 preparados efectivos, incluido p08 de facto', () => {
    const preparados = recipes.filter((r) => r.es_preparado);
    expect(preparados.map((r) => r.id).sort()).toEqual(
      ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p16', 'p26', 'p27'],
    );
    for (const p of preparados) expect(p.rendimiento_g).toBeGreaterThan(0);
  });

  test('p08 mantiene tipo salada pero es preparado', () => {
    const p08 = byId.get('p08')!;
    expect(p08.tipo).toBe('salada');
    expect(p08.es_preparado).toBe(true);
    expect(p08.rendimiento_g).toBe(750);
  });

  test('la línea fantasma de p19 (maní como queso) referencia p04', () => {
    const p19 = byId.get('p19')!;
    const refs = p19.lineas.filter((l) => l.ref.tipo === 'receta');
    expect(refs).toHaveLength(1);
    expect(refs[0]!.ref.id).toBe('p04');
    expect(refs[0]!.g_aprox).toBe(250);
  });

  test('p22 gana la línea de masa p07 que el dataset omite', () => {
    const p22 = byId.get('p22')!;
    const masa = p22.lineas.find((l) => l.ref.tipo === 'receta' && l.ref.id === 'p07');
    expect(masa?.g_aprox).toBe(370);
  });

  test('p20 referencia p08 solo en la línea de seitán, no en el resto', () => {
    const p20 = byId.get('p20')!;
    const refs = p20.lineas.filter((l) => l.ref.tipo === 'receta');
    expect(refs.map((l) => l.ref.id)).toEqual(['p08']);
    expect(refs[0]!.g_aprox).toBe(200);
  });
});

describe('sustitutos', () => {
  test('68 resolubles a id y 100 de texto libre (66 del dataset + margarina en p31/p39)', () => {
    const all = recipes.flatMap((r) => r.lineas.flatMap((l) => l.sustitutos));
    expect(all.filter((s) => s.tipo === 'id')).toHaveLength(68);
    expect(all.filter((s) => s.tipo === 'texto')).toHaveLength(100);
  });

  test('las líneas migradas a manteca vegana ofrecen margarina como sustituto', () => {
    for (const id of ['p31', 'p39']) {
      const linea = byId.get(id)!.lineas.find((l) => l.ref.tipo === 'receta' && l.ref.id === 'p03');
      expect(linea?.sustitutos).toContainEqual({ tipo: 'id', valor: 'margarina' });
    }
  });
});

describe('referencias de reglas y utensilios (T5)', () => {
  test('R11_no_aplica_es_nori se separa en id + calificador', () => {
    const receta = recipes.find((r) => r.reglas.some((x) => x.id === 'R11' && x.calificador === 'no_aplica_es_nori'));
    expect(receta).toBeDefined();
  });

  test('U2_si_sarten migra de reglas_disparadas a utensilios', () => {
    const conU2 = recipes.filter((r) =>
      r.utensilios.some((u) => u.tipo === 'regla_utensilio' && u.id === 'U2' && u.calificador === 'si_sarten'),
    );
    expect(conU2.length).toBeGreaterThan(0);
    for (const r of recipes) expect(r.reglas.every((x) => x.id.startsWith('R'))).toBe(true);
  });

  test('equipos conocidos quedan tipados como equipo', () => {
    const conEquipo = recipes.filter((r) => r.utensilios.some((u) => u.tipo === 'equipo' && u.id === 'minipimer'));
    expect(conEquipo.length).toBeGreaterThan(0);
  });
});

describe('valores nutricionales', () => {
  test('número puntual colapsa a intervalo min===max', () => {
    expect(toNutrientValue(164)).toEqual({ intervalo: { min: 164, max: 164 } });
  });

  test('rango conserva nota y descarta tipico', () => {
    const v = toNutrientValue({ min: 4, max: 15, tipico: 10, nota: 'depende del suelo' });
    expect(v).toEqual({ intervalo: { min: 4, max: 15 }, nota: 'depende del suelo' });
  });

  test('la levadura nutricional conserva su B12 con min 0 (invariante de seguridad)', () => {
    const lev = transformIngredient(raw.ingredientes.find((i) => i.id === 'levadura_nutricional')!);
    expect(lev.nutrientes.b12_ug?.intervalo.min).toBe(0);
    expect(lev.nutrientes.b12_ug?.nota).toContain('fortificada');
  });
});

describe('nutrientes del catálogo', () => {
  test('los 20 se transforman con clave de ingrediente y ventana', () => {
    const all = raw.nutrientes.map(transformNutrient);
    expect(all).toHaveLength(20);
    const hierro = all.find((n) => n.id === 'hierro')!;
    expect(hierro.clave_ingrediente).toBe('hierro_mg');
    expect(hierro.ventana).toBe('dia');
    expect(hierro.ajuste_vegano?.factor).toBe(1.8);
    const magnesio = all.find((n) => n.id === 'magnesio')!;
    expect(magnesio.ul_nota).toBeDefined(); // el UL de Mg aplica solo a suplementos
  });

  test('los factores veganos que el dataset trae en prosa quedan explícitos (T8)', () => {
    const all = raw.nutrientes.map(transformNutrient);
    const proteina = all.find((n) => n.id === 'proteina')!;
    expect(proteina.ajuste_vegano?.factor).toBe(1.25); // 0.8 g/kg → 1.0 g/kg
    expect(proteina.ajuste_vegano?.factor_de_prosa).toBe(true);
    const omega3 = all.find((n) => n.id === 'omega3')!;
    expect(omega3.ajuste_vegano?.factor).toBe(2); // "duplicar ALA"
    expect(omega3.ajuste_vegano?.factor_de_prosa).toBe(true);
  });

  test('los nutrientes cuya guía vegana no trae número siguen sin factor', () => {
    const all = raw.nutrientes.map(transformNutrient);
    for (const id of ['b12', 'vitd', 'calcio', 'yodo', 'selenio']) {
      expect(all.find((n) => n.id === id)!.ajuste_vegano?.factor).toBeUndefined();
    }
  });

  test('el nombre que promete lo que no se mide se corrige (T11)', () => {
    const all = raw.nutrientes.map(transformNutrient);
    // el dataset dice "Proteína (lisina)", pero la clave es prot_g: proteína total
    expect(all.find((n) => n.id === 'proteina')!.nombre).toBe('Proteína');
  });

  test('los 20 llevan su descripción curada (T10)', () => {
    const all = raw.nutrientes.map(transformNutrient);
    for (const n of all) expect(n.descripcion.length, n.id).toBeGreaterThan(40);
    // el caso que originó la tabla: el nombre "Proteína (lisina)" sin explicar
    expect(all.find((n) => n.id === 'proteina')!.descripcion).toMatch(/lisina/);
  });
});

describe('estacionalidad y conservación', () => {
  test('uva se descarta con aviso (sin ficha de ingrediente)', () => {
    const ids = new Set(raw.ingredientes.map((i) => i.id));
    const { items, descartados } = transformSeasonality(raw.estacionalidad, ids);
    expect(descartados).toEqual(['uva']);
    expect(items).toHaveLength(40);
  });

  test('los 41 items de conservación resuelven a ingredientes, categorías o estado', () => {
    const ids = new Set(raw.ingredientes.map((i) => i.id));
    const items = transformStorage(raw.conservacion, ids);
    expect(items).toHaveLength(41);
    expect(items.find((i) => i.item === 'legumbres_secas')?.aplica.tipo).toBe('categoria');
    expect(items.find((i) => i.item === 'palta_madura')?.aplica).toEqual({ tipo: 'ingrediente', ids: ['palta'] });
    expect(items.find((i) => i.item === 'avena')?.aplica).toEqual({ tipo: 'ingrediente', ids: ['avena'] });
    expect(items.find((i) => i.item === 'caldo_casero')?.aplica.tipo).toBe('estado');
  });
});

describe('pasos (T9)', () => {
  const normalizar = (t: string) =>
    t
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

  /**
   * Un ingrediente está nombrado si alguna palabra de su id aparece en los
   * pasos. Los tokens largos matchean por prefijo de palabra, para tolerar
   * plural y género ("cebolla" en "cebollas de verdeo"); los cortos exigen
   * palabra exacta, o "sal" se daría por nombrado dentro de "salsa".
   */
  const estaNombrado = (ingredienteId: string, pasos: string) =>
    normalizar(ingredienteId)
      .split('_')
      .some((token) =>
        token.length >= 4
          ? new RegExp(`\\b${token}`).test(pasos)
          : new RegExp(`\\b${token}\\b`).test(pasos),
      );

  /** El id vive dentro del token; contarlo daría por nombrado lo que el paso no dice. */
  const sinTokens = (texto: string) => texto.replace(/\{~?[a-z0-9_]+(?:#\d+)?\}/g, ' ');

  const curadas = () => recipes.filter((r) => Object.keys(CURATED_STEPS).includes(r.id));

  test('las 84 recetas tienen pasos curados', () => {
    expect(curadas()).toHaveLength(recipes.length);
  });

  test('ningún paso nombra un código del dataset', () => {
    // Facu: las reglas (R8) y los ids (P04) son ruido para quien cocina.
    for (const r of curadas()) {
      for (const paso of r.pasos) expect(paso, `${r.id}: "${paso}"`).not.toMatch(/\b[rpud]\d{1,2}\b/i);
    }
  });

  test('una entrada de T9 para una receta inexistente rompe el build', () => {
    // El guard vive en transformRecipes; acá se documenta que existe y qué dice.
    expect(() => {
      const ids = new Set(recipes.map((r) => r.id));
      const huerfanas = [...Object.keys(CURATED_STEPS), 'zzz'].filter((id) => !ids.has(id));
      if (huerfanas.length > 0) throw new Error(`T9: pasos curados para recetas que no existen: ${huerfanas.join(', ')}`);
    }).toThrow(/no existen: zzz/);
  });

  test('ninguna baja de 3 pasos', () => {
    for (const r of curadas()) expect(r.pasos.length, r.id).toBeGreaterThanOrEqual(3);
  });

  test('ningún paso es un telegrama', () => {
    for (const r of curadas()) {
      for (const paso of r.pasos) expect(paso.length, `${r.id}: "${paso}"`).toBeGreaterThan(40);
    }
  });

  test('el matcher de ingredientes distingue lo que tiene que distinguir', () => {
    const en = (id: string, texto: string) => estaNombrado(id, normalizar(texto));
    expect(en('curcuma', 'la cucharadita de cúrcuma')).toBe(true); // acento
    expect(en('cebolla_verdeo', 'las 4 cebollas de verdeo')).toBe(true); // plural
    expect(en('sal_yodada', 'la pizca de sal')).toBe(true); // token corto, palabra exacta
    expect(en('sal_yodada', 'las 10 cucharadas de salsa de soja')).toBe(false); // "sal" ≠ "salsa"
    expect(en('jengibre', 'lentejas, cúrcuma y pimienta negra')).toBe(false); // ausente
  });

  test('todo ingrediente imprescindible se nombra en los pasos', () => {
    for (const r of curadas()) {
      const pasos = normalizar(sinTokens(r.pasos.join(' ')));
      const olvidados = r.lineas
        .filter((l) => l.imprescindible && l.ref.tipo === 'ingrediente')
        .map((l) => l.ref.id)
        .filter((id) => !estaNombrado(id, pasos));
      expect(olvidados, r.id).toEqual([]);
    }
  });

  /**
   * Los pasos y los secretos se muestran juntos en el detalle, así que copiar
   * un secreto dentro de un paso hace leer lo mismo dos veces. Pasó en 8 de
   * los 8 del piloto antes de este test: la regla estaba escrita y no alcanzó.
   */
  test('los pasos no se comen los secretos del chef', () => {
    for (const r of curadas()) {
      const pasos = normalizar(r.pasos.join(' ')).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).join(' ');
      for (const secreto of r.secretos_chef) {
        const palabras = normalizar(secreto).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
        for (let i = 0; i + 6 <= palabras.length; i++) {
          const tramo = palabras.slice(i, i + 6).join(' ');
          expect(pasos, `${r.id} repite el secreto: "${tramo}"`).not.toContain(tramo);
        }
      }
    }
  });

});

/**
 * #200: el paso decía «los 400 g de tomate» mientras la lista ya decía 800. El
 * número escrito a mano no sigue al escalador, así que no puede quedar ninguno:
 * o va como token, o el paso no dice la cantidad.
 */
describe('las cantidades de un paso van como token (#200)', () => {
  const linea = (id: string, cantidad: number, unidad_display: string, paso: number, g_aprox = cantidad): Line => ({
    ref: { tipo: 'ingrediente', id },
    cantidad,
    unidad_display,
    g_aprox,
    sustitutos: [],
    paso,
  });

  const validar = (pasos: string[], lineas: Line[]) => () => validarPasos('rXX', pasos, lineas, true);

  test('un token que no es línea de ese paso rompe el build', () => {
    expect(validar(['Agregar {perejil} de perejil.'], [linea('tomate', 400, 'g', 0)])).toThrow(
      /\{perejil\} no es una línea de ese paso/,
    );
    expect(validar(['Agregar {tomate} de tomate.', 'Servir.'], [linea('tomate', 400, 'g', 1)])).toThrow(
      /no es una línea de ese paso/,
    );
  });

  test('una unidad que no se sabe decir no se puede tokenizar', () => {
    expect(validar(['Picar {cebolla} de cebolla.'], [linea('cebolla', 1, 'grande', 0, 250)])).toThrow(
      /no se sabe decir en prosa/,
    );
  });

  test('dos líneas del mismo ingrediente en un paso obligan a desambiguar', () => {
    const dos = [linea('aceitunas', 100, 'g', 0), linea('aceitunas', 50, 'g', 0)];
    expect(validar(['Sumar {aceitunas} de aceitunas.'], dos)).toThrow(/es ambiguo/);
    expect(validar(['Sumar {aceitunas#2} de aceitunas.'], dos)).not.toThrow();
  });

  test('una medida escrita a mano rompe el build, sea o no de una línea', () => {
    expect(validar(['Agregar los 400 g de tomate.'], [linea('tomate', 400, 'g', 0)])).toThrow(
      /"400 g" es una medida escrita/,
    );
    // El agua no es línea de la receta y el número igual no escala: al doble, el
    // paso pide la mitad de lo que hace falta.
    expect(validar(['Cubrir con 600 ml de agua.'], [linea('lentejas', 250, 'g', 0)])).toThrow(
      /"600 ml" es una medida escrita/,
    );
  });

  test('un número sin unidad que es una cantidad del paso también rompe', () => {
    expect(validar(['Picar las 2 zanahorias.'], [linea('zanahoria', 2, 'mediana', 0, 140)])).toThrow(
      /es una cantidad de ese paso y quedó escrito/,
    );
  });

  test('los tiempos y las temperaturas no son cantidades', () => {
    expect(validar(['Hornear 20 minutos a 180 °C.'], [linea('harina', 20, 'g', 0, 180)])).not.toThrow();
    expect(validar(['Batir 2 a 3 minutos.'], [linea('azucar', 3, 'cda', 0)])).not.toThrow();
    expect(validar(['Dejar 2 horas.'], [linea('sal', 2, 'cdta', 0)])).not.toThrow();
  });

  test('una receta sin tokenizar no puede llevar tokens', () => {
    expect(() => validarPasos('rXX', ['Agregar {tomate}.'], [linea('tomate', 400, 'g', 0)], false)).toThrow(
      /no está en RECETAS_CON_PASOS_TOKENIZADOS/,
    );
  });

  test('las recetas ya migradas de la semilla pasan las cuatro validaciones', () => {
    const migradas = recipes.filter((r) => r.pasos_escalables);
    expect(migradas.length).toBeGreaterThan(0);
    for (const r of migradas) expect(() => validarPasos(r.id, r.pasos, r.lineas, true), r.id).not.toThrow();
  });

  test('ninguna receta sin migrar tiene tokens sueltos', () => {
    for (const r of recipes.filter((r) => !r.pasos_escalables)) {
      for (const paso of r.pasos) expect(paso, r.id).not.toMatch(/\{~?[a-z0-9_]+(?:#\d+)?\}/);
    }
  });
});
