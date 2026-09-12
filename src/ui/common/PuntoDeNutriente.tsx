import { NOMBRE_CORTO, ORDEN_BARRA, type PuntoDeIngrediente } from '../../domain/aporte';

function texto(punto: PuntoDeIngrediente): string {
  if (punto === 'ninguno') return `no trae ninguno de los ${ORDEN_BARRA.length} con color`;
  if (punto === 'condicional') return 'aporte condicional';
  return `trae sobre todo ${NOMBRE_CORTO[punto]}`;
}

/** El punto de la lista de ingredientes: qué nutriente trae sobre todo, con el color de las barras. */
export function PuntoDeNutriente({ punto }: { punto: PuntoDeIngrediente }) {
  const leido = texto(punto);
  return <span className="punto-nutriente" data-nut={punto} role="img" aria-label={leido} title={leido} />;
}
