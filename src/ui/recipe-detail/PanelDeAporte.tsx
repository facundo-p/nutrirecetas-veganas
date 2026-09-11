import { useState } from 'react';
import { midpoint } from '../../domain/interval';
import { hasReportableValue, type NutrientResult, type RecipeNutrition } from '../../domain/nutrition';
import { porcentajeAfirmableSolo, type ObjetivosDeReferencia } from '../../domain/objetivos';
import { esNutrienteDeBarra, GRUPO_DEL_PANEL, GRUPOS_DEL_PANEL, nombreDeNutriente, ORDEN_BARRA } from '../../domain/aporte';
import type { AporteDeLinea } from '../../domain/fuentes';
import type { ObjetivoNutriente } from '../../domain/profile';
import { routeHash } from '../../app/router';
import type { Nutrient } from '../../seed/schema';
import { amountUnit, formatGramos, formatNumber, formatPorcentaje } from '../common/format';
import { CuadradoDeNutriente } from '../common/CuadradoDeNutriente';
import { IndiceConfianza } from '../common/IndiceConfianza';
import { IconBandaAprox } from '../icons/icons';
import { cifraDeBanda, IntervalBand } from './IntervalBand';

const conBanda = (r: NutrientResult) => r.intervalo.max - r.intervalo.min > 1e-9;

/** Los que marcaste en tu perfil primero; después los que tienen color, en su orden; después el resto. */
function ordenar(nutrientes: Nutrient[], destacados: string[]): Nutrient[] {
  const canon = ORDEN_BARRA as readonly string[];
  const clave = (n: Nutrient, i: number): [number, number] => {
    const destacado = destacados.indexOf(n.id);
    const enCanon = canon.indexOf(n.id);
    return [destacado === -1 ? destacados.length : destacado, enCanon === -1 ? canon.length + i : enCanon];
  };
  return nutrientes
    .map((n, i) => ({ n, k: clave(n, i) }))
    .sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1])
    .map(({ n }) => n);
}

