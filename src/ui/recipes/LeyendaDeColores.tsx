import { routeHash } from '../../app/router';
import { CASILLEROS, NOMBRE_CORTO, ORDEN_BARRA } from '../../domain/aporte';
import type { FuenteDeObjetivo } from '../../domain/objetivos';
import { CuadradoDeNutriente } from '../common/CuadradoDeNutriente';

/**
 * Qué es cada color. Dice también lo que la barra no muestra y por qué: sin eso,
 * un yodo ausente se leería como un olvido.
 */
export function LeyendaDeColores({ id, fuente }: { id: string; fuente: FuenteDeObjetivo }) {
  return (
    <div id={id} className="leyenda-colores">
      <ul className="leyenda-nutrientes">
        {ORDEN_BARRA.map((nutriente) => (
          <li key={nutriente}>
            <CuadradoDeNutriente nutrienteId={nutriente} />
            {NOMBRE_CORTO[nutriente]}
          </li>
        ))}
      </ul>
      <p>
        Cada barra muestra los {CASILLEROS} nutrientes que más cubre una porción, en este orden. Lo pintado es cuánto del
        día cubre, sobre{' '}
        {fuente === 'perfil' ? (
          'tu dosis diaria'
        ) : (
          <>
            la <strong>referencia adulta genérica</strong> (<a href={routeHash({ screen: 'profile' })}>completá tu perfil</a>{' '}
            para que sea la tuya)
          </>
        )}
        . Si una receta tiene dato de menos de {CASILLEROS}, los casilleros que sobran quedan vacíos. Todos están en la
        ficha.
      </p>
      <p>
        No aparecen la B12 ni la vitamina D, que no las da la comida, ni el yodo: casi no hay dato de cuánto trae cada
        ingrediente, y un casillero vacío diría que no tiene. Los tres están en{' '}
        <a href={routeHash({ screen: 'nutrients' })}>Nutrientes</a>.
      </p>
    </div>
  );
}
