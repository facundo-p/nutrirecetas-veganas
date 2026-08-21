import { useState } from 'react';
import { routeHash } from '../../app/router';
import { useCocciones, useConsumos } from '../../db/hooks';
import { addConsumo } from '../../db/repos';
import type { Coccion, Consumo } from '../../db/schema';
import { midpoint } from '../../domain/interval';
import { formatNumber } from '../common/format';
import { IconEscudoB12, IconPlato } from '../icons/icons';

/** El diario: qué se cocinó, qué se cambió y qué se comió de cada cosa. */

function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function CookingCard({ coccion, consumos }: { coccion: Coccion; consumos: Consumo[] }) {
  const [porciones, setPorciones] = useState('1');
  const comidas = consumos.reduce((total, c) => total + c.porciones, 0);
  const sobrantes = Math.max(0, coccion.porciones_rendidas - comidas);
  const kcal = midpoint(coccion.nutricion_porcion.kcal.intervalo);

  const registrar = async () => {
    const cantidad = Math.min(Number(porciones), sobrantes);
    if (cantidad <= 0) return;
    await addConsumo({ coccion_id: coccion.id, fecha: new Date().toISOString(), porciones: cantidad });
  };

  return (
    <article className="tarjeta tarjeta-coccion">
      <header className="coccion-cabecera">
        <a className="coccion-nombre" href={routeHash({ screen: 'recipe', id: coccion.receta_id })}>
          {coccion.receta_nombre}
        </a>
        <span className="coccion-fecha">{fechaLarga(coccion.fecha)}</span>
      </header>

      <p className="coccion-porciones">
        <IconPlato /> rindió {formatNumber(coccion.porciones_rendidas, 1)} · comiste {formatNumber(comidas, 1)}
        {sobrantes > 0 && <> · quedan {formatNumber(sobrantes, 1)}</>}
        <span className="coccion-kcal cifra">{formatNumber(kcal, 0)} kcal/porción</span>
        {coccion.nutricion_porcion.alerta_b12 && (
          <IconEscudoB12 className="inline-icono icono-aviso" aria-label="lleva levadura nutricional" />
        )}
      </p>

      {coccion.factor_escala !== 1 && (
        <p className="coccion-detalle">escalada ×{formatNumber(coccion.factor_escala, 2)}</p>
      )}

      {coccion.variaciones.length > 0 && (
        <ul className="coccion-variaciones">
          {coccion.variaciones.map((v, i) => (
            <li key={i}>
              {v.tipo === 'desmarcado' && `sin ${v.nombre}`}
              {v.tipo === 'sustituido' && `${v.nombre} ${v.detalle}`}
              {v.tipo === 'agregado' && `+ ${v.nombre} (${v.detalle})`}
            </li>
          ))}
        </ul>
      )}

      {coccion.nota && <p className="coccion-nota">«{coccion.nota}»</p>}

      {sobrantes > 0 && (
        <div className="coccion-acciones-sobra">
          <label className="campo-inline">
            <span className="campo-etiqueta">Comí</span>
            <input
              type="number"
              inputMode="decimal"
              min="0.5"
              max={sobrantes}
              step="0.5"
              value={porciones}
              onChange={(e) => setPorciones(e.target.value)}
              aria-label={`Porciones comidas de ${coccion.receta_nombre}`}
            />
          </label>
          <button type="button" className="boton-chico" onClick={() => void registrar()}>
            Registrar
          </button>
        </div>
      )}
    </article>
  );
}

export function DiaryScreen() {
  const cocciones = useCocciones();
  const consumos = useConsumos();

  if (!cocciones || !consumos) return <p className="cargando">Cargando…</p>;

  const porCoccion = new Map<number, Consumo[]>();
  for (const consumo of consumos) {
    porCoccion.set(consumo.coccion_id, [...(porCoccion.get(consumo.coccion_id) ?? []), consumo]);
  }

  return (
    <>
      <header className="encabezado-pantalla">
        <span className="etiqueta-seccion">Diario</span>
        <h1>Lo que cocinaste</h1>
      </header>

      <p className="enlaces-secundarios">
        <a href={routeHash({ screen: 'profile' })}>Mi perfil</a> ·{' '}
        <a href={routeHash({ screen: 'glossary' })}>Glosario</a> ·{' '}
        <a href={routeHash({ screen: 'settings' })}>Ajustes y datos</a>
      </p>

      {cocciones.length === 0 ? (
        <p className="intro-vacia">
          Todavía no hay cocciones registradas. Cuando cocines algo del{' '}
          <a href={routeHash({ screen: 'recipes' })}>recetario</a>, va a quedar acá con sus variaciones.
        </p>
      ) : (
        <div className="lista-cocciones">
          {cocciones.map((coccion) => (
            <CookingCard key={coccion.id} coccion={coccion} consumos={porCoccion.get(coccion.id) ?? []} />
          ))}
        </div>
      )}
    </>
  );
}
