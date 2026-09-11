import { franjasDeAporte, NOMBRE_CORTO, type Porcentajes } from '../../domain/aporte';
import { formatNumber } from './format';

const legible = (porcentaje: number) => `${formatNumber(porcentaje, porcentaje < 10 ? 1 : 0)} %`;

/**
 * Los seis nutrientes que más cubre, en orden canónico. Cada casillero es un
 * <svg>: el ancho del relleno es geometría —un atributo— y el color lo pone el
 * CSS por `data-nut`. Es la forma de tener un relleno proporcional sin escribir
 * estilo desde React.
 *
 * `mini` es la de la lista de ingredientes: casilleros de ancho fijo.
 */
export function BarraDeAporte({ porcentajes, mini = false }: { porcentajes: Porcentajes; mini?: boolean }) {
  const franjas = franjasDeAporte(porcentajes);
  const leidas = franjas.flatMap((f) => (f.nutriente ? [`${NOMBRE_CORTO[f.nutriente]} ${legible(f.porcentaje)}`] : []));
  const etiqueta = leidas.length > 0 ? `Cubre del día: ${leidas.join(', ')}` : 'Sin dato de ningún nutriente';

  return (
    <div className={mini ? 'barra-aporte barra-aporte-mini' : 'barra-aporte'} role="img" aria-label={etiqueta}>
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
              <title>{`${NOMBRE_CORTO[f.nutriente]}, cubre el ${legible(f.porcentaje)} del día`}</title>
            </>
          )}
        </svg>
      ))}
    </div>
  );
}
