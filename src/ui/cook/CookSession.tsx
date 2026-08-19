import { useEffect, useMemo } from 'react';
import { useSession } from '../../app/store';
import { routeHash } from '../../app/router';
import { nutricionSesion } from '../../domain/session';
import { getSeedIndex } from '../../seed';
import { CustomizeStep } from './CustomizeStep';
import { RegisterStep } from './RegisterStep';
import { StepsView } from './StepsView';

/**
 * La sesión de cocina, en tres tiempos: personalizar lo que va a la olla,
 * cocinar con la pantalla despierta, y registrar qué salió y cuánto se comió.
 */
export function CookSession({ recetaId }: { recetaId: string }) {
  const idx = getSeedIndex();
  const recipe = idx.recipeById.get(recetaId);
  const { recetaId: enCurso, lineas, paso, porciones, iniciar } = useSession();

  // Entrar a una receta distinta (o recargar la página) arranca la sesión de cero.
  useEffect(() => {
    if (recipe && enCurso !== recipe.id) {
      const factorGuardado = Number(new URLSearchParams(window.location.search).get('factor'));
      iniciar(recipe, Number.isFinite(factorGuardado) && factorGuardado > 0 ? factorGuardado : 1, idx.seed);
    }
  }, [recipe, enCurso, iniciar, idx]);

  const nutricion = useMemo(() => {
    if (!recipe || lineas.length === 0) return null;
    return nutricionSesion(lineas, recipe, Math.max(1, porciones), idx);
  }, [recipe, lineas, porciones, idx]);

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

  const titulos = {
    personalizar: 'Qué va a la olla',
    pasos: recipe.nombre,
    registrar: 'Registrar la cocción',
  } as const;

  return (
    <article className="sesion-cocina" data-paso={paso}>
      <p className="volver">
        <a href={routeHash({ screen: 'recipe', id: recipe.id })}>‹ {recipe.nombre}</a>
      </p>
      <header className="encabezado-pantalla">
        <span className="etiqueta-seccion">Cocinando</span>
        <h1>{titulos[paso]}</h1>
        {paso === 'personalizar' && (
          <p className="campo-ayuda">
            Desmarcá lo que no tenés, sustituí lo que quieras cambiar y agregá lo que sume. La nutrición se recalcula sola.
          </p>
        )}
      </header>

      {paso === 'personalizar' && <CustomizeStep nutricion={nutricion} />}
      {paso === 'pasos' && <StepsView recipe={recipe} />}
      {paso === 'registrar' && <RegisterStep recipe={recipe} nutricion={nutricion} seed={idx.seed} />}
    </article>
  );
}
