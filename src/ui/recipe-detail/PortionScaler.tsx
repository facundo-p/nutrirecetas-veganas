import type { AvisoEscalado } from '../../domain/scaling';
import { FACTOR_MAX, FACTOR_MIN } from '../../domain/scaling';
import { formatNumber } from '../common/format';
import { IconPlato, IconReloj } from '../icons/icons';

/**
 * Selector de porciones. El escalado es lineal (decisión de Facu), pero la
 * cocina no lo es: los avisos aparecen acá mismo, no escondidos al final.
 */

interface Props {
  porcionesBase: number | null;
  factor: number;
  onFactor: (factor: number) => void;
  avisos: AvisoEscalado[];
}

const ICONO_AVISO = {
  ajustar_a_gusto: IconPlato,
  revisar_tiempo: IconReloj,
  horneado: IconPlato,
} as const;

export function PortionScaler({ porcionesBase, factor, onFactor, avisos }: Props) {
  if (porcionesBase === null) return null;
  const porciones = porcionesBase * factor;
  const paso = porcionesBase >= 8 ? 2 : 1;

  const cambiar = (delta: number) => {
    const siguiente = (porciones + delta) / porcionesBase;
    onFactor(Math.min(FACTOR_MAX, Math.max(FACTOR_MIN, siguiente)));
  };

  return (
    <div className="escalador">
      <div className="escalador-control">
        <span className="campo-etiqueta">Porciones</span>
        <div className="escalador-botones">
          <button
            type="button"
            className="boton-redondo"
            onClick={() => cambiar(-paso)}
            disabled={factor <= FACTOR_MIN}
            aria-label="Menos porciones"
          >
            −
          </button>
          <span className="escalador-valor cifra" aria-live="polite">
            {formatNumber(porciones, porciones % 1 === 0 ? 0 : 1)}
          </span>
          <button
            type="button"
            className="boton-redondo"
            onClick={() => cambiar(paso)}
            disabled={factor >= FACTOR_MAX}
            aria-label="Más porciones"
          >
            +
          </button>
        </div>
        {factor !== 1 && (
          <button type="button" className="boton-enlace" onClick={() => onFactor(1)}>
            volver a {porcionesBase}
          </button>
        )}
      </div>

      {avisos.length > 0 && (
        <ul className="avisos-escalado">
          {avisos.map((aviso) => {
            const Icon = ICONO_AVISO[aviso.tipo];
            return (
              <li key={aviso.tipo} className={`aviso aviso-${aviso.tipo}`}>
                <Icon className="aviso-icono" />
                <span>
                  {aviso.mensaje}
                  {aviso.ingredientes && <strong> {aviso.ingredientes.join(', ')}.</strong>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
