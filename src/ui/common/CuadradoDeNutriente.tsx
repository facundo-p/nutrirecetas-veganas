import { nutrienteConColor } from '../../domain/aporte';

/**
 * El cuadrado que acompaña el nombre de un nutriente. Con su color si entra a
 * las barras y aporta; hueco si no aporta, y hueco y sin color si no entra.
 */
export function CuadradoDeNutriente({ nutrienteId, aporta = true }: { nutrienteId: string; aporta?: boolean }) {
  const color = nutrienteConColor(nutrienteId);
  return (
    <span className={color && aporta ? 'cuadrado-nutriente' : 'cuadrado-nutriente hueco'} data-nut={color} aria-hidden="true" />
  );
}
