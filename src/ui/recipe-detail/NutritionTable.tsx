import { useState } from 'react';
import { hasReportableValue, type RecipeNutrition } from '../../domain/nutrition';
import { porcentajeDeObjetivo, type ObjetivosDeReferencia } from '../../domain/objetivos';
import { routeHash } from '../../app/router';
import type { Nutrient, Seed } from '../../seed/schema';
import { amountUnit, formatNumber } from '../common/format';
import { IconCobertura, IconHojaPunteada, IconSemanaArco, IconSol } from '../icons/icons';
import { IndiceConfianza } from '../common/IndiceConfianza';
import { IntervalBand } from './IntervalBand';

/**
 * Nutrición honesta: banda ≈ con rango, brotes de IC, cobertura del cálculo y
 * cuánto aporta de la dosis diaria. Acá se informa, no se evalúa — y desde la
 * Fase 3 no se evalúa en ningún lado: la app dejó de llevar la cuenta de lo que
 * comés.
 *
 * Vive al final del detalle y arranca colapsada, y adentro los nutrientes sin
 * dato están detrás de un contador: esto es un recetario, la nutrición es el
 * segundo nivel. Se cuentan en vez de borrarse porque el invariante 5 pide que
 * la incertidumbre se vea — esconderlos sin decir cuántos son sería exactamente
 * lo que la regla prohíbe.
 */

interface Props {
  nutrition: RecipeNutrition; // ya escalada (por porción o por 100 g)
  seed: Seed;
  titulo: string;
  objetivos: ObjetivosDeReferencia;
  /** Los que marcaste en tu perfil: van primero dentro de su grupo. */
  destacados: string[];
}

const GRUPOS = [
  { etiqueta: 'Nutrientes críticos', filtro: 'critico' as const },
  { etiqueta: 'Importantes', filtro: 'importante' as const },
];

/** Los que te interesan primero; el resto conserva el orden de la semilla. */
function ordenarPorInteres(nutrientes: Nutrient[], destacados: string[]): Nutrient[] {
  if (destacados.length === 0) return nutrientes;
  const peso = (id: string) => {
    const i = destacados.indexOf(id);
    return i === -1 ? destacados.length : i;
  };
  return [...nutrientes].sort((a, b) => peso(a.id) - peso(b.id));
}

export function NutritionTable({ nutrition, seed, titulo, objetivos, destacados }: Props) {
  const [abierta, setAbierta] = useState(false);
  const [mostrarSinDatos, setMostrarSinDatos] = useState(false);

  const tieneDato = (n: Nutrient) => hasReportableValue(nutrition.por_nutriente[n.clave_ingrediente]);
  const cuantosSinDatos = seed.nutrientes.filter((n) => !tieneDato(n)).length;
  const ordenados = ordenarPorInteres(seed.nutrientes, destacados);

  return (
    <section className="nutricion">
      <div className="nutricion-cabecera">
        <h2>
          <button
            type="button"
            className="nutricion-toggle"
            aria-expanded={abierta}
            onClick={() => setAbierta(!abierta)}
          >
            {abierta ? '▾' : '▸'} {titulo}
          </button>
        </h2>
        <p className="nutricion-cobertura-global">
          <IconCobertura /> calorías calculadas sobre el {formatNumber(nutrition.kcal.cobertura_pct, 0)} % del peso
        </p>
      </div>

      <div className="nutricion-kcal">
        <IntervalBand intervalo={nutrition.kcal.intervalo} unidad="kcal" />
      </div>

      {abierta && (
        <>
          {/* Un porcentaje que no dice contra qué se mide es un número sin
              significado. Se aclara una vez, arriba, y no en cada renglón. */}
          <p className="nutricion-referencia">
            {objetivos.fuente === 'perfil' ? (
              <>Los porcentajes son sobre tu dosis diaria.</>
            ) : (
              <>
                Los porcentajes son sobre la <strong>referencia adulta genérica</strong>.{' '}
                <a href={routeHash({ screen: 'profile' })}>Completá tu perfil</a> para que sean sobre la tuya.
              </>
            )}
          </p>

          {GRUPOS.map(({ etiqueta, filtro }) => (
            <div key={filtro}>
              <h3 className="etiqueta-seccion nutricion-grupo">{etiqueta}</h3>
              <ul className="nutricion-lista">
                {ordenados
                  .filter((n) => n.grupo === filtro)
                  .filter((n) => mostrarSinDatos || tieneDato(n))
                  .map((n) => {
                    const r = nutrition.por_nutriente[n.clave_ingrediente];
                    const sinDatos = !hasReportableValue(r);
                    const pct = porcentajeDeObjetivo(r, objetivos.porNutriente.get(n.id));
                    return (
                      <li key={n.id} className={sinDatos ? 'nutriente sin-datos' : 'nutriente'}>
                        <span className="nutriente-nombre">
                          {n.ventana === 'dia' ? (
                            <IconSol className="nutriente-ventana" aria-label="se mira día a día" />
                          ) : (
                            <IconSemanaArco className="nutriente-ventana" aria-label="se mira en la semana" />
                          )}
                          {n.nombre}
                        </span>
                        {sinDatos ? (
                          <span className="nutriente-sin-datos">
                            <IconHojaPunteada /> sin datos
                          </span>
                        ) : (
                          <>
                            <IntervalBand intervalo={r.intervalo} unidad={amountUnit(n.clave_ingrediente)} />
                            {pct !== null && (
                              <span className="nutriente-porcentaje">
                                <span className="cifra">{formatNumber(pct, pct < 10 ? 1 : 0)} %</span> de la dosis
                                diaria
                              </span>
                            )}
                            <span
                              className="nutriente-calidad"
                              title={`IC ${r.ic}/10 · calculado sobre el ${formatNumber(r.cobertura_pct, 0)} % del peso`}
                            >
                              <IndiceConfianza ic={r.ic ?? 1} compacto />
                              <span className="nutriente-cobertura">
                                <IconCobertura /> {formatNumber(r.cobertura_pct, 0)} %
                              </span>
                            </span>
                          </>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}

          {cuantosSinDatos > 0 && (
            <button
              type="button"
              className="nutricion-sin-datos-toggle"
              aria-expanded={mostrarSinDatos}
              onClick={() => setMostrarSinDatos(!mostrarSinDatos)}
            >
              {mostrarSinDatos ? '▾' : '▸'} {cuantosSinDatos}{' '}
              {cuantosSinDatos === 1 ? 'nutriente sin datos' : 'nutrientes sin datos'} en esta receta
            </button>
          )}
        </>
      )}
    </section>
  );
}
