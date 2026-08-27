import type { Coccion, Overlay, Perfil } from '../db/schema';
import type { SeedIndex } from '../seed';
import type { Recipe } from '../seed/schema';
import { per100g, perPortion, type RecipeNutrition } from './nutrition';
import { objetivosDeReferencia, porcentajeDeObjetivo } from './objetivos';
import { estacionDeReceta } from './season';

/**
 * Qué cocinar.
 *
 * Un criterio mira la receta desde un ángulo y devuelve 0..1, o **null** cuando
 * no tiene con qué opinar. `null` no es cero: el criterio se cae del promedio
 * entero, numerador y denominador. Es el invariante 5 aplicado al ranking — sin
 * ninguna receta marcada favorita, el criterio favoritas no hunde a las 84,
 * desaparece.
 *
 * Sumar un criterio es agregar un objeto a CRITERIOS y su peso a
 * PESOS_POR_DEFECTO. No hay registry ni plugins: con 84 recetas y un
 * mantenedor, eso alcanza.
 */

export interface EntradaRecomendacion {
  idx: SeedIndex;
  /** null es válido y frecuente: sin perfil el criterio nutricional se calla. */
  perfil: Perfil | null;
  cocciones: Coccion[];
  overlays: Overlay[];
  /** 1-12. Entra por parámetro: el dominio no lee el reloj. */
  mes: number;
  hoy: Date;
  /** Inyectada para no meter el cache de la UI adentro del dominio. */
  nutricionDe: (recetaId: string) => RecipeNutrition;
}

export interface ContextoRecomendacion extends EntradaRecomendacion {
  readonly ultimaCoccion: Map<string, number>;
  readonly overlayDe: Map<string, Overlay>;
  /** Los nutrientes marcados en el perfil, ya resueltos con su dosis diaria. */
  readonly interesan: Array<{ id: string; nombre: string; objetivo: number; unidad: string }>;
}

export interface Aporte {
  /** 0..1 */
  puntaje: number;
  /** El porqué, en la voz de la app. Solo se muestra si el puntaje es > 0. */
  motivo: string;
}

export interface Criterio {
  id: string;
  /** Qué mira, en una línea. Lo lee quien venga a agregar el próximo. */
  descripcion: string;
  /** null = no tengo con qué opinar de esta receta. */
  evaluar(receta: Recipe, ctx: ContextoRecomendacion): Aporte | null;
}

export interface Recomendacion {
  receta: Recipe;
  puntaje: number;
  /** Ordenados por cuánto aportaron: el primero es la razón más fuerte. */
  motivos: string[];
}

export interface OpcionesRecomendacion {
  pesos?: Record<string, number>;
  criterios?: Criterio[];
  limite?: number;
}

const LIMITE_POR_DEFECTO = 3;
/**
 * Cuánto pesa "no sé" frente a los criterios que sí opinaron, y con qué valor
 * entra. Sin esto, una receta de la que habla un solo criterio saca lo mismo
 * que una que los convence a todos: un promedio sobre poco peso se va a los
 * extremos. Medido sobre la semilla real, dejaba **29 recetas empatadas en 1.0**
 * y el desempate terminaba haciéndolo el orden alfabético.
 *
 * Es encogimiento hacia un valor neutro: cuanto más peso opina, menos tira la
 * duda. No es lo mismo que contar el silencio como cero — un criterio que no
 * opina sigue sin subir ni bajar nada; lo que cambia es cuánta confianza
 * merece un puntaje armado con poca información.
 *
 * La fracción es del peso total, no un absoluto, para que siga significando lo
 * mismo cuando los pesos se puedan configurar.
 */
const FRACCION_DE_DUDA = 0.5;
const PUNTAJE_NEUTRO = 0.5;
/** Días que una receta queda "recién hecha" y no se vuelve a sugerir. */
const DIAS_DE_REPETICION = 14;
/**
 * Qué parte de la dosis diaria alcanza para que una porción puntúe 1 en ese
 * nutriente. Un tercio: son las comidas que tiene un día. Sin esto habría que
 * cubrir el día entero en un plato para sacar puntaje, y casi nada lo hace —
 * el criterio quedaría siempre cerca de cero y no separaría nada.
 */
const FRACCION_DE_UNA_COMIDA = 1 / 3;

// ─────────────────────────── los criterios ───────────────────────────

/**
 * El reemplazo del viejo `hueco-nutricional`, que leía el semáforo. Deja de ser
 * un déficit y pasa a ser una preferencia: no necesita historial, no necesita
 * que registres nada y no reprocha nada. Sin perfil o sin nutrientes marcados
 * devuelve null y se cae del promedio entero.
 */
