import { useEffect, useMemo } from 'react';
import { useSession } from '../../app/store';
import { routeHash } from '../../app/router';
import { nutricionSesion } from '../../domain/session';
import { getSeedIndex } from '../../seed';
import { CustomizeStep } from './CustomizeStep';
import { RegisterStep } from './RegisterStep';
import { StepsView } from './StepsView';
import { Informacion } from '../common/Informacion';

/**
 * La sesión de cocina, en tres tiempos: personalizar lo que va a la olla,
 * cocinar con la pantalla despierta, y registrar qué salió y cuánto se comió.
 */
export function CookSession({ recetaId, factor = 1 }: { recetaId: string; factor?: number }) {
  const idx = getSeedIndex();
  const recipe = idx.recipeById.get(recetaId);
  const { recetaId: enCurso, factor: factorEnCurso, lineas, paso, porciones, iniciar } = useSession();

  // Entrar a una receta distinta (o recargar la página) arranca la sesión de cero.
  // Volver con otras porciones también: cambiar la escala es una decisión, y la
  // sesión entera cuelga de ella.
  useEffect(() => {
    if (recipe && (enCurso !== recipe.id || factorEnCurso !== factor)) iniciar(recipe, factor, idx.seed);
  }, [recipe, enCurso, factorEnCurso, factor, iniciar, idx]);

  // Hasta que el efecto de arriba corre, las líneas son las de la sesión anterior.
  const sesionDeEstaReceta = recipe !== undefined && enCurso === recipe.id && factorEnCurso === factor;
  const nutricion = useMemo(() => {
    if (!recipe || !sesionDeEstaReceta) return null;
    return nutricionSesion(lineas, recipe, Math.max(1, porciones), idx);
  }, [recipe, sesionDeEstaReceta, lineas, porciones, idx]);

  if (!recipe) {
    return (
      <>
        <header className="encabezado-pantalla">
          <h1>Receta no encontrada</h1>
        </header>
        <p>
          <a href={routeHash({ screen: 'recipes' })}>Volver al recetario</a>
        </p>
      </>
    );
  }

  if (!nutricion) return <p className="cargando">Preparando la sesión…</p>;

  if (paso === 'pasos') return <StepsView recipe={recipe} />;

  return (
    <article className="sesion-cocina" data-paso={paso}>
      <p className="volver">
        <a href={routeHash({ screen: 'recipe', id: recipe.id })}>‹ {recipe.nombre}</a>
      </p>
      <header className="encabezado-pantalla">
        <div className="fila-con-informacion">
          <span className="etiqueta-seccion">Cocinando</span>
          {paso === 'personalizar' && (
            <Informacion>
              <p>
                Desmarcá lo que no tenés, sustituí lo que quieras cambiar y agregá lo que sume. La nutrición se recalcula
                sola.
              </p>
            </Informacion>
          )}
        </div>
        <h1>{paso === 'personalizar' ? 'Qué va a la olla' : 'Registrar la cocción'}</h1>
      </header>

      {paso === 'personalizar' ? (
        <CustomizeStep nutricion={nutricion} />
      ) : (
        <RegisterStep recipe={recipe} nutricion={nutricion} seed={idx.seed} />
      )}
    </article>
  );
}
