import { useState } from 'react';
import { midpoint, tieneBanda } from '../../domain/interval';
import { hasReportableValue, type BaseDeMedida, type NutrientResult, type RecipeNutrition } from '../../domain/nutrition';
import { porcentajeAfirmableSolo, type ObjetivosDeReferencia } from '../../domain/objetivos';
import { enOrdenCanonico, GRUPO_DEL_PANEL, GRUPOS_DEL_PANEL, nombreDeNutriente, rellenoDeFranja } from '../../domain/aporte';
import type { AporteDeLinea } from '../../domain/fuentes';
import type { ObjetivoNutriente } from '../../domain/profile';
import type { Nutrient } from '../../seed/schema';
import { amountUnit, formatNumber, formatPorcentaje, MEDIDA_DE_BASE } from '../common/format';
import { CuadradoDeNutriente } from '../common/CuadradoDeNutriente';
import { FranjaDeNutriente } from '../common/BarraDeAporte';
import { IndiceConfianza } from '../common/IndiceConfianza';
import { SobreQueDosisCorta } from '../common/SobreQueDosis';
import { cifraDeBanda, IntervalBand, MarcaDeAproximado } from './IntervalBand';

/** Los que marcaste en tu perfil primero; después los que tienen color, en su orden; después el resto. */
function ordenar(nutrientes: Nutrient[], destacados: string[]): Nutrient[] {
  const puesto = (n: Nutrient) => {
    const i = destacados.indexOf(n.id);
    return i === -1 ? destacados.length : i;
  };
  return enOrdenCanonico(nutrientes).sort((a, b) => puesto(a) - puesto(b));
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
  const quienes = abierta && conDato ? aportantes().slice(0, 3) : [];
  return (
    <li className={conDato ? 'fila-aporte' : 'fila-aporte sin-datos'}>
      <button type="button" className="boton-plano fila-aporte-cabecera" aria-expanded={abierta} onClick={onAlternar}>
        <CuadradoDeNutriente nutrienteId={nutriente.id} aporta={porcentaje !== null} />
        <span className="fila-aporte-nombre">{nombre}</span>
        <span className="fila-aporte-valor">
          {conDato ? (
            <>
              <MarcaDeAproximado intervalo={resultado.intervalo} />
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
          <FranjaDeNutriente
            clase="fila-aporte-franja"
            nutrienteId={nutriente.id}
            relleno={porcentaje === null ? null : rellenoDeFranja(porcentaje)}
          />
          {resultado.ic !== null && <IndiceConfianza ic={resultado.ic} />}
        </span>
      )}
      {abierta && (
        <div className="fila-aporte-detalle">
          {conDato ? (
            <>
              {/* Con un dato puntual la banda repetiría el valor de la fila. */}
              {tieneBanda(resultado.intervalo) && (
                <p>
                  <IntervalBand intervalo={resultado.intervalo} unidad={unidad} />
                </p>
              )}
              {porcentaje === null && (
                <p>Sin porcentaje: el rango arranca en cero, y un punto medio así diría de más.</p>
              )}
              <p className="fila-aporte-origen">
                Calculado sobre el {cobertura} % del peso.
                {quienes.length > 0 && <> Lo aportan: {quienes.map((q) => q.nombre).join(', ')}.</>}
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
  base: BaseDeMedida;
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
export function PanelDeAporte({ nutrition, base, nutrientes, objetivos, destacados, aportantes }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [fila, setFila] = useState<string | null>(null);
  const [verSinDato, setVerSinDato] = useState(false);

  const medida = MEDIDA_DE_BASE[base];
  const kcal = nutrition.kcal.intervalo;
  const tieneDato = (n: Nutrient) => hasReportableValue(nutrition.por_nutriente[n.clave_ingrediente]);
  const sinDato = nutrientes.filter((n) => !tieneDato(n)).length;
  const ordenados = ordenar(nutrientes, destacados);

  return (
    <section className="panel-aporte">
      <div className="panel-aporte-cabecera">
        <h2 className="panel-aporte-titulo">
          <button type="button" className="boton-plano panel-aporte-toggle" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}>
            <span>Qué aporta {medida.sujeto}</span>
            <span className="panel-aporte-signo" aria-hidden="true">
              {abierto ? '−' : '+'}
            </span>
          </button>
        </h2>
      </div>
      <p className="panel-aporte-kcal">
        <span className="cifra">{formatNumber(midpoint(kcal), 0)}</span> kcal {medida.por}
        {tieneBanda(kcal) && (
          <>
            , entre {formatNumber(kcal.min, 0)} y {formatNumber(kcal.max, 0)}
          </>
        )}
      </p>

      {abierto && (
        <div className="panel-aporte-cuerpo">
          {/* Un porcentaje que no dice contra qué se mide es un número sin
              significado: queda dicho acá, corto, una vez. El resto, en la «i». */}
          <p className="panel-aporte-referencia">
            % sobre <SobreQueDosisCorta fuente={objetivos.fuente} />
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
              className="boton-plano panel-aporte-sin-dato"
              aria-expanded={verSinDato}
              onClick={() => setVerSinDato((v) => !v)}
            >
              {verSinDato ? 'ocultar' : 'ver'} {sinDato} {sinDato === 1 ? 'nutriente sin dato' : 'nutrientes sin dato'} en esta
              receta
            </button>
          )}
        </div>
      )}
    </section>
  );
}
