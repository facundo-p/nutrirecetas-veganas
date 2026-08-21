/**
 * Ventanas de evaluación. Cada nutriente se mide en la suya (invariante 3):
 * el día es el día calendario local, y la semana es **móvil** — los últimos 7
 * días contando hoy. La semana móvil evita el absurdo de que todo aparezca en
 * rojo cada lunes por la mañana.
 */

export interface Ventana {
  desde: Date;
  hasta: Date;
}

export function ventanaDia(hoy: Date): Ventana {
  const desde = new Date(hoy);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(hoy);
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
}

export function ventanaSemanaMovil(hoy: Date): Ventana {
  const { hasta } = ventanaDia(hoy);
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - 6);
  desde.setHours(0, 0, 0, 0);
  return { desde, hasta };
}

export function ventanaDe(ventana: 'dia' | 'semana', hoy: Date): Ventana {
  return ventana === 'dia' ? ventanaDia(hoy) : ventanaSemanaMovil(hoy);
}

/** Cuántos días abarca la ventana: el objetivo diario se multiplica por esto. */
export function diasDeVentana(ventana: 'dia' | 'semana'): number {
  return ventana === 'dia' ? 1 : 7;
}

export function estaEnVentana(fechaIso: string, ventana: Ventana): boolean {
  const fecha = new Date(fechaIso).getTime();
  return fecha >= ventana.desde.getTime() && fecha <= ventana.hasta.getTime();
}
