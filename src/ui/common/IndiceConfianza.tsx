import { IconBrotesIc } from '../icons/icons';
import { icSprouts } from './format';

/**
 * El índice de confianza, dicho con todas las letras. "IC 8" era una etiqueta
 * que solo entiende quien la escribió — mismo problema que "Proteína (lisina)"
 * (#123): el dato viaja a lugares donde nada la explica.
 *
 * Los brotes se quedan: son una de las firmas propias que el doc de estética
 * pide sostener, y ya codifican el nivel 1-3 con los inactivos al 25 %. El
 * número escrito es el que carga el dato — el invariante 5 pide que la
 * confianza sea legible, no que se adivine de un gráfico.
 *
 * `compacto` es para las filas de nutrientes, donde no entra la frase entera.
 */
export function IndiceConfianza({
  ic,
  compacto = false,
  sufijo,
}: {
  ic: number;
  compacto?: boolean;
  sufijo?: string;
}) {
  return (
    <span className="confianza" title={`índice de confianza ${ic}/10`}>
      <IconBrotesIc nivel={icSprouts(ic)} />
      {compacto ? `${ic}/10` : `confianza ${ic} de 10`}
      {sufijo && <em className="meta-suave">{sufijo}</em>}
    </span>
  );
}
