import type { RecipeNutrition } from '../../domain/nutrition';
import type { Seed } from '../../seed/schema';
import { formatNumber, icSprouts } from '../common/format';
import { IconBrotesIc, IconCobertura, IconHojaPunteada, IconSemanaArco, IconSol } from '../icons/icons';
import { IntervalBand } from './IntervalBand';

/**
 * Nutrición honesta: banda ≈ con rango, brotes de IC y cobertura del cálculo
 * por nutriente. Sin semáforo todavía: el objetivo personalizado llega con el
 * perfil en Fase 2; acá se informa, no se evalúa.
 */

interface Props {
  nutrition: RecipeNutrition; // ya escalada (por porción o por 100 g)
  seed: Seed;
  titulo: string;
}

export function NutritionTable({ nutrition, seed, titulo }: Props) {
  const grupos = [
    { etiqueta: 'Nutrientes críticos', filtro: 'critico' as const },
    { etiqueta: 'Importantes', filtro: 'importante' as const },
  ];
  return (
    <section className="nutricion">
      <div className="nutricion-cabecera">
        <h2>{titulo}</h2>
        <p className="nutricion-cobertura-global">
          <IconCobertura /> calorías calculadas sobre el {formatNumber(nutrition.kcal.cobertura_pct, 0)} % del peso
        </p>
      </div>

      <div className="nutricion-kcal">
        <IntervalBand intervalo={nutrition.kcal.intervalo} unidad="kcal" />
      </div>

      {grupos.map(({ etiqueta, filtro }) => (
        <div key={filtro}>
          <h3 className="etiqueta-seccion nutricion-grupo">{etiqueta}</h3>
          <ul className="nutricion-lista">
            {seed.nutrientes
              .filter((n) => n.grupo === filtro)
              .map((n) => {
                const r = nutrition.por_nutriente[n.clave_ingrediente];
                const sinDatos = r.ic === null;
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
                        <IntervalBand intervalo={r.intervalo} unidad={n.unidad} />
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
    </section>
  );
}
