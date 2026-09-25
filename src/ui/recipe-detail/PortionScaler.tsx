import type { AvisoEscalado } from '../../domain/scaling';
import { acotarFactor, FACTOR_MAX, FACTOR_MIN } from '../../domain/scaling';
import { formatGramos, formatNumber } from '../common/format';
import { IconPlato, IconReloj } from '../icons/icons';

interface Props {
  porcionesBase: number | null;
  /** El factor elegido: de él salen los pasos de más y de menos. */
  factor: number;
  /** El factor que se dibuja mientras las cifras viajan hacia `factor`. */
  mostrado: number;
  animando: boolean;
  masaEnLaOlla: number;
  onFactor: (factor: number) => void;
}

const formatPorciones = (porciones: number) => formatNumber(porciones, Number.isInteger(porciones) ? 0 : 1);

/**
 * Cuánto rinde y el control de porciones. Va pegado arriba de la ficha: se lo
 * mira mientras se leen las cantidades.
 */
export function PortionScaler({ porcionesBase, factor, mostrado, animando, masaEnLaOlla, onFactor }: Props) {
  if (porcionesBase === null) return null;
  const porciones = porcionesBase * factor;
  const paso = porcionesBase >= 8 ? 2 : 1;

  const cambiar = (delta: number) => onFactor(acotarFactor((porciones + delta) / porcionesBase));

  return (
    <div className={animando ? 'escalador recalculando' : 'escalador'}>
      <div className="escalador-rinde">
        <span className="escalador-porciones">
          {/* aria-busy mientras viaja: el lector de pantalla espera y anuncia
              solo el número final, no los veinticinco del camino. */}
          <span className="escalador-valor cifra" aria-live="polite" aria-busy={animando}>
            {formatPorciones(porcionesBase * mostrado)}
          </span>{' '}
          porciones
        </span>
        <span className="escalador-masa">
          <span className="cifra">{formatGramos(masaEnLaOlla)}</span> g en la olla
        </span>
      </div>
      <div className="escalador-botones">
        <button
          type="button"
          className="boton-redondo boton-escalador"
          onClick={() => cambiar(-paso)}
          disabled={factor <= FACTOR_MIN}
          aria-label="Menos porciones"
        >
          −
        </button>
        <button
          type="button"
          className="boton-redondo boton-escalador lleno"
          onClick={() => cambiar(paso)}
          disabled={factor >= FACTOR_MAX}
          aria-label="Más porciones"
        >
          +
        </button>
      </div>
      {factor !== 1 && (
        <button type="button" className="boton-enlace escalador-volver" onClick={() => onFactor(1)}>
          volver a {porcionesBase}
        </button>
      )}
    </div>
  );
}

const ICONO_AVISO = {
  revisar_tiempo: IconReloj,
  horneado: IconPlato,
} as const;

/**
 * El escalado es lineal (decisión de Facu), pero la cocina no lo es. Los avisos
 * van abajo de la lista, con las cantidades a la vista, y no en el escalador
 * pegado arriba, que taparía la receta.
 */
export function AvisosDeEscalado({ avisos }: { avisos: AvisoEscalado[] }) {
  if (avisos.length === 0) return null;
  return (
    <ul className="avisos-escalado">
      {avisos.map((aviso) => {
        const Icon = ICONO_AVISO[aviso.tipo];
        return (
          <li key={aviso.tipo} className={`aviso aviso-${aviso.tipo}`}>
            <Icon className="aviso-icono" />
            <span>{aviso.mensaje}</span>
          </li>
        );
      })}
    </ul>
  );
}