function FilaDeAporte({
  nutriente,
  resultado,
  objetivo,
  abierta,
  onAlternar,
  aportantes,
}: {
  nutriente: Nutrient;
  resultado: NutrientResult;
  objetivo: ObjetivoNutriente | undefined;
  abierta: boolean;
  onAlternar: () => void;
  aportantes: () => AporteDeLinea[];
}) {
  const nombre = nombreDeNutriente(nutriente);
  const unidad = amountUnit(nutriente.clave_ingrediente);
  const conDato = hasReportableValue(resultado);
  // La fila cerrada no muestra la banda: un punto medio cuyo rango arranca en
  // cero no se puede afirmar suelto. La banda aparece al abrirla.
  const porcentaje = porcentajeAfirmableSolo(resultado, objetivo);
  const cobertura = formatNumber(resultado.cobertura_pct, 0);
  return (
    <li className={conDato ? 'fila-aporte' : 'fila-aporte sin-datos'}>
      <button type="button" className="fila-aporte-cabecera" aria-expanded={abierta} onClick={onAlternar}>
        <CuadradoDeNutriente nutrienteId={nutriente.id} aporta={porcentaje !== null} />
        <span className="fila-aporte-nombre">{nombre}</span>
        <span className="fila-aporte-valor">
          {conDato ? (
            <>
              {conBanda(resultado) && <IconBandaAprox className="banda-icono" aria-label="valor aproximado" />}
              <span className="cifra">{cifraDeBanda(midpoint(resultado.intervalo))}</span> {unidad}
            </>
          ) : (
            'sin dato'
          )}
        </span>
        <span className="fila-aporte-pct">{porcentaje !== null ? formatPorcentaje(porcentaje) : '—'}</span>
      </button>
      {conDato && (
        <span className="fila-aporte-medida">
          <svg
            className="franja fila-aporte-franja"
            data-nut={esNutrienteDeBarra(nutriente.id) ? nutriente.id : undefined}
            viewBox="0 0 100 1"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect className="franja-fondo" width="100" height="1" />
            {porcentaje !== null && <rect className="franja-relleno" width={Math.min(100, porcentaje)} height="1" />}
          </svg>
          {resultado.ic !== null && <IndiceConfianza ic={resultado.ic} />}
        </span>
      )}
      {abierta && (
        <div className="fila-aporte-detalle">
          {conDato ? (
            <>
              <p>
                <IntervalBand intervalo={resultado.intervalo} unidad={unidad} />
              </p>
              {porcentaje === null && (
                <p>Sin porcentaje: el rango arranca en cero, y un punto medio así diría de más.</p>
              )}
              <p className="fila-aporte-origen">
                Calculado sobre el {cobertura} % del peso.
                {(() => {
                  const quienes = aportantes().slice(0, 3);
                  return quienes.length > 0 && <> Lo aportan: {quienes.map((q) => q.nombre).join(', ')}.</>;
                })()}
              </p>
            </>
          ) : (
            <p className="fila-aporte-origen">
              {resultado.cobertura_pct === 0
                ? `Ningún ingrediente de esta receta tiene dato de ${nombre}: preferimos dejarlo vacío antes que estimar.`
                : `Hay dato para el ${cobertura} % del peso, y no alcanza para afirmar un cero.`}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

interface Props {
  /** Ya en su base: una porción, o 100 g si la receta no define porciones. */
  nutrition: RecipeNutrition;
  porPorcion: boolean;
  nutrientes: Nutrient[];
  objetivos: ObjetivosDeReferencia;
  destacados: string[];
  /** Quién trae cada nutriente en esta receta, de más a menos. */
  aportantes: (nutriente: Nutrient) => AporteDeLinea[];
}

/**
 * Qué aporta una porción. Al final de la ficha y cerrado: esto es un recetario,
 * y la nutrición es el segundo nivel. Las kcal quedan a la vista aunque esté
 * cerrado, con su intervalo, que es parte del dato. Los nutrientes sin dato
 * van detrás de un contador: se cuentan en vez de esconderse (invariante 5).
 */
export function PanelDeAporte({ nutrition, porPorcion, nutrientes, objetivos, destacados, aportantes }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [fila, setFila] = useState<string | null>(null);
  const [verSinDato, setVerSinDato] = useState(false);

  const base = porPorcion ? 'una porción' : 'cada 100 g';
  const kcal = nutrition.kcal;
  const tieneDato = (n: Nutrient) => hasReportableValue(nutrition.por_nutriente[n.clave_ingrediente]);
  const sinDato = nutrientes.filter((n) => !tieneDato(n)).length;
  const ordenados = ordenar(nutrientes, destacados);

  return (
    <section className="panel-aporte">
      <div className="panel-aporte-cabecera">
        <h2 className="panel-aporte-titulo">
          <button type="button" className="panel-aporte-toggle" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}>
            <span>Qué aporta {base}</span>
            <span className="panel-aporte-signo" aria-hidden="true">
              {abierto ? '−' : '+'}
            </span>
          </button>
        </h2>
        <p className="panel-aporte-bajada">Todos los nutrientes, ingrediente por ingrediente. Cada dato dice de dónde salió.</p>
      </div>
      <p className="panel-aporte-kcal">
        <span className="cifra">{formatGramos(midpoint(kcal.intervalo))}</span> kcal {porPorcion ? 'por porción' : 'cada 100 g'}
        {conBanda(kcal) && (
          <>
            , entre {formatGramos(kcal.intervalo.min)} y {formatGramos(kcal.intervalo.max)}
          </>
        )}
      </p>

      {abierto && (
        <div className="panel-aporte-cuerpo">
          {/* Un porcentaje que no dice contra qué se mide es un número sin
              significado. Se aclara una vez, arriba, y no en cada renglón. */}
          <p className="panel-aporte-referencia">
            {objetivos.fuente === 'perfil' ? (
              <>Los porcentajes son sobre tu dosis diaria.</>
            ) : (
              <>
                Los porcentajes son sobre la <strong>referencia adulta genérica</strong>.{' '}
                <a href={routeHash({ screen: 'profile' })}>Completá tu perfil</a> para que sean sobre la tuya.
              </>
            )}{' '}
            Es información, no una cuenta que haya que cerrar. Con color, los que aparecen en las barras del recetario.
          </p>

          {GRUPOS_DEL_PANEL.map((grupo) => {
            const delGrupo = ordenados.filter((n) => GRUPO_DEL_PANEL[n.id] === grupo && (verSinDato || tieneDato(n)));
            if (delGrupo.length === 0) return null;
            return (
              <div key={grupo} className="panel-aporte-grupo">
                <h3 className="panel-aporte-grupo-titulo">{grupo}</h3>
                <ul className="panel-aporte-lista">
                  {delGrupo.map((n) => (
                    <FilaDeAporte
                      key={n.id}
                      nutriente={n}
                      resultado={nutrition.por_nutriente[n.clave_ingrediente]}
                      objetivo={objetivos.porNutriente.get(n.id)}
                      abierta={fila === n.id}
                      onAlternar={() => setFila(fila === n.id ? null : n.id)}
                      aportantes={() => aportantes(n)}
                    />
                  ))}
                </ul>
              </div>
            );
          })}

          {sinDato > 0 && (
            <button
              type="button"
              className="panel-aporte-sin-dato"
              aria-expanded={verSinDato}
              onClick={() => setVerSinDato((v) => !v)}
            >
              {verSinDato ? 'ocultar' : 'ver'} {sinDato} {sinDato === 1 ? 'nutriente sin dato' : 'nutrientes sin dato'} en esta
              receta
            </button>
          )}
          <p className="panel-aporte-pie">
            Los brotes dicen cuánta confianza tiene el dato; la barra, cuánto del día cubre {base}.
          </p>
        </div>
      )}
    </section>
  );
}
