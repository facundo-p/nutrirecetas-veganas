import type { Recipe } from '../../seed/schema';
import {
  IconBandeja,
  IconEspiga,
  IconFlor,
  IconFrasco,
  IconFrascoFermento,
  IconMortero,
  type IconProps,
} from '../icons/icons';

/**
 * Categoría de receta: el ícono y el color del título hablan el mismo idioma (04 §3).
 * El tipo lo comunican ícono y color — jamás un reborde lateral en la tarjeta.
 * El combo comparte color con las saladas: es un plato salado y hay una sola receta.
 */

const BY_TYPE = {
  salada: { Icon: IconMortero, slug: 'principal', label: 'salada' },
  combo: { Icon: IconBandeja, slug: 'principal', label: 'combo' },
  dulce: { Icon: IconFlor, slug: 'dulce', label: 'dulce' },
  pan: { Icon: IconEspiga, slug: 'pan', label: 'pan / masa' },
  preparado: { Icon: IconFrasco, slug: 'preparado', label: 'preparado' },
  conserva: { Icon: IconFrascoFermento, slug: 'conserva', label: 'conserva / fermento' },
} as const;

export function typeInfo(recipe: Pick<Recipe, 'tipo' | 'es_preparado'>) {
  // p08 es preparado de facto: el frasco manda sobre el mortero
  const { Icon, slug, label } = recipe.es_preparado ? BY_TYPE.preparado : BY_TYPE[recipe.tipo];
  return { Icon, slug, label };
}

/**
 * El color no se pasa inline: el ícono lo hereda del `data-cat` de su tarjeta
 * vía `--cat-actual` (ver temas/categorias.css). Así el tema decide el color y
 * el componente solo dice qué significa.
 */
export function TypeIcon({
  recipe,
  className,
  ...props
}: IconProps & { recipe: Pick<Recipe, 'tipo' | 'es_preparado'> }) {
  const { Icon } = typeInfo(recipe);
  return <Icon className={['icono-tipo', className].filter(Boolean).join(' ')} {...props} />;
}
