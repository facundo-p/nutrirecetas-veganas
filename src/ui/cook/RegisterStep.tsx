import { useState, type FormEvent } from 'react';
import { useSession } from '../../app/store';
import { navigate } from '../../app/router';
import { addCoccion, addConsumo, saveOverlay } from '../../db/repos';
import type { NutricionSnapshot } from '../../db/schema';
import { variacionesDe } from '../../domain/session';
import type { RecipeNutrition } from '../../domain/nutrition';
import { perPortion } from '../../domain/nutrition';
import type { Recipe, Seed } from '../../seed/schema';
import { formatNumber } from '../common/format';

/**
 * Paso 3: qué quedó. Se registra la cocción completa (con sus variaciones) y
 * cuántas porciones se comieron ahora; el resto queda como sobras para los
 * próximos días. El semáforo suma consumos, no cocciones.
 */

function snapshotDe(nutricion: RecipeNutrition): NutricionSnapshot {
  const porcion = perPortion(nutricion) ?? nutricion;
  const por_nutriente: NutricionSnapshot['por_nutriente'] = {};
  for (const [clave, resultado] of Object.entries(porcion.por_nutriente)) {
    por_nutriente[clave] = resultado;
  }
  return {
    masa_total_g: porcion.masa_total_g,
    kcal: porcion.kcal,
    por_nutriente,
    alerta_b12: porcion.alerta_b12,
  };
}

interface Props {
  recipe: Recipe;
  nutricion: RecipeNutrition;
  seed: Seed;
}

export function RegisterStep({ recipe, nutricion, seed }: Props) {
  const { lineas, factor, porciones, terminar } = useSession();
  const [rendidas, setRendidas] = useState(String(porciones || 1));
  const [comidas, setComidas] = useState('1');
  const [nota, setNota] = useState('');
  const [subirIc, setSubirIc] = useState(recipe.estado === 'por-probar');
  const [guardando, setGuardando] = useState(false);

  const variaciones = variacionesDe(lineas);
  const rendidasNum = Number(rendidas);
  const comidasNum = Number(comidas);
  const sobrantes = Math.max(0, rendidasNum - comidasNum);
  const valido = rendidasNum > 0 && comidasNum >= 0 && comidasNum <= rendidasNum;

  const registrar = async (e: FormEvent) => {
    e.preventDefault();
    if (!valido || guardando) return;
    setGuardando(true);

    const ahora = new Date().toISOString();
    const coccion_id = await addCoccion({
      receta_id: recipe.id,
      receta_nombre: recipe.nombre,
      seed_version: seed.seed_schema_version,
      fecha: ahora,
      porciones_rendidas: rendidasNum,
      factor_escala: factor,
      lineas: lineas
        .filter((l) => l.activa)
        .map((l) => ({
          ref: l.ref,
          nombre: l.nombre,
          g_aprox: l.g_aprox,
          unidad_display: l.unidad_display,
        })),
      variaciones,
      ...(nota.trim() !== '' ? { nota: nota.trim() } : {}),
      // la nutrición se congela por porción: el historial no depende de la semilla futura
      nutricion_porcion: snapshotDe({ ...nutricion, porciones_num: rendidasNum }),
    });

    if (comidasNum > 0) {
      await addConsumo({ coccion_id, fecha: ahora, porciones: comidasNum });
    }
    if (subirIc && recipe.estado === 'por-probar') {
      await saveOverlay(recipe.id, { ic_usuario: 8 });
    }

    terminar();
    navigate({ screen: 'today' });
  };

  return (
    <form className="formulario registro" onSubmit={(e) => void registrar(e)}>
      <h2>¿Cómo salió?</h2>

      <div className="campos-fila">
        <label className="campo">
          <span className="campo-etiqueta">Porciones que rindió</span>
          <input
            type="number"
            inputMode="decimal"
            min="0.5"
            step="0.5"
            value={rendidas}
            onChange={(e) => setRendidas(e.target.value)}
            required
          />
        </label>
        <label className="campo">
          <span className="campo-etiqueta">Porciones que comiste ahora</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max={rendidas}
            step="0.5"
            value={comidas}
            onChange={(e) => setComidas(e.target.value)}
            required
          />
        </label>
      </div>

      <p className="campo-ayuda">
        {sobrantes > 0
          ? `Quedan ${formatNumber(sobrantes, 1)} porciones de sobra: las vas a poder registrar desde Hoy los días que las comas.`
          : 'No queda nada de sobra.'}
      </p>

      <label className="campo">
        <span className="campo-etiqueta">Nota (opcional)</span>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={3}
          placeholder="Qué cambiarías la próxima, cómo quedó…"
        />
      </label>

      {variaciones.length > 0 && (
        <section className="variaciones-resumen">
          <span className="etiqueta-seccion">Lo que cambiaste</span>
          <ul>
            {variaciones.map((v, i) => (
              <li key={i}>
                {v.tipo === 'desmarcado' && `sin ${v.nombre}`}
                {v.tipo === 'sustituido' && `${v.nombre} ${v.detalle}`}
                {v.tipo === 'agregado' && `+ ${v.nombre} (${v.detalle})`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.estado === 'por-probar' && (
        <label className="opcion">
          <input type="checkbox" checked={subirIc} onChange={(e) => setSubirIc(e.target.checked)} />
          <span>
            La probé y la apruebo: subirle la confianza a 8 <em className="campo-ayuda">(solo para vos; la receta original no cambia)</em>
          </span>
        </label>
      )}

      <button type="submit" className="boton-principal" disabled={!valido || guardando}>
        Registrar la cocción
      </button>
    </form>
  );
}
