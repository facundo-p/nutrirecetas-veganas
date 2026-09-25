import type { Recipe } from '../../seed/schema';
import type { EstadoDeReceta } from '../../domain/estado';
import { fuerteDeAporte, NOMBRE_CORTO, type AporteDeReceta } from '../../domain/aporte';
import { ChipDeEstado } from '../common/EstadoDeReceta';
import { routeHash } from '../../app/router';
import { formatMinutes, formatPorcentaje, MEDIDA_DE_BASE } from '../common/format';
import { TypeIcon, typeInfo } from '../common/TypeIcon';
import { Dificultad } from '../common/Dificultad';
import { BarraDeAporte } from '../common/BarraDeAporte';
import { IconCopoNieve, IconCuchara, IconLaurel, IconTemporada } from '../icons/icons';

interface Props {
  recipe: Recipe;
  estado: EstadoDeReceta;
  aporte: AporteDeReceta;
  variantCount?: number;
  inSeason?: boolean;
  onToggleVariants?: () => void;
  variantsOpen?: boolean;
}

/**
 * Una receta del recetario: el nombre, la barra de lo que le da al cuerpo y una
 * línea de datos. Fila y no tarjeta: lo que la hace reconocible es la barra.
 */
export function RecipeCard({
  recipe,
  estado,
  aporte,
  variantCount = 0,
  inSeason = false,
  onToggleVariants,
  variantsOpen,
}: Props) {
  const total = recipe.tiempo_prep_min + recipe.tiempo_coccion_min;
  const { label, sello } = typeInfo(recipe);
  const fuerte = fuerteDeAporte(aporte.porcentajes);
  return (
    <article className="fila-receta">
      <a className="fila-receta-cuerpo" href={routeHash({ screen: 'recipe', id: recipe.id })}>
        <span className="fila-receta-nombre">
          {recipe.nombre}
          {recipe.candidata_clasica && (
            <IconLaurel className="inline-icono icono-clasica" aria-label="candidata a clásica" />
          )}
          {recipe.indulgente && <IconCuchara className="inline-icono icono-indulgente" />}
        </span>
        <BarraDeAporte porcentajes={aporte.porcentajes} />
        <span className="fila-receta-meta">
          <span className="meta-item" title={label}>
            <TypeIcon recipe={recipe} /> {sello}
          </span>
          <span className="meta-item">{formatMinutes(total)}</span>
          <span className="meta-item">
            <Dificultad dificultad={recipe.dificultad} />
          </span>
          <span className="meta-item">
            {recipe.porciones_num !== null ? `rinde ${recipe.porciones_num}` : recipe.porciones_display}
          </span>
          {fuerte && (
            <span className="meta-item meta-fuerte" data-nut={fuerte.nutriente}>
              {NOMBRE_CORTO[fuerte.nutriente]} {formatPorcentaje(fuerte.porcentaje)}
              {aporte.base === '100g' && ` ${MEDIDA_DE_BASE['100g'].por}`}
            </span>
          )}
          {recipe.guarda?.freezer && (
            <span className="meta-item" title="va bien al freezer">
              <IconCopoNieve className="icono-freezer" />
            </span>
          )}
          {inSeason && (
            <span className="meta-item icono-temporada" title="con ingredientes en temporada">
              <IconTemporada /> temporada
            </span>
          )}
          {estado !== 'sin-probar' && <ChipDeEstado estado={estado} />}
        </span>
      </a>
      {variantCount > 0 && onToggleVariants && (
        <button type="button" className="boton-plano fila-receta-variantes" onClick={onToggleVariants} aria-expanded={variantsOpen}>
          {variantsOpen ? '▾' : '▸'} {variantCount} {variantCount === 1 ? 'variante' : 'variantes'}
        </button>
      )}
    </article>
  );
}
