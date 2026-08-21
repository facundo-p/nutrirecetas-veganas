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
  const secreto = recipe.secretos_chef[pasoActual];

  return (
    <div className="modo-coccion">
      <p className="coccion-progreso">
        Paso {pasoActual + 1} de {total}
      </p>
      <p className="coccion-paso">{recipe.pasos[pasoActual]}</p>

      {secreto && (
        <aside className="coccion-secreto">
          <span className="etiqueta-seccion">Secreto del chef</span>
          <p>{secreto}</p>
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
