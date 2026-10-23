import type { Recipe } from '../../seed/schema';
import {
  IconBandeja,
  IconEspiga,
  IconFlor,
  IconFrasco,
  IconFrascoFermento,
  IconMortero,
} from '../icons/icons';

/**
 * Tipo de receta. Lo dice el ícono —el color es de los nutrientes—, jamás un
 * reborde lateral en la tarjeta.
 */

const BY_TYPE = {
  salada: { Icon: IconMortero, label: 'salada' },
  combo: { Icon: IconBandeja, label: 'combo' },
  dulce: { Icon: IconFlor, label: 'dulce' },
  pan: { Icon: IconEspiga, label: 'pan / masa' },
  preparado: { Icon: IconFrasco, label: 'preparado' },
  conserva: { Icon: IconFrascoFermento, label: 'conserva / fermento' },
} as const;

export function typeInfo(recipe: Pick<Recipe, 'tipo' | 'es_preparado'>) {
  // p08 es preparado de facto: el frasco manda sobre el mortero
  const { Icon, label } = recipe.es_preparado ? BY_TYPE.preparado : BY_TYPE[recipe.tipo];
  return { Icon, label };
}

/** El color lo pone `.icono-tipo` en el CSS: el componente solo dice qué significa. */
export function TypeIcon({ recipe }: { recipe: Pick<Recipe, 'tipo' | 'es_preparado'> }) {
  const { Icon, label } = typeInfo(recipe);
  return <Icon className="icono-tipo" role="img" aria-hidden={false} aria-label={label} />;
}
