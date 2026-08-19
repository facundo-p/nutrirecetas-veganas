import type { Interval } from '../../seed/schema';
import { midpoint } from '../../domain/interval';
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

export function IntervalBand({ intervalo, unidad }: { intervalo: Interval; unidad: string }) {
  const mid = midpoint(intervalo);
  const hasBand = intervalo.max - intervalo.min > 1e-9;
  return (
    <span className="banda">
      <span className="cifra banda-valor">
        {hasBand && <IconBandaAprox className="banda-icono" aria-label="valor aproximado" />}
        {formatNumber(mid, decimals(mid))} {unidad}
      </span>
      {hasBand && (
        <span className="banda-rango">
          entre {formatNumber(intervalo.min, decimals(intervalo.min))} y{' '}
          {formatNumber(intervalo.max, decimals(intervalo.max))}
        </span>
      )}
    </span>
  );
}
