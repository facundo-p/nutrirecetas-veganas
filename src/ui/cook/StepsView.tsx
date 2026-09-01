import { useSession } from '../../app/store';
import type { Recipe } from '../../seed/schema';
import { useWakeLock } from './useWakeLock';

/**
 * Paso 2: la mesada. Tipografía grande, un paso por vez, targets enormes y la
 * pantalla que no se apaga. Acá las manos están ocupadas y quizá con harina.
 */
export function StepsView({ recipe }: { recipe: Recipe }) {
  const { pasoActual, avanzarPaso, irA } = useSession();
  useWakeLock(true);

  const total = recipe.pasos.length;
  const esUltimo = pasoActual >= total - 1;
  /**
   * Todos los secretos juntos y solo en el primer paso. Antes se mostraba
   * `secretos_chef[pasoActual]`: dos arrays sin ninguna relación semántica
   * apareados por índice, así que en r18 el paso de las lentejas mostraba el
   * secreto del tadka. Son consejos de técnica sobre la receta entera y se leen
   * antes de arrancar, no a mitad de camino.
   */
  const secretos = pasoActual === 0 ? recipe.secretos_chef : [];

  return (
    <div className="modo-coccion">
      <p className="coccion-progreso">
        Paso {pasoActual + 1} de {total}
      </p>
      <p className="coccion-paso">{recipe.pasos[pasoActual]}</p>

      {secretos.length > 0 && (
        <aside className="coccion-secreto">
          <span className="etiqueta-seccion">
            {secretos.length === 1 ? 'Secreto del chef' : 'Secretos del chef'}
          </span>
          {secretos.map((secreto) => (
            <p key={secreto}>{secreto}</p>
          ))}
        </aside>
      )}

      <div className="coccion-acciones">
        <button
          type="button"
          className="boton-secundario boton-grande"
          onClick={() => avanzarPaso(-1, total)}
          disabled={pasoActual === 0}
        >
          Anterior
        </button>
        {esUltimo ? (
          <button type="button" className="boton-principal boton-grande" onClick={() => irA('registrar')}>
            Terminé de cocinar
          </button>
        ) : (
          <button type="button" className="boton-principal boton-grande" onClick={() => avanzarPaso(1, total)}>
            Siguiente
          </button>
        )}
      </div>

      <button type="button" className="boton-enlace" onClick={() => irA('personalizar')}>
        ‹ volver a los ingredientes
      </button>
    </div>
  );
}
