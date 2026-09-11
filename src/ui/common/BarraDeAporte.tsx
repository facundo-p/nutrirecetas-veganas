import { franjasDeAporte, NOMBRE_CORTO, type Porcentajes } from '../../domain/aporte';
import { formatPorcentaje } from './format';

/**
 * Los seis nutrientes que más cubre, en orden canónico. Cada casillero es un
 * <svg>: el ancho del relleno es geometría —un atributo— y el color lo pone el
 * CSS por `data-nut`. Es la forma de tener un relleno proporcional sin escribir
 * estilo desde React.
 */
export function BarraDeAporte({ porcentajes }: { porcentajes: Porcentajes }) {
  const franjas = franjasDeAporte(porcentajes);
  const leidas = franjas.flatMap((f) => (f.nutriente ? [`${NOMBRE_CORTO[f.nutriente]} ${formatPorcentaje(f.porcentaje)}`] : []));
  const etiqueta = leidas.length > 0 ? `Cubre del día: ${leidas.join(', ')}` : 'Sin dato de ningún nutriente';

  return (
    <div className="barra-aporte" role="img" aria-label={etiqueta}>
      {franjas.map((f, i) => (
        <svg
          key={f.nutriente ?? `sin-nutriente-${i}`}
          className="franja"
          data-nut={f.nutriente ?? undefined}
          viewBox="0 0 100 1"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect className="franja-fondo" width="100" height="1" />
          {f.nutriente && (
            <>
              <rect className="franja-relleno" width={f.relleno} height="1" />
              <title>{`${NOMBRE_CORTO[f.nutriente]}, cubre el ${formatPorcentaje(f.porcentaje)} del día`}</title>
            </>
          )}
        </svg>
      ))}
    </div>
  );
}
