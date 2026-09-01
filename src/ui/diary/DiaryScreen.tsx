import { routeHash } from '../../app/router';
import { useCocciones } from '../../db/hooks';
import type { Coccion } from '../../db/schema';
import { midpoint } from '../../domain/interval';
import { formatNumber } from '../common/format';
import { IconEscudoB12, IconPlato } from '../icons/icons';
import { EncabezadoPantalla } from '../common/EncabezadoPantalla';

/** El diario: qué se cocinó y qué se cambió. Lo que se comió no se registra. */

function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function CookingCard({ coccion }: { coccion: Coccion }) {
  const kcal = midpoint(coccion.nutricion_porcion.kcal.intervalo);

  return (
    <article className="tarjeta tarjeta-coccion">
      <header className="coccion-cabecera">
        <a className="coccion-nombre" href={routeHash({ screen: 'recipe', id: coccion.receta_id })}>
          {coccion.receta_nombre}
        </a>
        <span className="coccion-fecha">{fechaLarga(coccion.fecha)}</span>
      </header>

      <p className="coccion-porciones">
        <IconPlato /> rindió {formatNumber(coccion.porciones_rendidas, 1)}
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
    </article>
  );
}

export function DiaryScreen() {
  const cocciones = useCocciones();

  if (!cocciones) return <p className="cargando">Cargando…</p>;

  return (
    <>
      <EncabezadoPantalla etiqueta="Diario" titulo="Lo que cocinaste" />

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
            <CookingCard key={coccion.id} coccion={coccion} />
          ))}
        </div>
      )}
    </>
  );
}
