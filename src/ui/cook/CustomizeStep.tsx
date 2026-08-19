import { useState } from 'react';
import { useSession } from '../../app/store';
import { advertenciaDesmarcar, type LineaSesion } from '../../domain/session';
import type { RecipeNutrition } from '../../domain/nutrition';
import { midpoint } from '../../domain/interval';
import { getSeedIndex } from '../../seed';
import { formatNumber, normalize } from '../common/format';
import { IconAsterisco, IconSustituir } from '../icons/icons';

/** Paso 1 de la sesión: qué va a la olla hoy. La nutrición se mueve en vivo. */

function LineaEditable({ linea }: { linea: LineaSesion }) {
  const idx = getSeedIndex();
  const { toggleLinea, sustituir } = useSession();
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [mostrarSustitutos, setMostrarSustitutos] = useState(false);

  const resolubles = linea.sustitutos.filter((s) => s.tipo === 'id');
  const textuales = linea.sustitutos.filter((s) => s.tipo === 'texto');

  const alDesmarcar = () => {
    if (linea.activa) {
      const advertencia = advertenciaDesmarcar(linea);
      if (advertencia) {
        setConfirmando(advertencia);
        return;
      }
    }
    toggleLinea(linea.key);
  };

  return (
    <li className={linea.activa ? 'linea-sesion' : 'linea-sesion inactiva'}>
      <label className="linea-sesion-check">
        <input type="checkbox" checked={linea.activa} onChange={alDesmarcar} />
        <span className="linea-sesion-nombre">
          {linea.nombre}
          {linea.imprescindible && (
            <IconAsterisco className="inline-icono icono-imprescindible" aria-label="imprescindible" />
          )}
          {linea.original && <em className="linea-sesion-original"> (en vez de {linea.original.nombre})</em>}
          {linea.agregada && <em className="linea-sesion-original"> (agregado)</em>}
        </span>
        <span className="linea-sesion-cantidad">{formatNumber(linea.g_aprox, 0)} g</span>
      </label>

      {linea.funcion && <p className="linea-funcion">{linea.funcion}</p>}

      {confirmando && (
        <div className="confirmacion" role="alertdialog">
          <p>{confirmando}</p>
          <div className="confirmacion-acciones">
            <button
              type="button"
              className="boton-chico"
              onClick={() => {
                toggleLinea(linea.key);
                setConfirmando(null);
              }}
            >
              Sacarlo igual
            </button>
            <button type="button" className="boton-chico" onClick={() => setConfirmando(null)}>
              Dejarlo
            </button>
          </div>
        </div>
      )}

      {linea.activa && linea.sustitutos.length > 0 && (
        <div className="linea-sustitutos">
          <button type="button" className="boton-enlace" onClick={() => setMostrarSustitutos((v) => !v)}>
            <IconSustituir /> sustituir
          </button>
          {mostrarSustitutos && (
            <div className="sustitutos-opciones">
              {resolubles.map((s) => (
                <button
                  key={s.valor}
                  type="button"
                  className="chip chip-boton"
                  onClick={() => {
                    sustituir(linea.key, { tipo: 'ingrediente', id: s.valor }, idx.seed);
                    setMostrarSustitutos(false);
                  }}
                >
                  {idx.ingredientById.get(s.valor)?.nombre ?? s.valor}
                </button>
              ))}
              {textuales.map((s) => (
                <span key={s.valor} className="chip chip-mini chip-texto" title="sugerencia sin recálculo">
                  {s.valor}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function AgregarIngrediente() {
  const idx = getSeedIndex();
  const { agregar } = useSession();
  const [busqueda, setBusqueda] = useState('');
  const [elegido, setElegido] = useState<string | null>(null);
  const [gramos, setGramos] = useState('');

  const q = normalize(busqueda.trim());
  const resultados =
    q.length < 2
      ? []
      : idx.seed.ingredientes
          .filter((i) => normalize(i.nombre).includes(q) || i.sinonimos.some((s) => normalize(s).includes(q)))
          .slice(0, 6);

  return (
    <div className="agregar-ingrediente">
      <label className="campo">
        <span className="campo-etiqueta">Agregar algo que no está en la receta</span>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setElegido(null);
          }}
          placeholder="Buscar ingrediente…"
          aria-label="Buscar ingrediente para agregar"
        />
      </label>
      {elegido === null ? (
        <div className="sustitutos-opciones">
          {resultados.map((i) => (
            <button key={i.id} type="button" className="chip chip-boton" onClick={() => setElegido(i.id)}>
              {i.nombre}
            </button>
          ))}
        </div>
      ) : (
        <div className="campos-fila">
          <label className="campo">
            <span className="campo-etiqueta">{idx.ingredientById.get(elegido)?.nombre} · gramos</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={gramos}
              onChange={(e) => setGramos(e.target.value)}
              aria-label="Gramos a agregar"
            />
          </label>
          <button
            type="button"
            className="boton-secundario"
            disabled={Number(gramos) <= 0}
            onClick={() => {
              agregar({ tipo: 'ingrediente', id: elegido }, Number(gramos), idx.seed);
              setElegido(null);
              setBusqueda('');
              setGramos('');
            }}
          >
            Agregar
          </button>
        </div>
      )}
    </div>
  );
}

export function CustomizeStep({ nutricion }: { nutricion: RecipeNutrition }) {
  const { lineas, irA } = useSession();
  const activas = lineas.filter((l) => l.activa).length;

  return (
    <>
      <ul className="lista-lineas-sesion">
        {lineas.map((linea) => (
          <LineaEditable key={linea.key} linea={linea} />
        ))}
      </ul>

      <AgregarIngrediente />

      <div className="panel-nutricion-vivo" aria-live="polite">
        <span className="etiqueta-seccion">Con lo que marcaste</span>
        <span className="panel-nutricion-cifra cifra">
          {formatNumber(midpoint(nutricion.kcal.intervalo) / Math.max(1, nutricion.porciones_num ?? 1), 0)} kcal
          <em> por porción</em>
        </span>
        <span className="panel-nutricion-detalle">
          proteína {formatNumber(midpoint(nutricion.por_nutriente.prot_g.intervalo) / Math.max(1, nutricion.porciones_num ?? 1), 1)} g
          {' · '}
          hierro {formatNumber(midpoint(nutricion.por_nutriente.hierro_mg.intervalo) / Math.max(1, nutricion.porciones_num ?? 1), 1)} mg
        </span>
      </div>

      <button type="button" className="boton-principal" onClick={() => irA('pasos')} disabled={activas === 0}>
        Empezar a cocinar
      </button>
    </>
  );
}
