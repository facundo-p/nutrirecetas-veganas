import type { Recipe } from '../../seed/schema';
import { routeHash } from '../../app/router';
import { difficultyFlames, formatMinutes, icSprouts } from '../common/format';
import { TypeIcon, typeInfo } from '../common/TypeIcon';
import {
  IconBrotesIc,
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
  const { label } = typeInfo(recipe);
  return (
    <article className="tarjeta tarjeta-receta">
      <a className="tarjeta-receta-cuerpo" href={routeHash({ screen: 'recipe', id: recipe.id })}>
        <span className="tarjeta-receta-tipo" title={label}>
          <TypeIcon recipe={recipe} />
        </span>
        <span className="tarjeta-receta-textos">
          <span className="tarjeta-receta-nombre">
            {recipe.nombre}
            {recipe.candidata_clasica && (
              <IconEstrellaBrotada className="inline-icono" style={{ color: 'var(--garbanzo)' }} />
            )}
            {recipe.indulgente && <IconCuchara className="inline-icono" style={{ color: 'var(--remolacha)' }} />}
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
                <IconCopoNieve style={{ color: 'var(--repollo-colorado)' }} />
              </span>
            )}
            {inSeason && (
              <span className="meta-item" title="con ingredientes en temporada">
                <IconTemporada style={{ color: 'var(--zapallito)' }} />
              </span>
            )}
            <span className="meta-item" title={`índice de confianza ${recipe.ic}/10`}>
              <IconBrotesIc nivel={icSprouts(recipe.ic)} /> IC {recipe.ic}
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
