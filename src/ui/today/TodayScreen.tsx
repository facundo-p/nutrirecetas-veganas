import { useMemo } from 'react';
import { routeHash } from '../../app/router';
import { addConsumo } from '../../db/repos';
import { useCocciones, useConsumos, usePerfil } from '../../db/hooks';
import { porcionesPorVentana, semaforo, type EstadoNutriente } from '../../domain/traffic-light';
import { getSeedIndex } from '../../seed';
import { TrafficLightList } from '../common/TrafficLight';
import { IconPlato, IconReloj } from '../icons/icons';
import type { Coccion, Consumo } from '../../db/schema';
import { EncabezadoPantalla } from '../common/EncabezadoPantalla';

/** Cocciones que todavía tienen porciones sin comer. */
function sobrasDe(cocciones: Coccion[], consumos: Consumo[]): Array<{ coccion: Coccion; sobrantes: number }> {
  const comidasPorCoccion = new Map<number, number>();
  for (const consumo of consumos) {
    comidasPorCoccion.set(consumo.coccion_id, (comidasPorCoccion.get(consumo.coccion_id) ?? 0) + consumo.porciones);
  }
  return cocciones
    .map((coccion) => ({
      coccion,
      sobrantes: coccion.porciones_rendidas - (comidasPorCoccion.get(coccion.id) ?? 0),
    }))
    .filter((x) => x.sobrantes > 0.01);
}

function ordenarDestacados(estados: EstadoNutriente[], destacados: string[]): EstadoNutriente[] {
  if (destacados.length === 0) return estados;
  const peso = (id: string) => {
    const i = destacados.indexOf(id);
    return i === -1 ? destacados.length : i;
  };
  return [...estados].sort((a, b) => peso(a.nutriente_id) - peso(b.nutriente_id));
}

/**
 * Qué se dice cuando la semana no tiene un solo registro. Nunca es un reproche:
 * la app es un apoyo para consultar, no un capataz. Que falten datos es lo
 * normal, y lo único honesto es decir que no sabe.
 */
function SinRegistros({ cocciones, consumos }: { cocciones: Coccion[]; consumos: Consumo[] }) {
  if (cocciones.length === 0) {
    return (
      <p className="intro-vacia">
        Todavía no registraste ninguna cocción. Elegí algo del{' '}
        <a href={routeHash({ screen: 'recipes' })}>recetario</a> y cociná: el semáforo empieza ahí.
      </p>
    );
  }
  if (consumos.length === 0) {
    return (
      <p className="intro-vacia">
        Cocinaste, pero todavía no registraste ninguna porción comida. El semáforo cuenta lo que comés, no lo que
        cocinás: anotá una porción y arranca.
      </p>
    );
  }
  return (
    <p className="intro-vacia">
      Hace más de una semana que no registrás lo que comés, así que el semáforo prefiere callarse: no dice que no
      comiste, dice que no sabe. <a href={routeHash({ screen: 'diary' })}>Ver el diario</a>
    </p>
  );
}

export function TodayScreen() {
  const idx = getSeedIndex();
  const perfil = usePerfil();
  const cocciones = useCocciones();
  const consumos = useConsumos();

  const calculo = useMemo(() => {
    if (!perfil || !cocciones || !consumos) return null;
    const porCoccion = new Map(cocciones.map((c) => [c.id, c]));
    const hoy = new Date();
    return {
      estados: semaforo({ perfil, nutrientes: idx.seed.nutrientes, consumos, cocciones: porCoccion, hoy }),
      porciones: porcionesPorVentana({ consumos, cocciones: porCoccion, hoy }),
    };
  }, [perfil, cocciones, consumos, idx]);

  if (perfil === null) {
    return (
      <>
        <EncabezadoPantalla etiqueta="Hoy" titulo="Primero, contame de vos" />
        <p className="intro-vacia">
          El semáforo compara lo que comés contra objetivos hechos a tu medida: para eso necesito tu edad, tu peso y
          los suplementos que tomás. Sin esos datos preferiría no inventar nada.
        </p>
        <p>
          <a className="boton-principal" href={routeHash({ screen: 'profile' })}>
            Completar mi perfil
          </a>
        </p>
      </>
    );
  }

  if (!perfil || !cocciones || !consumos || !calculo) {
    return <p className="cargando">Cargando…</p>;
  }

  const { estados, porciones } = calculo;
  const destacados = ordenarDestacados(estados, perfil.nutrientes_destacados);
  const delDia = destacados.filter((e) => e.ventana === 'dia');
  const deLaSemana = destacados.filter((e) => e.ventana === 'semana');
  const sobras = sobrasDe(cocciones, consumos);
  const ultima = cocciones[0];

  const comerUnaPorcion = async (coccion_id: number, sobrantes: number) => {
    await addConsumo({
      coccion_id,
      fecha: new Date().toISOString(),
      porciones: Math.min(1, sobrantes),
    });
  };

  return (
    <>
      <EncabezadoPantalla etiqueta="Hoy" titulo="¿Cómo venís?">
        <p className="aviso-alcance">
          El semáforo mide <strong>solo lo que registraste</strong> en la app. Lo que comiste fuera de acá no aparece.
        </p>
      </EncabezadoPantalla>

      {/* Cada bloque vive de su propia ventana: sin registros ahí, se calla.
          Como la ventana del día está adentro de la de la semana, que la semana
          esté en cero implica que el día también. */}
      {porciones.dia > 0 ? (
        <TrafficLightList estados={delDia} titulo="Hoy · se evalúa por día" />
      ) : (
        porciones.semana > 0 && (
          <p className="intro-vacia">
            Hoy todavía no registraste nada, así que lo que se mide por día queda en pausa.
          </p>
        )
      )}
      {porciones.semana > 0 ? (
        <TrafficLightList estados={deLaSemana} titulo="Últimos 7 días · se evalúa por semana" />
      ) : (
        <SinRegistros cocciones={cocciones} consumos={consumos} />
      )}

      {sobras.length > 0 && (
        <section className="sobras">
          <h2 className="etiqueta-seccion">Te quedan porciones</h2>
          <ul className="lista-sobras">
            {sobras.map(({ coccion, sobrantes }) => (
              <li key={coccion.id} className="tarjeta fila-sobra">
                <span>
                  <a href={routeHash({ screen: 'recipe', id: coccion.receta_id })}>{coccion.receta_nombre}</a>
                  <span className="sobra-detalle">
                    <IconPlato /> {sobrantes} {sobrantes === 1 ? 'porción' : 'porciones'} · cocinado el{' '}
                    {new Date(coccion.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                  </span>
                </span>
                <button type="button" className="boton-chico" onClick={() => void comerUnaPorcion(coccion.id, sobrantes)}>
                  Comí 1
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ultima && (
        <section className="ultima-coccion">
          <h2 className="etiqueta-seccion">Última cocción</h2>
          <p>
            <IconReloj className="inline-icono" />{' '}
            <a href={routeHash({ screen: 'recipe', id: ultima.receta_id })}>{ultima.receta_nombre}</a>, el{' '}
            {new Date(ultima.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}.{' '}
            <a href={routeHash({ screen: 'diary' })}>Ver el diario</a>
          </p>
        </section>
      )}
    </>
  );
}
