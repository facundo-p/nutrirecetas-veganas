import type { ComponentType } from 'react';
import { midpoint } from '../../domain/interval';
import type { EstadoNutriente, EstadoSemaforo } from '../../domain/traffic-light';
import { formatNumber } from './format';
import {
  IconCapsula,
  IconHojaCaida,
  IconHojaEntera,
  IconHojaMedia,
  IconHojaPunteada,
  IconSemanaArco,
  IconSol,
  type IconProps,
} from '../icons/icons';

/**
 * El semáforo se lee sin depender del color (regla anti-look-IA 6): cada estado
 * trae su ícono propio y su nombre escrito. El color acompaña, no informa solo.
 */

const POR_ESTADO: Record<EstadoSemaforo, { Icon: ComponentType<IconProps>; texto: string; clase: string }> = {
  cubierto: { Icon: IconHojaEntera, texto: 'cubierto', clase: 'cubierto' },
  parcial: { Icon: IconHojaMedia, texto: 'a medias', clase: 'parcial' },
  insuficiente: { Icon: IconHojaCaida, texto: 'falta', clase: 'insuficiente' },
  cubierto_por_suplemento: { Icon: IconCapsula, texto: 'por suplemento', clase: 'suplemento' },
  sin_datos: { Icon: IconHojaPunteada, texto: 'sin datos', clase: 'sin-datos' },
};

export function TrafficLightPill({ estado }: { estado: EstadoNutriente }) {
  const { Icon, texto, clase } = POR_ESTADO[estado.estado];
  const Ventana = estado.ventana === 'dia' ? IconSol : IconSemanaArco;
  const muestraNumeros = estado.estado !== 'sin_datos' && estado.estado !== 'cubierto_por_suplemento';

  return (
    <li className={`semaforo-item semaforo-${clase}`}>
      <span className="semaforo-icono">
        <Icon />
      </span>
      <span className="semaforo-textos">
        <span className="semaforo-nombre">
          {estado.nombre}
          <Ventana
            className="semaforo-ventana"
            aria-label={estado.ventana === 'dia' ? 'se evalúa por día' : 'se evalúa por semana'}
          />
        </span>
        <span className="semaforo-estado">
          {texto}
          {estado.al_borde && <em className="semaforo-borde"> · al borde</em>}
          {estado.exceso_ul && <em className="semaforo-exceso"> · por encima del límite</em>}
        </span>
      </span>
      {muestraNumeros ? (
        <span className="semaforo-cifras">
          <span className="cifra">{formatNumber(estado.porcentaje, 0)} %</span>
          <span className="semaforo-detalle">
            {formatNumber(midpoint(estado.consumido), 1)}
            {' de '}
            {formatNumber(estado.objetivo, estado.objetivo >= 100 ? 0 : 1)} {estado.unidad}
          </span>
        </span>
      ) : (
        <span className="semaforo-cifras">
          <span className="semaforo-detalle">
            objetivo {formatNumber(estado.objetivo, estado.objetivo >= 100 ? 0 : 1)} {estado.unidad}
          </span>
        </span>
      )}
    </li>
  );
}

export function TrafficLightList({ estados, titulo }: { estados: EstadoNutriente[]; titulo: string }) {
  if (estados.length === 0) return null;
  return (
    <section className="semaforo-bloque">
      <h2 className="etiqueta-seccion">{titulo}</h2>
      <ul className="semaforo-lista">
        {estados.map((estado) => (
          <TrafficLightPill key={estado.nutriente_id} estado={estado} />
        ))}
      </ul>
    </section>
  );
}
