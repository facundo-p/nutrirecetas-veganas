import { IconEscudoB12 } from '../icons/icons';

/**
 * Invariante de seguridad del proyecto (CLAUDE.md #6): si la receta usa
 * levadura nutricional como fuente de B12, advertir SIEMPRE que muchas marcas
 * argentinas no están fortificadas. No es cosmético: no se quita.
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
