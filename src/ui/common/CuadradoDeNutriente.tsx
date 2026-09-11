import { esNutrienteDeBarra } from '../../domain/aporte';

/**
 * El cuadrado que acompaña el nombre de un nutriente. Con su color si entra a
 * las barras y aporta; hueco si no aporta, y hueco y sin color si no entra.
 */
export function CuadradoDeNutriente({ nutrienteId, aporta = true }: { nutrienteId: string; aporta?: boolean }) {
  const conColor = esNutrienteDeBarra(nutrienteId);
  return (
    <span
      className={conColor && aporta ? 'cuadrado-nutriente' : 'cuadrado-nutriente hueco'}
      data-nut={conColor ? nutrienteId : undefined}
      aria-hidden="true"
    />
  );
}
