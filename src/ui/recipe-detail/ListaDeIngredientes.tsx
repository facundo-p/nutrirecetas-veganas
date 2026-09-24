import { useMemo, useState } from 'react';
import type { SeedIndex } from '../../seed';
import type { Line, Recipe } from '../../seed/schema';
import { puntoDeLinea, type PuntoDeIngrediente } from '../../domain/aporte';
import type { ObjetivosDeReferencia } from '../../domain/objetivos';
import { FACTOR_MAX, FACTOR_MIN, factorDesdeLinea, lineaAGusto } from '../../domain/scaling';
import { ingredientInSeason } from '../../domain/season';
import { routeHash } from '../../app/router';
import {
  cantidadConUnidad,
  cantidadEditable,
  currentMonth,
  formatCantidad,
  formatGramos,
  gramosRedundantes,
  leerNumero,
  unidadCompleta,
} from '../common/format';
import { nutritionOf } from '../common/nutritionCache';
import { PuntoDeNutriente } from '../common/PuntoDeNutriente';
import { IconAsterisco, IconSustituir, IconTemporada } from '../icons/icons';
import { AvisosDeEscalado } from './PortionScaler';
import type { RecetaEnVista } from './useRecetaEnVista';

/**
 * Solo los preparados linkean, porque llevan a otra receta. El nombre de un
 * ingrediente es texto: mandarlo a su ficha saca de la receta a quien está
 * cocinando, que es lo último que la lista tiene que hacer.
 */
function lineName(idx: SeedIndex, line: Line): { nombre: string; esPreparado: boolean } {
  if (line.ref.tipo === 'receta') {
    const prep = idx.recipeById.get(line.ref.id);
    return { nombre: prep?.nombre ?? line.ref.id, esPreparado: true };
  }
  const ing = idx.ingredientById.get(line.ref.id);
  return { nombre: ing?.nombre ?? line.ref.id, esPreparado: false };
}

function IngredientLine({
  idx,
  line,
  original,
  punto,
  notas,
  ajuste,
  onSustituir,
}: {
  idx: SeedIndex;
  line: Line;
  /** La línea como la trae la receta: es a lo que se vuelve al despresionar. */
  original: Line;
  punto: PuntoDeIngrediente;
  /** Función, notas y sustitutos: apagados por defecto, se prenden todos juntos. */
  notas: boolean;
  /**
   * Con el ajuste prendido la cantidad es un campo. `aGusto`: va a gusto y la
   * escala cambió, así que dice cuánto pedía la receta.
   */
  ajuste: {
    editable: boolean;
    valor: string;
    onEditar: (texto: string) => void;
    onSoltar: () => void;
    aGusto: boolean;
  };
  onSustituir: (ingrediente_id: string | null) => void;
}) {
  const { nombre, esPreparado } = lineName(idx, line);
  const sustituido = line.ref.id !== original.ref.id;
  const enPico = line.ref.tipo === 'ingrediente' && ingredientInSeason(idx, line.ref.id, currentMonth());
  const unidad = unidadCompleta(line);
  const gramos = formatGramos(line.g_aprox);
  const resolubles = line.sustitutos.filter((s) => s.tipo === 'id');
  const textuales = line.sustitutos.filter((s) => s.tipo === 'texto');
  const conDetalles = notas && (line.funcion || line.nota || line.sustitutos.length > 0);
  return (
    <li className="linea-ingrediente">
      <span className="linea-principal">
        <PuntoDeNutriente punto={punto} />
        <span className="linea-nombre">
          {esPreparado ? (
            <a href={routeHash({ screen: 'recipe', id: line.ref.id })}>{nombre}</a>
          ) : (
            nombre
          )}
          {line.imprescindible && (
            <IconAsterisco className="inline-icono icono-imprescindible" aria-label="imprescindible" />
          )}
          {esPreparado && <span className="chip chip-mini chip-preparado">preparado</span>}
          {enPico && (
            <IconTemporada className="inline-icono icono-temporada" aria-label="en temporada" />
          )}
        </span>
        <span className="linea-cantidad">
          {ajuste.editable ? (
            <input
              className="linea-input"
              inputMode="decimal"
              value={ajuste.valor}
              aria-label={`Cantidad de ${nombre}, en ${unidad}`}
              onChange={(e) => ajuste.onEditar(e.target.value)}
              onBlur={ajuste.onSoltar}
            />
          ) : (
            <span className="linea-valor cifra">{formatCantidad(line.cantidad)}</span>
          )}{' '}
          <span className="linea-unidad">{unidad}</span>
          {!gramosRedundantes(line) && <span className="linea-gramos"> · {gramos} g</span>}
        </span>
      </span>
      {/* La línea cambiada dice de qué viene aunque las notas estén apagadas:
          sin eso, la receta miente sobre sí misma. */}
      {sustituido && <span className="linea-en-vez-de">en vez de {lineName(idx, original).nombre}</span>}
      {ajuste.aGusto && <span className="linea-original">la receta decía {cantidadConUnidad(original)}</span>}
      {conDetalles && (
        <span className="linea-detalles">
          {line.funcion && <em className="linea-funcion">{line.funcion}</em>}
          {line.nota && <span className="linea-nota">{line.nota}</span>}
          {/* Tocar el chip cambia el ingrediente en la receta y mueve la
              nutrición; antes solo llevaba a su ficha, que es informarse en vez
              de cocinar. El puesto se despresiona para volver al original. */}
          {resolubles.map((s) => {
            const ing = idx.ingredientById.get(s.valor);
            const puesto = sustituido && line.ref.id === s.valor;
            return (
              <button
                key={s.valor}
                type="button"
                className="chip chip-mini chip-boton"
                aria-pressed={puesto}
                onClick={() => onSustituir(puesto ? null : s.valor)}
              >
                <IconSustituir /> {ing?.nombre ?? s.valor}
              </button>
            );
          })}
          {textuales.map((s) => (
            <span key={s.valor} className="chip chip-mini chip-texto">
              <IconSustituir /> {s.valor}
            </span>
          ))}
        </span>
      )}
    </li>
  );
}

