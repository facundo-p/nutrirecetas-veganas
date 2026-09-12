import type { Interval } from '../../seed/schema';
import { midpoint, tieneBanda } from '../../domain/interval';
import { formatNumber } from '../common/format';
import { IconBandaAprox } from '../icons/icons';

/**
 * Valor con banda de incertidumbre: punto medio protagonista + rango visible.
 * "El punto medio solo miente si escondés la banda: acá no se esconde."
 */

function decimals(value: number): number {
  if (value >= 100) return 0;
  if (value >= 10) return 1;
  return value > 0 && value < 1 ? 2 : 1;
}

/** Una cifra con los decimales que le corresponden a su tamaño, como en la banda. */
export function cifraDeBanda(valor: number): string {
  return formatNumber(valor, decimals(valor));
}

/** El ícono de "aproximado", solo si hay banda: un valor puntual no tiene nada que aproximar. */
export function MarcaDeAproximado({ intervalo }: { intervalo: Interval }) {
  return tieneBanda(intervalo) ? <IconBandaAprox className="banda-icono" aria-label="valor aproximado" /> : null;
}

export function IntervalBand({ intervalo, unidad }: { intervalo: Interval; unidad: string }) {
  return (
    <span className="banda">
      <span className="cifra banda-valor">
        <MarcaDeAproximado intervalo={intervalo} />
        {cifraDeBanda(midpoint(intervalo))} {unidad}
      </span>
      {tieneBanda(intervalo) && (
        <span className="banda-rango">
          entre {cifraDeBanda(intervalo.min)} y {cifraDeBanda(intervalo.max)}
        </span>
      )}
    </span>
  );
}
