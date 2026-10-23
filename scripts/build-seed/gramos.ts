import { cabezaDeUnidad } from '../../src/domain/rounding';
import type { Equivalences, Seed } from '../../src/seed/schema';

/**
 * Guardia de coherencia de gramos.
 *
 * `g_aprox` es el único campo del dataset sin método documentado, sin IC, sin
 * rango y sin fuente: se copia literal desde `.artifacts/` y nada lo verifica.
 * Este módulo le busca a cada línea una fila de `equivalencias` contra la cual
 * medirse, y dice en qué estado quedó. No corrige nada — corregir es T16/T17.
 *
 * La regla que lo hace un guardia y no una heurística: ante dos filas que
 * empatan, `ambigua`. Nunca elige en silencio.
 */

export type Familia = 'peso' | 'volumen' | 'pieza' | 'a_ojo' | 'compuesta';

export interface Referencia {
  g_por_medida: number;
  rango?: readonly [number, number];
  /** La clave de la fila elegida: 'taza_crudo', 'diente', 'cda', 'pulpa'. */
  clave: string;
  origen: 'peso_por_volumen' | 'peso_por_unidad' | 'volumen_ml';
  via: 'clave' | 'sufijo' | 'tamano_default' | 'pseudo' | 'derivada_ml' | 'pieza';
  /** El id real, o el pseudo-id si se llegó por ahí. */
  ingrediente_ref: string;
}

export type Veredicto =
  | { estado: 'coherente'; referencia: Referencia }
  | { estado: 'peso_directo' }
  | { estado: 'no_aplica'; motivo: 'compuesta' | 'preparado' }
  | { estado: 'sin_referencia' }
  | { estado: 'ambigua'; candidatas: readonly string[] }
  | { estado: 'divergente'; referencia: Referencia | null; esperado_g: number }
  | { estado: 'incoherente_en_grupo'; tarifa_del_grupo: number; esperado_g: number; pares: number };

export interface LineaAuditada {
  receta_id: string;
  ingrediente_id: string;
  /** `unidad_display` cruda: es la tripleta que indexa las tablas curadas (como T3). */
  unidad: string;
  cantidad: number;
  g_aprox: number;
  familia: Familia;
  veredicto: Veredicto;
}

// ---------- vocabulario de unidades ----------

/** Peso de verdad. `ml` y `cc` NO entran acá: son volumen y necesitan densidad. */
const UNIDADES_DE_PESO = new Set(['g', 'gr', 'gramo', 'gramos']);

const CANTIDADES_A_OJO = new Set([
  'pizca', 'pizcas',
  'chorrito', 'chorritos', 'chorro', 'chorros',
  'gota', 'gotas',
  'puñado', 'puñados', 'punado', 'punados',
  'poquita', 'poquito',
  'cn',
]);

/**
 * El dataset escribe la misma medida de varias formas. Es un mapa propio y no
 * el `ALIAS` de `unidades-decibles.ts`: aquel resuelve cómo se *dice* una
 * unidad en la prosa de un paso, este con qué *se mide*.
 */
const MEDIDA_CANONICA: Record<string, string> = {
  gr: 'g', gramo: 'g', gramos: 'g',
  cc: 'ml',
  cdas: 'cda', cucharada: 'cda', cucharadas: 'cda',
  cdtas: 'cdta', cucharadita: 'cdta', cucharaditas: 'cdta',
  tazas: 'taza', vasos: 'vaso', pocillos: 'pocillo',
};

/** Cabezas que nombran la pieza entera: la caída de una unidad descriptiva. */
const PIEZA_ENTERA = new Set([
  'unidad', 'unidades', 'entera', 'entero', 'chica', 'chico', 'mediana', 'mediano', 'grande', 'grandes',
]);

/** Cuando las candidatas difieren solo por tamaño, la receta quiso la del medio. */
const TAMANO_DEFAULT = ['mediana', 'mediano', 'unidad'];
const PALABRAS_DE_TAMANO = new Set(['chica', 'chico', 'mediana', 'mediano', 'grande', 'grandes']);

/**
 * Ingredientes sin fila propia que toman la de una referencia genérica. Mapa
 * explícito y no `categoria === 'aceite'`: esa regla arrastraría `aceite_coco`
 * (que el dataset mide a 200 g/taza, no 218) y `margarina`. Sumar un id acá es
 * una afirmación —«esto pesa como agua»—, no una inferencia.
 */
export const PSEUDO_ID_DE_INGREDIENTE: Record<string, string> = {
  aceite_oliva: 'aceite',
  aceite_lino: 'aceite',
  agua: 'liquidos_acuosos',
  agua_helada: 'liquidos_acuosos',
  caldo_verduras: 'liquidos_acuosos',
  bebida_soja: 'liquidos_acuosos',
  bebida_vegetal_fortificada: 'liquidos_acuosos',
};