const ricaEnLoQueTeInteresa: Criterio = {
  id: 'rica-en-lo-que-te-interesa',
  descripcion: 'cuánto aporta de los nutrientes que marcaste en tu perfil',
  evaluar(receta, ctx) {
    if (ctx.interesan.length === 0) return null;
    const nutricion = porPorcion(ctx.nutricionDe(receta.id));

    let suma = 0;
    let cuantosOpinan = 0;
    let mejor: { nombre: string; pct: number } | null = null;

    for (const nutriente of ctx.interesan) {
      const clave = ctx.idx.nutrientById.get(nutriente.id)?.clave_ingrediente;
      if (clave === undefined) continue;
      // `porcentajeDeObjetivo` ya devuelve null sin dato reportable: un
      // nutriente del que no sabemos nada no suma ni resta, se cae del promedio
      const pct = porcentajeDeObjetivo(nutricion.por_nutriente[clave], {
        nutriente_id: nutriente.id,
        nombre: nutriente.nombre,
        valor: nutriente.objetivo,
        unidad: nutriente.unidad,
      });
      if (pct === null) continue;

      cuantosOpinan += 1;
      suma += Math.min(1, pct / 100 / FRACCION_DE_UNA_COMIDA);
      if (mejor === null || pct > mejor.pct) mejor = { nombre: nutriente.nombre, pct };
    }

    if (cuantosOpinan === 0) return null;
    const puntaje = suma / cuantosOpinan;
    if (mejor === null || mejor.pct <= 0) return { puntaje, motivo: '' };
    // "de la dosis de hierro" y no "del hierro": los nombres de nutriente
    // mezclan géneros y el artículo salía mal la mitad de las veces
    return {
      puntaje,
      motivo: `aporta el ${Math.round(mejor.pct)} % de la dosis de ${enMinuscula(mejor.nombre)}`,
    };
  },
};

const favoritas: Criterio = {
  id: 'favoritas',
  descripcion: 'la marcaste favorita',
  evaluar(receta, ctx) {
    return ctx.overlayDe.get(receta.id)?.favorita === true ? { puntaje: 1, motivo: 'la marcaste favorita' } : null;
  },
};

const novedad: Criterio = {
  id: 'novedad',
  descripcion: 'no la probaste todavía, o hace mucho que no la hacés',
  evaluar(receta, ctx) {
    const ultima = ctx.ultimaCoccion.get(receta.id);
    if (ultima !== undefined) {
      const dias = Math.floor((ctx.hoy.getTime() - ultima) / 86_400_000);
      if (dias > DIAS_DE_REPETICION) return null; // ya no es repetir, pero tampoco es novedad
      return { puntaje: 0, motivo: dias === 0 ? 'la cocinaste hoy' : `la cocinaste hace ${dias} días` };
    }
    // `estado` es de la semilla: dice si Facu ya la hizo alguna vez, no si la
    // registró en la app. Sin cocción registrada, es lo único que sabemos.
    return receta.estado === 'por-probar' ? { puntaje: 1, motivo: 'no la probaste todavía' } : null;
  },
};

const deEstacion: Criterio = {
  id: 'de-estacion',
  descripcion: 'qué proporción de sus ingredientes está en pico este mes',
  evaluar(receta, ctx) {
    const estacion = estacionDeReceta(ctx.idx, receta, ctx.mes);
    if (estacion === null) return null;
    const motivo =
      estacion.enPico === 1
        ? 'tiene un ingrediente en su mejor momento'
        : `tiene ${estacion.enPico} ingredientes en su mejor momento`;
    return { puntaje: estacion.proporcion, motivo };
  },
};

const puntaje: Criterio = {
  id: 'puntaje',
  descripcion: 'la confianza que le pusiste al probarla',
  evaluar(receta, ctx) {
    const ic = ctx.overlayDe.get(receta.id)?.ic_usuario;
    if (ic !== undefined) return { puntaje: (ic - 1) / 9, motivo: `le pusiste ${ic} de confianza` };
    // Ojo: `receta.ic` NO entra acá. Mide confianza del dato nutricional, no qué
    // tan rica es la receta; mezclarlos sería mentir con precisión.
    if (receta.candidata_clasica === true) return { puntaje: 0.7, motivo: 'candidata a clásica' };
    return null;
  },
};

export const CRITERIOS: Criterio[] = [ricaEnLoQueTeInteresa, favoritas, novedad, deEstacion, puntaje];

export const PESOS_POR_DEFECTO: Record<string, number> = {
  'rica-en-lo-que-te-interesa': 0.4,
  favoritas: 0.2,
  novedad: 0.15,
  'de-estacion': 0.15,
  puntaje: 0.1,
};

// ─────────────────────────── el motor ───────────────────────────

/** "Vitamina B12" → "vitamina B12": baja la inicial sin tocar las siglas. */
function enMinuscula(nombre: string): string {
  return nombre.charAt(0).toLowerCase() + nombre.slice(1);
}

