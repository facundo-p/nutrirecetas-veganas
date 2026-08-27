import { routeHash } from '../../app/router';
import { useCocciones, useOverlays } from '../../db/hooks';
import { IconReloj } from '../icons/icons';
import { EncabezadoPantalla } from '../common/EncabezadoPantalla';
import { Recomendaciones } from './Recomendaciones';

export function TodayScreen() {
  const cocciones = useCocciones();
  const overlays = useOverlays();

  if (!cocciones || !overlays) {
    return <p className="cargando">Cargando…</p>;
  }

  const ultima = cocciones[0];

  return (
    <>
      <EncabezadoPantalla etiqueta="Hoy" titulo="¿Qué cocinás?" />

      <Recomendaciones cocciones={cocciones} overlays={overlays} />

      {ultima && (
        <section className="ultima-coccion">
          <h2 className="etiqueta-seccion">Última cocción</h2>
          <p>
            <IconReloj className="inline-icono" />{' '}
            <a href={routeHash({ screen: 'recipe', id: ultima.receta_id })}>{ultima.receta_nombre}</a>, el{' '}
            {new Date(ultima.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}.{' '}
            <a href={routeHash({ screen: 'diary' })}>Ver el diario</a>
          </p>
        </section>
      )}
    </>
  );
}
