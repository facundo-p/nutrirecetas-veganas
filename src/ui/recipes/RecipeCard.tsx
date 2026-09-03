import type { Recipe } from '../../seed/schema';
import { routeHash } from '../../app/router';
import { difficultyFlames, formatMinutes } from '../common/format';
import { IndiceConfianza } from '../common/IndiceConfianza';
import { TypeIcon, typeInfo } from '../common/TypeIcon';
import {
  IconCopoNieve,
  IconCuchara,
  IconEstrellaBrotada,
  IconLlama,
  IconPlato,
  IconReloj,
  IconTemporada,
} from '../icons/icons';

interface Props {
  recipe: Recipe;
  variantCount?: number;
  inSeason?: boolean;
  onToggleVariants?: () => void;
  variantsOpen?: boolean;
}

export function RecipeCard({ recipe, variantCount = 0, inSeason = false, onToggleVariants, variantsOpen }: Props) {
  const flames = difficultyFlames(recipe.dificultad);
  const total = recipe.tiempo_prep_min + recipe.tiempo_coccion_min;
  const { label, slug, sello } = typeInfo(recipe);
  return (
    <article className="tarjeta tarjeta-receta" data-cat={slug}>
      <a className="tarjeta-receta-cuerpo" href={routeHash({ screen: 'recipe', id: recipe.id })}>
        <span className="tarjeta-receta-tipo" title={label}>
          <TypeIcon recipe={recipe} />
        </span>
        <span className="tarjeta-receta-textos">
          {/* El sello comparte renglón con el título y no se encoge: la
              categoría es lo que ubica la receta de un vistazo. */}
          <span className="tarjeta-receta-titular">
            <span className="tarjeta-receta-nombre">
              {recipe.nombre}
              {recipe.candidata_clasica && <IconEstrellaBrotada className="inline-icono icono-clasica" />}
              {recipe.indulgente && <IconCuchara className="inline-icono icono-indulgente" />}
            </span>
            <span className="sello-categoria">{sello}</span>
          </span>
          <span className="tarjeta-receta-meta">
            <span className="meta-item">
              <IconReloj /> {formatMinutes(total)}
            </span>
            <span className="meta-item" aria-label={`dificultad ${recipe.dificultad}`} title={recipe.dificultad}>
              {Array.from({ length: flames }, (_, i) => (
                <IconLlama key={i} />
              ))}
            </span>
            {recipe.porciones_num !== null && (
              <span className="meta-item">
                <IconPlato /> {recipe.porciones_num}
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
          </span>
          <span className="tarjeta-receta-meta">
            <span className="meta-item">
              <IndiceConfianza ic={recipe.ic} />
            </span>
            {recipe.estado === 'por-probar' && <span className="chip chip-mini">por probar</span>}
          </span>
        </span>
      </a>
      {variantCount > 0 && onToggleVariants && (
        <button type="button" className="tarjeta-receta-variantes" onClick={onToggleVariants} aria-expanded={variantsOpen}>
          {variantsOpen ? '▾' : '▸'} {variantCount} {variantCount === 1 ? 'variante' : 'variantes'}
        </button>
      )}
    </article>
  );
}
