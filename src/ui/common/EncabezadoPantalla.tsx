import type { ReactNode } from 'react';
import { routeHash } from '../../app/router';
import type { LaminaId } from '../../seed/laminas';
import { IconAjustes } from '../icons/icons';
import { Informacion } from './Informacion';
import { Lamina } from './Lamina';

/**
 * Encabezado de las pantallas de sección, con el acceso a Ajustes colgado a la
 * derecha. Va acá y no en la nav porque los cuatro items con texto ya llenan
 * los 390 px; y va en el flujo, no fijo: un elemento pegado arriba fue
 * exactamente lo que tapaba este acceso hasta el #57.
 *
 * `--encabezado` lo pinta a sangre; el tema de hoy le pasa su propio papel.
 * `children` es la bajada, debajo del título. `lamina` es la verdura de la
 * sección, en el aire entre el título y el engranaje. `informacion` es lo que
 * explica la pantalla: va detrás de la «i», junto al engranaje.
 */
export function EncabezadoPantalla({
  etiqueta,
  titulo,
  lamina,
  informacion,
  children,
}: {
  etiqueta?: string;
  titulo: ReactNode;
  lamina?: LaminaId;
  informacion?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="encabezado-pantalla encabezado-pantalla-con-accion">
      {lamina && <Lamina id={lamina} lugar="encabezado" />}
      <div className="encabezado-texto">
        {etiqueta && <span className="etiqueta-seccion">{etiqueta}</span>}
        <h1>{titulo}</h1>
        {children}
      </div>
      <div className="encabezado-acciones">
        {informacion && <Informacion>{informacion}</Informacion>}
        <a className="boton-ajustes" href={routeHash({ screen: 'settings' })} aria-label="Ajustes y datos">
          <IconAjustes />
        </a>
      </div>
    </header>
  );
}
