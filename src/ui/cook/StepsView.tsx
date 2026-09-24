import { useEffect, useMemo, useRef } from 'react';
import { useSession } from '../../app/store';
import { puntoDeLinea } from '../../domain/aporte';
import { nutrientesDeLosPasos, type LineaSesion } from '../../domain/session';
import { getSeedIndex } from '../../seed';
import type { Recipe } from '../../seed/schema';
import { formatCantidad, unidadCompleta } from '../common/format';
import { nutritionOf } from '../common/nutritionCache';
import { PuntoDeNutriente } from '../common/PuntoDeNutriente';
import { useObjetivos } from '../common/useObjetivos';
import { useWakeLock } from './useWakeLock';
import { Informacion } from '../common/Informacion';
import { TextoDePaso } from '../common/TextoDePaso';
import type { LineaDePaso } from '../../domain/pasos';

/**
 * La mesada: la receta entera a la vista y el paso actual abierto, con lo que
 * entra en él. Se lee a un brazo de distancia y se salta de paso de un toque,
 * porque acá las manos están ocupadas y quizá con harina.
 *
 * Cada paso lleva el color del nutriente que más cubre lo que entra en él: al
 * terminar, la barra de progreso es el cromatograma de la cocción.
 */
export function StepsView({ recipe }: { recipe: Recipe }) {
  const idx = getSeedIndex();
  const objetivos = useObjetivos();
  const { lineas, pasoActual, irAPaso, irA } = useSession();
  const pantallaRetenida = useWakeLock(true);
  const pasoAbierto = useRef<HTMLLIElement>(null);

  const colores = useMemo(
    () => nutrientesDeLosPasos(lineas, recipe, idx, objetivos),
    [lineas, recipe, idx, objetivos],
  );

  // El paso nuevo se abre donde estaba el anterior, y puede quedar bajo los controles.
  useEffect(() => {
    pasoAbierto.current?.scrollIntoView?.({ block: 'nearest' });
  }, [pasoActual]);

  const total = recipe.pasos.length;
  const esUltimo = pasoActual === total - 1;

  // Con el id original: el paso se escribió nombrando al ingrediente de la
  // receta, y sustituirlo no cambia ni la cantidad ni el paso donde entra.
  // Lo desmarcado sigue contando: el texto del paso lo nombra igual.
  const lineasDePaso = (indice: number): LineaDePaso[] =>
    lineas
      .filter((linea) => linea.paso === indice)
      .map((linea) => ({
        id: linea.original?.ref.id ?? linea.ref.id,
        cantidad: linea.cantidad,
        unidad_display: linea.unidad_display,
      }));

  return (
    <article className="mesada" data-nut={colores[pasoActual] ?? undefined} aria-label={recipe.nombre}>
      <ol className="mesada-progreso" aria-hidden="true">
        {colores.map((color, i) => (
          <li key={i} className={i > pasoActual ? 'pendiente' : undefined} data-nut={color ?? 'ninguno'} />
        ))}
      </ol>

      <div className="mesada-cabecera">
        <button type="button" className="boton-plano mesada-volver" onClick={() => irA('personalizar')}>
          ‹ Ingredientes
        </button>
        <div className="mesada-acciones">
          <p className="mesada-posicion">
            Paso {pasoActual + 1} de {total}
          </p>
          <Informacion>
            <p>Tocá cualquier paso para saltar a él.</p>
            {pantallaRetenida && <p>La pantalla no se apaga mientras estás acá.</p>}
          </Informacion>
        </div>
      </div>

      <div className="mesada-cuerpo">
        <ol className="mesada-pasos">
          {recipe.pasos.map((texto, i) =>
            i === pasoActual ? (
              <li key={i} ref={pasoAbierto} className="mesada-paso" aria-current="step" data-nut={colores[i] ?? 'ninguno'}>
                <PasoAbierto
                  numero={i + 1}
                  texto={texto}
                  enElTexto={lineasDePaso(i)}
                  lineas={lineas.filter((l) => l.activa && l.paso === i)}
                  // Todos juntos y antes de arrancar: son técnica de la receta
                  // entera. Aparearlos por índice con los pasos fue un bug.
                  secretos={i === 0 ? recipe.secretos_chef : []}
                />
              </li>
            ) : (
              <li key={i} className="mesada-paso" data-nut={colores[i] ?? 'ninguno'}>
                <button type="button" className="boton-plano mesada-salto" onClick={() => irAPaso(i)}>
                  <span className="mesada-salto-numero">{i + 1}</span>{' '}
                  <span>
                    <TextoDePaso texto={texto} lineas={lineasDePaso(i)} />
                  </span>
                </button>
              </li>
            ),
          )}
        </ol>
      </div>

      <div className="mesada-controles">
        <button
          type="button"
          className="boton-plano mesada-atras"
          onClick={() => irAPaso(pasoActual - 1)}
          disabled={pasoActual === 0}
        >
          Atrás
        </button>
        <button
          type="button"
          className="boton-plano mesada-avanzar"
          onClick={() => (esUltimo ? irA('registrar') : irAPaso(pasoActual + 1))}
        >
          {esUltimo ? 'Terminé' : 'Listo, el que sigue'}
        </button>
      </div>
    </article>
  );
}

function PasoAbierto({
  numero,
  texto,
  enElTexto,
  lineas,
  secretos,
}: {
  numero: number;
  texto: string;
  enElTexto: LineaDePaso[];
  lineas: LineaSesion[];
  secretos: string[];
}) {
  const idx = getSeedIndex();
  const objetivos = useObjetivos();
  return (
    <>
      <p className="mesada-paso-numero">Paso {numero}</p>
      <p className="mesada-paso-texto">
        <TextoDePaso texto={texto} lineas={enElTexto} />
      </p>
      {lineas.length > 0 && (
        <ul className="mesada-ingredientes">
          {lineas.map((linea) => (
            <li key={linea.key} className="mesada-ingrediente">
              <PuntoDeNutriente
                punto={puntoDeLinea(idx, linea, objetivos, (recetaId) => nutritionOf(idx, recetaId))}
              />
              <span className="mesada-ingrediente-nombre">{linea.nombre}</span>
              <span className="mesada-ingrediente-cantidad cifra">
                {formatCantidad(linea.cantidad)}{' '}
                <span className="mesada-ingrediente-unidad">{unidadCompleta(linea)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {secretos.length > 0 && (
        <aside className="mesada-secretos">
          <span className="etiqueta-seccion">{secretos.length === 1 ? 'Secreto del chef' : 'Secretos del chef'}</span>
          {secretos.map((secreto) => (
            <p key={secreto}>{secreto}</p>
          ))}
        </aside>
      )}
    </>
  );
}
