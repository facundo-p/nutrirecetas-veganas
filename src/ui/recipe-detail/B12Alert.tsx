import { IconEscudoB12 } from '../icons/icons';

/**
 * Invariante 6 de CLAUDE.md: si la receta usa levadura nutricional, la «i» de la
 * ficha explica que muchas marcas argentinas no están fortificadas. En la lista
 * la levadura lleva el punto hueco, y el cálculo la deja en cero.
 */
export function B12Alert() {
  return (
    <aside className="alerta-b12" role="note">
      <IconEscudoB12 className="alerta-b12-icono" />
      <p>
        <strong>Ojo con la B12:</strong> esta receta usa levadura nutricional, pero muchas marcas argentinas{' '}
        <strong>no están fortificadas</strong> con B12. Leé la etiqueta: si no dice B12 agregada, no aporta. La
        suplementación sigue siendo la fuente confiable.
      </p>
    </aside>
  );
}
