import { routeHash } from '../../app/router';
import { addConsumo } from '../../db/repos';
import { useCocciones, useConsumos, useOverlays } from '../../db/hooks';
import { IconPlato, IconReloj } from '../icons/icons';
import type { Coccion, Consumo } from '../../db/schema';
import { EncabezadoPantalla } from '../common/EncabezadoPantalla';
import { Recomendaciones } from './Recomendaciones';

/** Cocciones que todavía tienen porciones sin comer. */
function sobrasDe(cocciones: Coccion[], consumos: Consumo[]): Array<{ coccion: Coccion; sobrantes: number }> {
  const comidasPorCoccion = new Map<number, number>();
  for (const consumo of consumos) {
    comidasPorCoccion.set(consumo.coccion_id, (comidasPorCoccion.get(consumo.coccion_id) ?? 0) + consumo.porciones);
  }
  return cocciones
    .map((coccion) => ({
      coccion,
      sobrantes: coccion.porciones_rendidas - (comidasPorCoccion.get(coccion.id) ?? 0),
    }))
    .filter((x) => x.sobrantes > 0.01);
}

export function TodayScreen() {
  const cocciones = useCocciones();
  const consumos = useConsumos();
  const overlays = useOverlays();

  if (!cocciones || !consumos || !overlays) {
    return <p className="cargando">Cargando…</p>;
  }

  const sobras = sobrasDe(cocciones, consumos);
  const ultima = cocciones[0];

  const comerUnaPorcion = async (coccion_id: number, sobrantes: number) => {
    await addConsumo({
      coccion_id,
      fecha: new Date().toISOString(),
      porciones: Math.min(1, sobrantes),
    });
  };

  return (
    <>
      <EncabezadoPantalla etiqueta="Hoy" titulo="¿Qué cocinás?" />

      {sobras.length > 0 && (
        <section className="sobras">
          <h2 className="etiqueta-seccion">Te quedan porciones</h2>
          <ul className="lista-sobras">
            {sobras.map(({ coccion, sobrantes }) => (
              <li key={coccion.id} className="tarjeta fila-sobra">
                <span>
                  <a href={routeHash({ screen: 'recipe', id: coccion.receta_id })}>{coccion.receta_nombre}</a>
                  <span className="sobra-detalle">
                    <IconPlato /> {sobrantes} {sobrantes === 1 ? 'porción' : 'porciones'} · cocinado el{' '}
                    {new Date(coccion.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                  </span>
                </span>
                <button type="button" className="boton-chico" onClick={() => void comerUnaPorcion(coccion.id, sobrantes)}>
                  Comí 1
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Después de las sobras a propósito: antes de sugerir que cocines algo
          nuevo, la app te recuerda que ya tenés comida hecha. */}
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
