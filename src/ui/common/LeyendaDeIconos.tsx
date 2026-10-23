import { ICON_CATALOG } from '../icons/catalog';

/**
 * Qué significa cada ícono de una pantalla, para su «i»: a la vista va el ícono
 * solo. Los significados salen del catálogo del Glosario, así no hay dos
 * versiones de lo mismo.
 */
export function LeyendaDeIconos({ ids }: { ids: readonly string[] }) {
  const entradas = ids.flatMap((id) => ICON_CATALOG.filter((entrada) => entrada.id === id));
  return (
    <ul className="leyenda-iconos">
      {entradas.map(({ id, Componente, significado }) => (
        <li key={id}>
          <Componente className="leyenda-iconos-icono" />
          {significado}
        </li>
      ))}
    </ul>
  );
}