function canonica(cabeza: string): string {
  return MEDIDA_CANONICA[cabeza] ?? cabeza;
}

/** `taza_base + 1.25 relleno` → ['taza','base','1.25','relleno']. */
function tokens(texto: string): string[] {
  return texto.toLowerCase().split(/[\s_()+/,.;:-]+/).filter((t) => t.length > 0);
}

/** `cruda`/`crudo` → `crud`: el dataset y la tabla no coinciden en el género. */
function raiz(token: string): string {
  const sinPlural = token.endsWith('s') ? token.slice(0, -1) : token;
  return /[oa]$/.test(sinPlural) && sinPlural.length > 2 ? sinPlural.slice(0, -1) : sinPlural;
}

export function familiaDeLinea(unidadDisplay: string, mlPorMedida: ReadonlyMap<string, number>): Familia {
  if (unidadDisplay.includes('+')) return 'compuesta';
  const cabeza = canonica(cabezaDeUnidad(unidadDisplay));
  if (UNIDADES_DE_PESO.has(cabeza)) return 'peso';
  if (mlPorMedida.has(cabeza)) return 'volumen';
  if (CANTIDADES_A_OJO.has(cabeza)) return 'a_ojo';
  return 'pieza';
}

/**
 * Medio escalón de `redondearPeso`: por debajo de eso el dataset no podía
 * haber escrito otra cosa. No es tolerancia de exactitud, es el grano con el
 * que están escritos los gramos — el mismo que usa el escalado de la app. Un
 * porcentaje sobre-reporta lo chico (0,7 contra 0,75 g de cúrcuma es 7 % y es
 * redondeo puro) y sub-reporta lo grande (el 8 % del aceite de coco son 18 g
 * por taza, y es sistemático).
 */
export function toleranciaDeRedondeo(esperadoG: number): number {
  const g = Math.abs(esperadoG);
  if (g >= 100) return 5;
  if (g >= 50) return 2.5;
  if (g >= 1) return 0.5;
  return 0.05;
}

// ---------- resolución de fila ----------

interface FilaDeTabla {
  clave: string;
  g: number;
  rango?: readonly [number, number];
  origen: Referencia['origen'];
}

export interface TablasDeConversion {
  porIngrediente: ReadonlyMap<string, readonly FilaDeTabla[]>;
  mlPorMedida: ReadonlyMap<string, number>;
}

export function construirTablas(equivalencias: Equivalences): TablasDeConversion {
  const porIngrediente = new Map<string, FilaDeTabla[]>();
  const agregar = (id: string, fila: FilaDeTabla) => {
    const filas = porIngrediente.get(id);
    if (filas) filas.push(fila);
    else porIngrediente.set(id, [fila]);
  };
  for (const e of equivalencias.peso_por_volumen) {
    agregar(e.ingrediente_id, { clave: e.medida, g: e.g, origen: 'peso_por_volumen' });
  }
  for (const e of equivalencias.peso_por_unidad) {
    const clave = e.tamano ?? e.unidad_real;
    if (clave !== undefined) {
      agregar(e.ingrediente_id, { clave, g: e.g, rango: e.rango, origen: 'peso_por_unidad' });
    }
  }
  const mlPorMedida = new Map<string, number>([['ml', 1]]);
  for (const [medida, v] of Object.entries(equivalencias.volumen_ml)) {
    // `taza_te_ar` mide en tazas de té: su cabeza no puede pisar a `taza`.
    if (!medida.includes('_')) mlPorMedida.set(medida, v.ml);
  }
  return { porIngrediente, mlPorMedida };
}

export type Resolucion = Referencia | { ambigua: readonly string[] } | null;

/** Cómo se llegó a la fila. Lo dice el informe: una inferencia no es una cita. */
type Eleccion = { fila: FilaDeTabla; como: 'clave' | 'sufijo' | 'tamano_default' } | 'ambigua';

function elegir(candidatas: readonly FilaDeTabla[], sufijo: readonly string[]): Eleccion {
  const primera = candidatas[0];
  if (primera === undefined) return 'ambigua';
  if (candidatas.length === 1) return { fila: primera, como: 'clave' };
  const raices = new Set(sufijo.map(raiz));
  const porSufijo = candidatas.filter((f) => {
    const propias = tokens(f.clave).slice(1).map(raiz);
    return propias.length > 0 && propias.every((t) => raices.has(t));
  });
  const unica = porSufijo[0];
  if (porSufijo.length === 1 && unica !== undefined) return { fila: unica, como: 'sufijo' };
  if (porSufijo.length > 1) return 'ambigua';
  const soloTamano = candidatas.every((f) => {
    const propias = tokens(f.clave).slice(1);
    return propias.length === 0 || propias.every((t) => PALABRAS_DE_TAMANO.has(t));
  });
  if (soloTamano) {
    for (const preferida of TAMANO_DEFAULT) {
      const fila = candidatas.find((f) => cabezaDeUnidad(f.clave) === preferida || f.clave === preferida);
      if (fila) return { fila, como: 'tamano_default' };
    }
  }
  return 'ambigua';
}

