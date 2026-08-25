import { useMemo } from 'react';
import { routeHash } from '../../app/router';
import type { Coccion, Consumo, Overlay, Perfil } from '../../db/schema';
import { recomendar } from '../../domain/recomendaciones';
import type { EstadoNutriente } from '../../domain/traffic-light';
import { getSeedIndex } from '../../seed';
import { currentMonth } from '../common/format';
import { nutritionOf } from '../common/nutritionCache';
import { typeInfo, TypeIcon } from '../common/TypeIcon';

interface Props {
  perfil: Perfil;
  estados: EstadoNutriente[];
  cocciones: Coccion[];
  consumos: Consumo[];
  overlays: Overlay[];
}

/**
 * El reverso del semáforo: en vez de qué falta, con qué taparlo. Cada renglón
 * lleva su porqué — una recomendación sin motivo es una orden, y esta app
 * informa.
 */
export function Recomendaciones({ perfil, estados, cocciones, consumos, overlays }: Props) {
  const idx = getSeedIndex();
  const recomendaciones = useMemo(
    () =>
      recomendar({
        idx,
        perfil,
        estados,
        cocciones,
        consumos,
        overlays,
        mes: currentMonth(),
        hoy: new Date(),
        nutricionDe: (id) => nutritionOf(idx, id),
      }),
    [idx, perfil, estados, cocciones, consumos, overlays],
  );

  if (recomendaciones.length === 0) return null;

  return (
    <section className="recomendaciones">
      <h2 className="etiqueta-seccion">Recomendaciones del día</h2>
      <ul className="lista-recomendaciones">
        {recomendaciones.map(({ receta, motivos }) => {
          const { slug, label } = typeInfo(receta);
          return (
            <li key={receta.id} className="tarjeta fila-recomendacion" data-cat={slug}>
              <span className="recomendacion-tipo" title={label}>
                <TypeIcon recipe={receta} />
              </span>
              <span className="recomendacion-textos">
                <a className="recomendacion-nombre" href={routeHash({ screen: 'recipe', id: receta.id })}>
                  {receta.nombre}
                </a>
                {/* dos motivos y no uno: con el primero solo, el aporte nutricional
                    —que es el criterio que más pesa— casi nunca llega a verse */}
                {motivos.length > 0 && (
                  <span className="recomendacion-motivo">{motivos.slice(0, 2).join(' · ')}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
