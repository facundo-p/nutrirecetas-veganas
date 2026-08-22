/**
 * Las dos decisiones puras del paso "mover a Publicado" del release. Viven
 * separadas del comando para poder probarlas sin tocar la API del tablero.
 */

/** Solo cuenta como cierre la forma que GitHub reconoce; una mención suelta no. */
const CIERRE = /\b(?:close[sd]?|fixe?[sd]?|resolve[sd]?|cierra)\s+#(\d+)/gi;

export function issuesQueCierra(log: string): Set<number> {
  return new Set([...log.matchAll(CIERRE)].map((m) => Number(m[1])));
}

export interface ItemDeTablero {
  /** id del item en el tablero, que es lo que hace falta para moverlo */
  id: string;
  numero: number;
  tipo: 'Issue' | 'PullRequest';
  estado: string | null;
  titulo: string;
}

export interface PlanDePublicacion {
  mover: ItemDeTablero[];
  yaEstan: ItemDeTablero[];
  sinTocar: ItemDeTablero[];
}

/**
 * Un issue va a la columna si su cierre ya está en `main`. Los PR quedan afuera
 * por tipo: sus números viven en la misma serie que los issues y coinciden.
 */
export function planDePublicacion(
  items: ItemDeTablero[],
  publicados: Set<number>,
  columna: string,
): PlanDePublicacion {
  const plan: PlanDePublicacion = { mover: [], yaEstan: [], sinTocar: [] };
  for (const item of items) {
    if (item.tipo !== 'Issue' || !publicados.has(item.numero)) plan.sinTocar.push(item);
    else if (item.estado === columna) plan.yaEstan.push(item);
    else plan.mover.push(item);
  }
  return plan;
}