function resolverEn(
  id: string,
  unidad: string,
  tablas: TablasDeConversion,
  via: Referencia['via'],
): Resolucion {
  const filas = tablas.porIngrediente.get(id);
  if (!filas || filas.length === 0) return null;
  const partes = tokens(unidad);
  const cabeza = canonica(cabezaDeUnidad(unidad));
  const sufijo = partes.slice(1);

  // 1. la cabeza de la clave coincide con la cabeza de la unidad
  const porCabeza = filas.filter((f) => canonica(cabezaDeUnidad(f.clave)) === cabeza);
  if (porCabeza.length > 0) {
    const elegida = elegir(porCabeza, sufijo);
    if (elegida === 'ambigua') return { ambigua: porCabeza.map((f) => f.clave) };
    const { fila, como } = elegida;
    return {
      g_por_medida: fila.g, rango: fila.rango, clave: fila.clave, origen: fila.origen,
      via: via === 'pseudo' && como === 'clave' ? 'pseudo' : como, ingrediente_ref: id,
    };
  }

  // 2. derivar desde la fila `taza` con la equivalencia de volumen
  const ml = tablas.mlPorMedida.get(cabeza);
  if (ml !== undefined) {
    const mlTaza = tablas.mlPorMedida.get('taza');
    const base = filas.filter((f) => canonica(cabezaDeUnidad(f.clave)) === 'taza');
    if (mlTaza !== undefined && base.length > 0) {
      const elegida = elegir(base, sufijo);
      if (elegida !== 'ambigua') {
        return {
          g_por_medida: (elegida.fila.g * ml) / mlTaza, clave: elegida.fila.clave, origen: 'volumen_ml',
          via: 'derivada_ml', ingrediente_ref: id,
        };
      }
    }
    return null;
  }

  // 3. pieza descriptiva: «2 bananas muy maduras» mide bananas, no «muys»
  if (!CANTIDADES_A_OJO.has(cabeza)) {
    const enteras = filas.filter((f) => PIEZA_ENTERA.has(canonica(cabezaDeUnidad(f.clave))));
    if (enteras.length > 0) {
      const nombradas = enteras.filter((f) => tokens(f.clave).some((t) => partes.map(raiz).includes(raiz(t))));
      const elegida = elegir(nombradas.length > 0 ? nombradas : enteras, sufijo);
      if (elegida === 'ambigua') return { ambigua: enteras.map((f) => f.clave) };
      // Siempre `pieza`: la unidad no nombró la fila, la inferimos. El informe
      // lo dice, porque una inferencia se lee distinto que una cita.
      return {
        g_por_medida: elegida.fila.g, rango: elegida.fila.rango, clave: elegida.fila.clave,
        origen: elegida.fila.origen, via: 'pieza', ingrediente_ref: id,
      };
    }
  }
  return null;
}

export function referenciaDeLinea(
  ingredienteId: string,
  unidad: string,
  tablas: TablasDeConversion,
): Resolucion {
  const propia = resolverEn(ingredienteId, unidad, tablas, 'clave');
  if (propia !== null) return propia;
  const pseudo = PSEUDO_ID_DE_INGREDIENTE[ingredienteId];
  return pseudo === undefined ? null : resolverEn(pseudo, unidad, tablas, 'pseudo');
}

// ---------- veredicto ----------

function comparar(referencia: Referencia, cantidad: number, observado: number): Veredicto {
  if (referencia.rango) {
    const [min, max] = referencia.rango;
    if (observado >= min * cantidad - 1e-9 && observado <= max * cantidad + 1e-9) {
      return { estado: 'coherente', referencia };
    }
  }
  const esperado = referencia.g_por_medida * cantidad;
  if (Math.abs(observado - esperado) <= toleranciaDeRedondeo(esperado) + 1e-9) {
    return { estado: 'coherente', referencia };
  }
  return { estado: 'divergente', referencia, esperado_g: esperado };
}

function mediana(valores: readonly number[]): number {
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  const alto = orden[medio] ?? 0;
  return orden.length % 2 === 1 ? alto : ((orden[medio - 1] ?? alto) + alto) / 2;
}

