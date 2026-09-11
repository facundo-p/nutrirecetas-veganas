import { franjasDeAporte, NOMBRE_CORTO, nutrienteConColor, type Porcentajes } from '../../domain/aporte';
import { formatPorcentaje } from './format';

/**
 * Un casillero. Es un <svg>: el ancho del relleno es geometría —un atributo— y
 * el color lo pone el CSS por `data-nut`. Es la forma de tener un relleno
 * proporcional sin escribir estilo desde React. Un nutriente sin color no lleva
 * `data-nut`, y el CSS decide cómo se llena.
 */
export function FranjaDeNutriente({
  nutrienteId,
  relleno,
  clase,
  titulo,
}: {
  nutrienteId: string | null;
  /** De 0 a 100. `null`: casillero sin relleno. */
  relleno: number | null;
  clase?: string;
  titulo?: string;
}) {
  return (
    <svg
      className={clase ? `franja ${clase}` : 'franja'}
      data-nut={nutrienteId === null ? undefined : nutrienteConColor(nutrienteId)}
      viewBox="0 0 100 1"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect className="franja-fondo" width="100" height="1" />
      {relleno !== null && <rect className="franja-relleno" width={relleno} height="1" />}
      {titulo && <title>{titulo}</title>}
    </svg>
  );
}

/** Los seis nutrientes que más cubre, en orden canónico. */
export function BarraDeAporte({ porcentajes }: { porcentajes: Porcentajes }) {
  const franjas = franjasDeAporte(porcentajes);
  const leidas = franjas.flatMap((f) => (f.nutriente ? [`${NOMBRE_CORTO[f.nutriente]} ${formatPorcentaje(f.porcentaje)}`] : []));
  const etiqueta = leidas.length > 0 ? `Cubre del día: ${leidas.join(', ')}` : 'Sin dato de ningún nutriente';

  return (
    <div className="barra-aporte" role="img" aria-label={etiqueta}>
      {franjas.map((f, i) =>
        f.nutriente ? (
          <FranjaDeNutriente
            key={f.nutriente}
            nutrienteId={f.nutriente}
            relleno={f.relleno}
            titulo={`${NOMBRE_CORTO[f.nutriente]}, cubre el ${formatPorcentaje(f.porcentaje)} del día`}
          />
        ) : (
          <FranjaDeNutriente key={`sin-nutriente-${i}`} nutrienteId={null} relleno={null} />
        ),
      )}
    </div>
  );
}