/**
 * Los ingredientes con sus cantidades, y lo que se hace con ellas: ver notas y
 * sustitutos, y ajustar la receta desde una cantidad cualquiera.
 */
export function ListaDeIngredientes({
  idx,
  recipe,
  vista,
  objetivos,
}: {
  idx: SeedIndex;
  recipe: Recipe;
  vista: RecetaEnVista;
  objetivos: ObjetivosDeReferencia;
}) {
  const { factor, setFactor, lineasElegidas, lineasMostradas, animando } = vista;
  const [notas, setNotas] = useState(false);
  const [ajustando, setAjustando] = useState(false);
  /** Lo que se está tipeando en un campo: el resto de la lista se acomoda apenas es un número. */
  const [borrador, setBorrador] = useState<{ indice: number; texto: string } | null>(null);

  const puntos = useMemo(
    () => lineasElegidas.map((linea) => puntoDeLinea(idx, linea, objetivos, (recetaId) => nutritionOf(idx, recetaId))),
    [lineasElegidas, objetivos, idx],
  );
  const aGusto = useMemo(
    () => lineasElegidas.map((linea) => lineaAGusto(linea, idx.ingredientById)),
    [lineasElegidas, idx],
  );

  // El factor sale de la línea editada contra su propia cantidad elegida, antes de escalar.
  const editarCantidad = (indice: number, texto: string) => {
    setBorrador({ indice, texto });
    const valor = leerNumero(texto);
    const base = lineasElegidas[indice];
    if (valor === null || !base) return;
    const nuevo = factorDesdeLinea(base, valor);
    if (nuevo !== null) setFactor(nuevo);
  };

  return (
    <section className="ficha-ingredientes" aria-labelledby="titulo-ingredientes">
      <div className="lista-lineas-cabecera">
        <h2 id="titulo-ingredientes" className="lista-lineas-titulo">
          {recipe.lineas.length} ingredientes
        </h2>
        <button type="button" className="boton-enlace" aria-pressed={notas} onClick={() => setNotas((v) => !v)}>
          {notas ? 'ocultar notas' : 'ver notas y sustitutos'}
        </button>
      </div>
      <div className="lista-lineas-ajuste">
        <button
          type="button"
          className="boton-enlace"
          aria-pressed={ajustando}
          onClick={() => {
            setAjustando((v) => !v);
            setBorrador(null);
          }}
        >
          {ajustando ? 'listo' : 'Ajustar cantidades según un ingrediente'}
        </button>
        {factor !== 1 && (ajustando || recipe.porciones_num === null) && (
          <button type="button" className="boton-enlace" onClick={() => setFactor(1)}>
            volver a la receta
          </button>
        )}
      </div>
      {ajustando && (
        <p className="lista-lineas-ayuda">
          Cambiá cualquier cantidad y el resto se acomoda.
          {(factor === FACTOR_MAX || factor === FACTOR_MIN) && ' La escala va de un cuarto a cuatro veces la receta.'}
        </p>
      )}
      <ul className={animando ? 'lista-lineas recalculando' : 'lista-lineas'}>
        {lineasMostradas.map((line, i) => (
          <IngredientLine
            key={i}
            idx={idx}
            line={line}
            original={recipe.lineas[i]!}
            punto={puntos[i]!}
            notas={notas}
            ajuste={{
              editable: ajustando,
              valor: borrador?.indice === i ? borrador.texto : cantidadEditable(line.cantidad),
              onEditar: (texto) => editarCantidad(i, texto),
              onSoltar: () => setBorrador(null),
              aGusto: aGusto[i]! && factor !== 1,
            }}
            onSustituir={(ingrediente_id) => vista.sustituir(i, ingrediente_id)}
          />
        ))}
      </ul>
      {/* Lo que va a gusto se dice línea por línea —«la receta decía»— y con
          una nota, no con el recuadro: es un cuidado, no una alarma. */}
      {factor !== 1 && aGusto.some(Boolean) && (
        <p className="nota-a-gusto">
          Los condimentos y las especias no escalan lineal: probá antes de sumar el último tercio.
        </p>
      )}
      <AvisosDeEscalado avisos={vista.avisos} />
    </section>
  );
}
