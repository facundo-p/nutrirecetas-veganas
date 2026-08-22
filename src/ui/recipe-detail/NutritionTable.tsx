import { useState } from 'react';
import { hasReportableValue, type RecipeNutrition } from '../../domain/nutrition';
import type { Seed } from '../../seed/schema';
import { amountUnit, formatNumber, icSprouts } from '../common/format';
import { IconBrotesIc, IconCobertura, IconHojaPunteada, IconSemanaArco, IconSol } from '../icons/icons';
import { IntervalBand } from './IntervalBand';

/**
 * Nutrición honesta: banda ≈ con rango, brotes de IC y cobertura del cálculo
 * por nutriente. Sin semáforo todavía: el objetivo personalizado llega con el
 * perfil en Fase 2; acá se informa, no se evalúa.
 *
 * Arranca colapsada, y adentro los nutrientes sin dato están detrás de un
 * contador: esto es un recetario, la nutrición es el segundo nivel. Se cuentan
 * en vez de borrarse porque el invariante 5 pide que la incertidumbre se vea —
 * esconderlos sin decir cuántos son sería exactamente lo que la regla prohíbe.
 */

interface Props {
  nutrition: RecipeNutrition; // ya escalada (por porción o por 100 g)
  seed: Seed;
  titulo: string;
}

const GRUPOS = [
  { etiqueta: 'Nutrientes críticos', filtro: 'critico' as const },
  { etiqueta: 'Importantes', filtro: 'importante' as const },
];

export function NutritionTable({ nutrition, seed, titulo }: Props) {
  const [abierta, setAbierta] = useState(false);
  const [mostrarSinDatos, setMostrarSinDatos] = useState(false);

  const tieneDato = (n: Seed['nutrientes'][number]) => hasReportableValue(nutrition.por_nutriente[n.clave_ingrediente]);
  const cuantosSinDatos = seed.nutrientes.filter((n) => !tieneDato(n)).length;

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
          {GRUPOS.map(({ etiqueta, filtro }) => (
            <div key={filtro}>
              <h3 className="etiqueta-seccion nutricion-grupo">{etiqueta}</h3>
              <ul className="nutricion-lista">
                {seed.nutrientes
                  .filter((n) => n.grupo === filtro)
                  .filter((n) => mostrarSinDatos || tieneDato(n))
                  .map((n) => {
                    const r = nutrition.por_nutriente[n.clave_ingrediente];
                    const sinDatos = !hasReportableValue(r);
                    return (
                      <li key={n.id} className={sinDatos ? 'nutriente sin-datos' : 'nutriente'}>
                        <span className="nutriente-nombre">
                          {n.ventana === 'dia' ? (
                            <IconSol className="nutriente-ventana" aria-label="se evalúa por día" />
                          ) : (
                            <IconSemanaArco className="nutriente-ventana" aria-label="se evalúa por semana" />
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
                            <span
                              className="nutriente-calidad"
                              title={`IC ${r.ic}/10 · calculado sobre el ${formatNumber(r.cobertura_pct, 0)} % del peso`}
                            >
                              <IconBrotesIc nivel={icSprouts(r.ic ?? 1)} /> IC {r.ic}
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
