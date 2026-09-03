import type { ReactNode } from 'react';
import { routeHash } from '../../app/router';
import { IconAjustes } from '../icons/icons';

/**
 * Encabezado de las pantallas de sección, con el acceso a Ajustes colgado a la
 * derecha. Va acá y no en la nav porque los cuatro items con texto ya llenan
 * los 390 px; y va en el flujo, no fijo: un elemento pegado arriba fue
 * exactamente lo que tapaba este acceso hasta el #57.
 *
 * Es un bloque de color a sangre y no texto sobre el papel: `--encabezado` lo
 * pinta, y un tema que no quiera el bloque le pasa su propio papel. Ahí está
 * toda la diferencia entre Mercado y Pizarra en esta pantalla.
 */
export function EncabezadoPantalla({
  etiqueta,
  titulo,
  children,
}: {
  etiqueta: string;
  titulo: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="encabezado-pantalla encabezado-pantalla-con-accion">
      <div className="encabezado-texto">
        <span className="etiqueta-seccion">{etiqueta}</span>
        <h1>{titulo}</h1>
        {children}
      </div>
      <a className="boton-ajustes" href={routeHash({ screen: 'settings' })} aria-label="Ajustes y datos">
        <IconAjustes />
      </a>
    </header>
  );
}
