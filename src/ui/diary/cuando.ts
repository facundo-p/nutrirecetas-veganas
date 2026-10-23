const DIA_MS = 24 * 60 * 60 * 1000;

/** Días de calendario, no de 24 h: lo de anoche a las 23 es «ayer» a las 8. */
function diasDeCalendarioEntre(desde: Date, hasta: Date): number {
  const medianoche = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((medianoche(hasta) - medianoche(desde)) / DIA_MS);
}

/** «hoy», «ayer», «hace N días» en la semana; después, la fecha corta. */
export function cuandoFue(iso: string, hoy: Date = new Date()): string {
  const fecha = new Date(iso);
  const dias = diasDeCalendarioEntre(fecha, hoy);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  const otroAnio = fecha.getFullYear() !== hoy.getFullYear();
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', ...(otroAnio && { year: 'numeric' }) });
}
