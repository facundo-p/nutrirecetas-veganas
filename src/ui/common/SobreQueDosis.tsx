import { routeHash } from '../../app/router';
import type { FuenteDeObjetivo } from '../../domain/objetivos';

/**
 * Contra qué se mide un porcentaje, dicho con todas las letras (invariante 3).
 * Sin perfil invita a completarlo, sin exigirlo. Va dentro de la oración de
 * quien lo usa: «Los porcentajes son sobre …».
 */
export function SobreQueDosis({ fuente }: { fuente: FuenteDeObjetivo }) {
  if (fuente === 'perfil') return <>tu dosis diaria</>;
  return (
    <>
      la <strong>referencia adulta genérica</strong> (<a href={routeHash({ screen: 'profile' })}>completá tu perfil</a>{' '}
      para que sea la tuya)
    </>
  );
}
