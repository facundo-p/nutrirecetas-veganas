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

/**
 * `label` es la forma larga, para el title; `sello` la que entra en el sello de
 * la tarjeta, que a 390 px comparte renglón con el título de la receta.
 */
const BY_TYPE = {
  salada: { Icon: IconMortero, label: 'salada', sello: 'salada' },
  combo: { Icon: IconBandeja, label: 'combo', sello: 'combo' },
  dulce: { Icon: IconFlor, label: 'dulce', sello: 'dulce' },
  pan: { Icon: IconEspiga, label: 'pan / masa', sello: 'pan' },
  preparado: { Icon: IconFrasco, label: 'preparado', sello: 'preparado' },
  conserva: { Icon: IconFrascoFermento, label: 'conserva / fermento', sello: 'conserva' },
} as const;

export function typeInfo(recipe: Pick<Recipe, 'tipo' | 'es_preparado'>) {
  // p08 es preparado de facto: el frasco manda sobre el mortero
  const { Icon, label, sello } = recipe.es_preparado ? BY_TYPE.preparado : BY_TYPE[recipe.tipo];
  return { Icon, label, sello };
}

/** El color lo pone `.icono-tipo` en el CSS: el componente solo dice qué significa. */
export function TypeIcon({ recipe }: { recipe: Pick<Recipe, 'tipo' | 'es_preparado'> }) {
  const { Icon } = typeInfo(recipe);
  return <Icon className="icono-tipo" />;
}
