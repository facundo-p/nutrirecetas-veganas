import type { Coccion, Consumo, Overlay, Perfil } from '../db/schema';
import type { SeedIndex } from '../seed';
import type { Nutrient, Recipe } from '../seed/schema';
import { midpoint } from './interval';
import { hasReportableValue, per100g, perPortion, type RecipeNutrition } from './nutrition';
import { estacionDeReceta } from './season';
import type { EstadoNutriente } from './traffic-light';

/**
 * Qué cocinar. El semáforo dice qué falta; esto dice con qué taparlo.
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
  perfil: Perfil;
  /** El semáforo ya calculado por la pantalla: de acá salen los huecos. */
  estados: EstadoNutriente[];
  cocciones: Coccion[];
  consumos: Consumo[];
  overlays: Overlay[];
  /** 1-12. Entra por parámetro: el dominio no lee el reloj. */
  mes: number;
  hoy: Date;
  /** Inyectada para no meter el cache de la UI adentro del dominio. */
  nutricionDe: (recetaId: string) => RecipeNutrition;
}

/** Un nutriente que el semáforo marca en falta, con cuánto falta y cuánto pesa. */
interface Hueco {
  nutriente: Nutrient;
  ventana: 'dia' | 'semana';
  /** Lo que falta para el objetivo de la ventana, en la unidad del nutriente. */
  faltante: number;
  peso: number;
}

export interface ContextoRecomendacion extends EntradaRecomendacion {
  readonly huecos: Hueco[];
  readonly ultimaCoccion: Map<string, number>;
  readonly overlayDe: Map<string, Overlay>;
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
 * que una que convence a los cinco: un promedio sobre poco peso se va a los
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
/** Un nutriente crítico pesa el doble que uno importante. */
const PESO_CRITICO = 2;
/** Y el que el usuario destacó, un poco más todavía. */
const PESO_DESTACADO = 1.5;

// ─────────────────────────── los criterios ───────────────────────────

const huecoNutricional: Criterio = {
  id: 'hueco-nutricional',
  descripcion: 'cuánto tapa de lo que el semáforo marca en falta',
  evaluar(receta, ctx) {
    if (ctx.huecos.length === 0) return null;
    const nutricion = porPorcion(ctx.nutricionDe(receta.id));

    let cubierto = 0;
    let total = 0;
    let mejor: { hueco: Hueco; fraccion: number } | null = null;

    for (const hueco of ctx.huecos) {
      total += hueco.peso;
      const aporte = nutricion.por_nutriente[hueco.nutriente.clave_ingrediente];
      // Sin dato no suma. Sacarlo también del denominador haría que una receta
      // de la que no sabemos nada puntúe perfecto por tapar el único hueco que
      // sí conocemos: recomendaríamos por ignorancia.
      if (aporte === undefined || !hasReportableValue(aporte)) continue;
      const fraccion = Math.min(1, midpoint(aporte.intervalo) / hueco.faltante);
      cubierto += hueco.peso * fraccion;
      if (fraccion > 0 && (mejor === null || fraccion * hueco.peso > mejor.fraccion * mejor.hueco.peso)) {
        mejor = { hueco, fraccion };
      }
    }

    if (total === 0) return null;
    const puntaje = cubierto / total;
    if (mejor === null) return { puntaje: 0, motivo: '' };
    // "del hueco de X" y no "del X que falta": los nombres de nutriente mezclan
    // géneros (el hierro, la proteína) y el artículo salía mal la mitad de las veces
    const cuando = mejor.hueco.ventana === 'dia' ? 'de hoy' : 'de la semana';
    const pct = Math.round(mejor.fraccion * 100);
    return { puntaje, motivo: `tapa el ${pct} % del hueco de ${enMinuscula(mejor.hueco.nutriente.nombre)} ${cuando}` };
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

export const CRITERIOS: Criterio[] = [huecoNutricional, favoritas, novedad, deEstacion, puntaje];

export const PESOS_POR_DEFECTO: Record<string, number> = {
  'hueco-nutricional': 0.4,
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

function huecosDe(estados: EstadoNutriente[], perfil: Perfil, idx: SeedIndex): Hueco[] {
  const huecos: Hueco[] = [];
  for (const estado of estados) {
    // 'sin_datos' es "no sabemos", no "falta"; el suplemento apaga la exigencia
    // alimentaria (invariante 4).
    if (estado.estado !== 'insuficiente' && estado.estado !== 'parcial') continue;
    const nutriente = idx.nutrientById.get(estado.nutriente_id);
    if (nutriente === undefined) continue;
    const faltante = estado.objetivo - midpoint(estado.consumido);
    if (faltante <= 0) continue;
    const peso =
      ((100 - estado.porcentaje) / 100) *
      (nutriente.grupo === 'critico' ? PESO_CRITICO : 1) *
      (perfil.nutrientes_destacados.includes(estado.nutriente_id) ? PESO_DESTACADO : 1);
    huecos.push({ nutriente, ventana: estado.ventana, faltante, peso });
  }
  return huecos;
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
    huecos: huecosDe(entrada.estados, entrada.perfil, entrada.idx),
    ultimaCoccion,
    overlayDe: new Map(entrada.overlays.map((o) => [o.receta_id, o])),
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
 * ingredientes, así que ganan por novedad y estación cuando todavía no hay
 * historial que le dé de comer al hueco nutricional.
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