export function auditarGramos(seed: Omit<Seed, 'content_hash'>): LineaAuditada[] {
  const tablas = construirTablas(seed.equivalencias);
  const auditadas: LineaAuditada[] = [];

  for (const receta of seed.recetas) {
    for (const linea of receta.lineas) {
      const familia = familiaDeLinea(linea.unidad_display, tablas.mlPorMedida);
      const base = {
        receta_id: receta.id,
        ingrediente_id: linea.ref.id,
        unidad: linea.unidad_display,
        cantidad: linea.cantidad,
        g_aprox: linea.g_aprox,
        familia,
      };

      if (linea.ref.tipo === 'receta') {
        auditadas.push({ ...base, veredicto: { estado: 'no_aplica', motivo: 'preparado' } });
        continue;
      }
      if (familia === 'compuesta') {
        // `cantidad` describe el primer sumando y `g_aprox` el total: no hay
        // nada contra qué medir hasta que la línea se parta en dos.
        auditadas.push({ ...base, veredicto: { estado: 'no_aplica', motivo: 'compuesta' } });
        continue;
      }
      if (familia === 'peso') {
        const veredicto: Veredicto =
          Math.abs(linea.g_aprox - linea.cantidad) <= toleranciaDeRedondeo(linea.cantidad) + 1e-9
            ? { estado: 'peso_directo' }
            : { estado: 'divergente', referencia: null, esperado_g: linea.cantidad };
        auditadas.push({ ...base, veredicto });
        continue;
      }

      const resolucion = referenciaDeLinea(linea.ref.id, linea.unidad_display, tablas);
      if (resolucion === null) {
        auditadas.push({ ...base, veredicto: { estado: 'sin_referencia' } });
      } else if ('ambigua' in resolucion) {
        auditadas.push({ ...base, veredicto: { estado: 'ambigua', candidatas: resolucion.ambigua } });
      } else {
        auditadas.push({ ...base, veredicto: comparar(resolucion, linea.cantidad, linea.g_aprox) });
      }
    }
  }

  return marcarIncoherenciaDeGrupo(auditadas);
}

/**
 * Coherencia interna, y solo donde no hay referencia: si una línea ya se midió
 * contra la tabla, medirla otra vez contra sus hermanas le daría dos veredictos.
 * La tarifa es la mediana del grupo — sale del dataset, que es la autoridad, y
 * nunca se usa para cambiar un valor, solo para detectar desacuerdo. Con n=2 y
 * desacuerdo se marcan las dos: sin tabla, el guardia no puede decir cuál manda.
 */
function marcarIncoherenciaDeGrupo(auditadas: LineaAuditada[]): LineaAuditada[] {
  const grupos = new Map<string, LineaAuditada[]>();
  for (const linea of auditadas) {
    if (linea.veredicto.estado !== 'sin_referencia' || linea.cantidad <= 0) continue;
    const clave = `${linea.ingrediente_id}|${cabezaDeUnidad(linea.unidad)}`;
    const grupo = grupos.get(clave);
    if (grupo) grupo.push(linea);
    else grupos.set(clave, [linea]);
  }
  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue;
    const tarifa = mediana(grupo.map((l) => l.g_aprox / l.cantidad));
    for (const linea of grupo) {
      const esperado = tarifa * linea.cantidad;
      if (Math.abs(linea.g_aprox - esperado) > toleranciaDeRedondeo(esperado) + 1e-9) {
        linea.veredicto = {
          estado: 'incoherente_en_grupo',
          tarifa_del_grupo: tarifa,
          esperado_g: esperado,
          pares: grupo.length,
        };
      }
    }
  }
  return auditadas;
}

// ---------- resumen ----------

export interface ResumenDeGramos {
  total: number;
  porEstado: Record<Veredicto['estado'], number>;
  porFamilia: Record<Familia, number>;
  conReferencia: number;
  ajustables: number;
}

export function resumenDeGramos(auditadas: readonly LineaAuditada[]): ResumenDeGramos {
  const porEstado = {
    coherente: 0, peso_directo: 0, no_aplica: 0, sin_referencia: 0,
    ambigua: 0, divergente: 0, incoherente_en_grupo: 0,
  } as Record<Veredicto['estado'], number>;
  const porFamilia = { peso: 0, volumen: 0, pieza: 0, a_ojo: 0, compuesta: 0 } as Record<Familia, number>;
  for (const l of auditadas) {
    porEstado[l.veredicto.estado] += 1;
    porFamilia[l.familia] += 1;
  }
  return {
    total: auditadas.length,
    porEstado,
    porFamilia,
    conReferencia: porEstado.coherente + porEstado.peso_directo + porEstado.divergente,
    ajustables: porEstado.divergente + porEstado.ambigua + porEstado.incoherente_en_grupo,
  };
}
