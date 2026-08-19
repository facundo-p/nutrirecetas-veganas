import type { Recipe } from '../../seed/schema';
import { IconBandeja, IconEspiga, IconFlor, IconFrasco, IconMortero, type IconProps } from '../icons/icons';

/**
 * Ícono de tipo de receta coloreado por verdura con rol (04 §3): el tipo lo
 * comunica el ícono — jamás un reborde lateral en la tarjeta.
 */

const BY_TYPE = {
  salada: { Icon: IconMortero, color: 'var(--espinaca)', label: 'salada' },
  dulce: { Icon: IconFlor, color: 'var(--remolacha)', label: 'dulce' },
  pan: { Icon: IconEspiga, color: 'var(--garbanzo)', label: 'pan / masa' },
  preparado: { Icon: IconFrasco, color: 'var(--soja)', label: 'preparado' },
  combo: { Icon: IconBandeja, color: 'var(--berenjena)', label: 'combo' },
} as const;

export function typeInfo(recipe: Pick<Recipe, 'tipo' | 'es_preparado'>) {
  // p08 es preparado de facto: el frasco manda sobre el mortero
  return recipe.es_preparado ? BY_TYPE.preparado : BY_TYPE[recipe.tipo];
}

export function TypeIcon({ recipe, ...props }: IconProps & { recipe: Pick<Recipe, 'tipo' | 'es_preparado'> }) {
  const { Icon, color } = typeInfo(recipe);
  return <Icon style={{ color }} {...props} />;
}