function porPorcion(n: RecipeNutrition): RecipeNutrition {
  return perPortion(n) ?? per100g(n);
}

/** Un preparado no es una comida, y una variante ya está bajo su madre. */
function esRecomendable(receta: Recipe): boolean {
  return receta.es_preparado !== true && receta.variante_de === undefined;
}

function interesanDe(entrada: EntradaRecomendacion): ContextoRecomendacion['interesan'] {
  const { perfil } = entrada;
  if (perfil === null || perfil.nutrientes_destacados.length === 0) return [];
  const objetivos = objetivosDeReferencia(perfil, entrada.idx.seed.nutrientes, entrada.hoy);
  return perfil.nutrientes_destacados
    .map((id) => objetivos.porNutriente.get(id))
    .filter((o) => o !== undefined)
    .map((o) => ({ id: o.nutriente_id, nombre: o.nombre, objetivo: o.valor, unidad: o.unidad }));
}

function resolver(entrada: EntradaRecomendacion): ContextoRecomendacion {
  const ultimaCoccion = new Map<string, number>();
  for (const coccion of entrada.cocciones) {
    const ms = new Date(coccion.fecha).getTime();
    const previa = ultimaCoccion.get(coccion.receta_id);
    if (previa === undefined || ms > previa) ultimaCoccion.set(coccion.receta_id, ms);
  }
  return {
    ...entrada,
    ultimaCoccion,
    overlayDe: new Map(entrada.overlays.map((o) => [o.receta_id, o])),
    interesan: interesanDe(entrada),
  };
}

export function recomendar(entrada: EntradaRecomendacion, opciones: OpcionesRecomendacion = {}): Recomendacion[] {
  const ctx = resolver(entrada);
  const pesos = opciones.pesos ?? PESOS_POR_DEFECTO;
  const criterios = opciones.criterios ?? CRITERIOS;
  const limite = opciones.limite ?? LIMITE_POR_DEFECTO;
  // relativo al peso total para que siga significando lo mismo si los pesos cambian
  const pesoDeLaDuda = FRACCION_DE_DUDA * criterios.reduce((acc, c) => acc + Math.max(0, pesos[c.id] ?? 0), 0);

  const puntuadas: Recomendacion[] = [];
  for (const receta of entrada.idx.seed.recetas) {
    if (!esRecomendable(receta)) continue;

    let suma = 0;
    let pesoQueOpina = 0;
    const razones: Array<{ motivo: string; aporte: number }> = [];

    for (const criterio of criterios) {
      const peso = pesos[criterio.id] ?? 0;
      if (peso <= 0) continue;
      const aporte = criterio.evaluar(receta, ctx);
      if (aporte === null) continue;
      suma += peso * aporte.puntaje;
      pesoQueOpina += peso;
      if (aporte.puntaje > 0 && aporte.motivo !== '') {
        razones.push({ motivo: aporte.motivo, aporte: peso * aporte.puntaje });
      }
    }

    if (pesoQueOpina === 0) continue;
    puntuadas.push({
      receta,
      puntaje: (suma + pesoDeLaDuda * PUNTAJE_NEUTRO) / (pesoQueOpina + pesoDeLaDuda),
      motivos: razones.sort((a, b) => b.aporte - a.aporte).map((r) => r.motivo),
    });
  }

  const ordenadas = puntuadas
    .filter((r) => r.puntaje > 0)
    // el desempate por nombre mantiene el orden estable entre renders
    .sort((a, b) => b.puntaje - a.puntaje || a.receta.nombre.localeCompare(b.receta.nombre, 'es'));

  return diversificar(ordenadas, limite);
}

/**
 * Tres postres seguidos no son tres recomendaciones: son una repetida. Se toma
 * la mejor de cada tipo antes de repetir tipo, y si no alcanza se completa con
 * las que quedaron. No reordena por puntaje: solo elige a quién le toca.
 *
 * Salió de mirar el render, no de un test: los dulces son cortos y de pocos
 * ingredientes, así que ganan por novedad y estación.
 */
function diversificar(ordenadas: Recomendacion[], limite: number): Recomendacion[] {
  const elegidas: Recomendacion[] = [];
  const tiposUsados = new Set<Recipe['tipo']>();

  for (const candidata of ordenadas) {
    if (elegidas.length === limite) break;
    if (tiposUsados.has(candidata.receta.tipo)) continue;
    tiposUsados.add(candidata.receta.tipo);
    elegidas.push(candidata);
  }
  for (const candidata of ordenadas) {
    if (elegidas.length === limite) break;
    if (!elegidas.includes(candidata)) elegidas.push(candidata);
  }
  return elegidas;
}
