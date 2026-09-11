import { useMemo, useState } from 'react';
import { getSeedIndex, type SeedIndex } from '../../seed';
import type { Line, Recipe } from '../../seed/schema';
import { per100g, perPortion } from '../../domain/nutrition';
import type { PuntoDeIngrediente } from '../../domain/aporte';
import { routeHash } from '../../app/router';
import { currentMonth, formatCantidad, formatGramos, formatMinutes } from '../common/format';
import { nutritionOf, puntoDeLinea } from '../common/nutritionCache';
import { ingredientInSeason } from '../../domain/season';
import { TypeIcon, typeInfo } from '../common/TypeIcon';
import { PuntoDeNutriente } from '../common/PuntoDeNutriente';
import {
  IconAsterisco,
  IconBandaAprox,
  IconCopoNieve,
  IconCuchara,
  IconLaurel,
  IconHeladera,
  IconRamaBifurca,
  IconReloj,
  IconSustituir,
  IconTemporada,
} from '../icons/icons';
import { avisosDeEscalado, escalarLineas } from '../../domain/scaling';
import { computeNutrition } from '../../domain/nutrition';
import { objetivosDeReferencia } from '../../domain/objetivos';
import { midpoint } from '../../domain/interval';
import { useOverlay, usePerfil } from '../../db/hooks';
import { estadoDeReceta } from '../../domain/estado';
import { ControlDeEstado } from '../common/EstadoDeReceta';
import { saveOverlay } from '../../db/repos';
import { AvisosDeEscalado, PortionScaler } from './PortionScaler';
import { useFactorAnimado } from './useFactorAnimado';
import { B12Alert } from './B12Alert';
import { NutritionTable } from './NutritionTable';
import { RuleTips } from './RuleTips';

/** Desde acá el nombre de la receta baja de tamaño: a 40 px no entra en dos renglones. */
const NOMBRE_LARGO = 40;

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
  onSustituir,
}: {
  idx: SeedIndex;
  line: Line;
  /** La línea como la trae la receta: es a lo que se vuelve al despresionar. */
  original: Line;
  punto: PuntoDeIngrediente;
  /** Función, notas y sustitutos: apagados por defecto, se prenden todos juntos. */
  notas: boolean;
  onSustituir: (ingrediente_id: string | null) => void;
}) {
  const { nombre, esPreparado } = lineName(idx, line);
  const sustituido = line.ref.id !== original.ref.id;
  const enPico = line.ref.tipo === 'ingrediente' && ingredientInSeason(idx, line.ref.id, currentMonth());
  const unidad = line.unidad_display.replaceAll('_', ' ');
  const cantidad = formatCantidad(line.cantidad);
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
          <span className="linea-valor cifra">{cantidad}</span> <span className="linea-unidad">{unidad}</span>
          {`${cantidad} ${unidad}` !== `${gramos} g` && <span className="linea-gramos"> · {gramos} g</span>}
        </span>
      </span>
      {/* La línea cambiada dice de qué viene aunque las notas estén apagadas:
          sin eso, la receta miente sobre sí misma. */}
      {sustituido && <span className="linea-en-vez-de">en vez de {lineName(idx, original).nombre}</span>}
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
 * Qué quieren decir los puntos. La B12 se dice acá, leyendo `alerta_b12` y no
 * los puntos: el flag ve la levadura también cuando viene dentro de un preparado.
 */
function NotaDeLaLista({ hayHueco, alertaB12 }: { hayHueco: boolean; alertaB12: boolean }) {
  return (
    <div className="lista-lineas-nota">
      <p>
        Todo se guarda en gramos, así que la escala es exacta. El punto dice qué nutriente trae sobre todo cada
        ingrediente, con el mismo color que las barras del recetario; en beige, los que no traen ninguno con dato.
        {hayHueco && ' El punto hueco es aporte condicional.'} El asterisco marca lo que no se puede sacar.
      </p>
      {alertaB12 && (
        <p className="nota-b12">
          Lleva levadura nutricional: trae B12 solo si la marca está fortificada, y muchas marcas argentinas no lo
          están. Si la etiqueta no la nombra, no la tiene.
        </p>
      )}
    </div>
  );
}

function RelatedLinks({ idx, recipe }: { idx: SeedIndex; recipe: Recipe }) {
  const mother = recipe.variante_de ? idx.recipeById.get(recipe.variante_de) : undefined;
  const variants = idx.variantsOf(recipe.id);
  const consumers = idx.consumersOf(recipe.id);
  const preparadosNav = recipe.usa_preparados
    .filter((p) => !recipe.lineas.some((l) => l.ref.tipo === 'receta' && l.ref.id === p))
    .map((p) => idx.recipeById.get(p))
    .filter((r): r is Recipe => r !== undefined);

  if (!mother && variants.length === 0 && consumers.length === 0 && preparadosNav.length === 0) return null;
  return (
    <section className="relaciones">
      {mother && (
        <p>
          <IconRamaBifurca className="inline-icono" /> Variante de{' '}
          <a href={routeHash({ screen: 'recipe', id: mother.id })}>{mother.nombre}</a>
        </p>
      )}
      {variants.length > 0 && (
        <p>
          <IconRamaBifurca className="inline-icono" /> Variantes:{' '}
          {variants.map((v, i) => (
            <span key={v.id}>
              {i > 0 && ' · '}
              <a href={routeHash({ screen: 'recipe', id: v.id })}>{v.nombre}</a>
            </span>
          ))}
        </p>
      )}
      {preparadosNav.length > 0 && (
        <p>
          Se acompaña con{' '}
          {preparadosNav.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ' · '}
              <a href={routeHash({ screen: 'recipe', id: p.id })}>{p.nombre}</a>
            </span>
          ))}
        </p>
      )}
      {consumers.length > 0 && (
        <p>
          Se usa en{' '}
          {consumers.map((c, i) => (
            <span key={c.id}>
              {i > 0 && ' · '}
              <a href={routeHash({ screen: 'recipe', id: c.id })}>{c.nombre}</a>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

/**
 * De dónde salió la receta. La credencial es lo que hace útil el origen —"test
 * kitchen profesional" contra "sin certificador: validar en casa"— así que va
 * visible y no en un `title`: en el celular un `title` no existe.
 */
function Fuente({ idx, recipe }: { idx: SeedIndex; recipe: Recipe }) {
  const ref = recipe.fuente?.ref;
  if (ref === undefined) return null;
  const fuente = idx.seed.fuentes[ref];
  const nombre = fuente?.nombre ?? ref;
  return (
    <p className="detalle-fuente">
      <span>
        Fuente: {fuente?.url ? <a href={fuente.url} target="_blank" rel="noreferrer">{nombre}</a> : nombre}
        {recipe.fuente?.titulo_original && <> · «{recipe.fuente.titulo_original}»</>}
      </span>
      {fuente?.credencial && <span className="detalle-fuente-credencial">{fuente.credencial}</span>}
      {recipe.fuente?.nota && <span className="detalle-fuente-credencial">{recipe.fuente.nota}</span>}
    </p>
  );
}

export function RecipeDetail({ id }: { id: string }) {
  const idx = getSeedIndex();
  const recipe = idx.recipeById.get(id);

  const [factor, setFactor] = useState(1);
  const { mostrado, animando } = useFactorAnimado(factor);
  const [notas, setNotas] = useState(false);
  /**
   * Qué línea se cambió por qué ingrediente, mientras mirás la ficha. Efímero
   * como el selector de porciones: al salir la receta vuelve a ser la que es.
   */
  const [sustituciones, setSustituciones] = useState<ReadonlyMap<number, string>>(new Map());
  const overlay = useOverlay(id);
  const perfil = usePerfil();

  // `usePerfil` devuelve undefined mientras carga y null si no hay: hasta que se
  // sepa, la referencia genérica es la respuesta correcta, no un hueco.
  const objetivos = useMemo(
    () => objetivosDeReferencia(perfil ?? null, idx.seed.nutrientes, new Date()),
    [perfil, idx],
  );

  // Las sustituciones se aplican antes de escalar, así entran igual al escalado
  // y al recálculo. Cambian la referencia y nada más: la cantidad y los gramos
  // son los que la receta pide, como en la sesión de cocina.
  const lineasElegidas = useMemo(() => {
    if (!recipe) return [];
    if (sustituciones.size === 0) return recipe.lineas;
    return recipe.lineas.map((linea, i) => {
      const nuevo = sustituciones.get(i);
      return nuevo === undefined ? linea : { ...linea, ref: { tipo: 'ingrediente' as const, id: nuevo } };
    });
  }, [recipe, sustituciones]);

  // Las cantidades se dibujan con el factor que viaja; la nutrición y los
  // avisos, con el de destino: no tienen por qué recalcularse cuadro a cuadro.
  const lineasMostradas = useMemo(
    () => (mostrado === 1 ? lineasElegidas : escalarLineas(lineasElegidas, mostrado)),
    [lineasElegidas, mostrado],
  );
  const avisos = useMemo(
    () => (recipe && factor !== 1 ? avisosDeEscalado(recipe, factor, idx.seed) : []),
    [recipe, factor, idx],
  );
  const puntos = useMemo(
    () => lineasElegidas.map((linea) => puntoDeLinea(idx, linea, objetivos)),
    [lineasElegidas, objetivos, idx],
  );

  const nutrition = useMemo(() => {
    if (!recipe) return null;
    if (factor === 1 && sustituciones.size === 0) return nutritionOf(idx, id);
    // receta sintética: la nutrición por porción no cambia con el factor, pero
    // los totales sí, y con una sustitución cambian las dos. El cache es por id
    // de semilla, así que este camino no pasa por él.
    const sintetica = {
      ...recipe,
      id: `${recipe.id}__vista`,
      lineas: escalarLineas(lineasElegidas, factor),
      porciones_num: recipe.porciones_num === null ? null : recipe.porciones_num * factor,
    };
    const recipeById = new Map(idx.recipeById);
    recipeById.set(sintetica.id, sintetica);
    return computeNutrition(sintetica.id, { ...idx, recipeById });
  }, [recipe, lineasElegidas, factor, sustituciones, idx, id]);

  const sustituir = (indice: number, ingrediente_id: string | null) => {
    setSustituciones((previas) => {
      const siguiente = new Map(previas);
      if (ingrediente_id === null) siguiente.delete(indice);
      else siguiente.set(indice, ingrediente_id);
      return siguiente;
    });
  };

  if (!recipe || !nutrition) {
    return (
      <>
        <header className="encabezado-pantalla">
          <h1>Receta no encontrada</h1>
        </header>
        <p>
          No hay ninguna receta «{id}». <a href={routeHash({ screen: 'recipes' })}>Volver al recetario</a>.
        </p>
      </>
    );
  }

  const portion = perPortion(nutrition);
  const shown = portion ?? per100g(nutrition);
  const nutricionTitulo = portion
    ? `Nutrición por porción (rinde ${recipe.porciones_display})`
    : `Nutrición por 100 g (rinde ${recipe.porciones_display})`;
  const { label } = typeInfo(recipe);
  const totalMin = recipe.tiempo_prep_min + recipe.tiempo_coccion_min;
  const masaEnLaOlla = lineasMostradas.reduce((total, linea) => total + linea.g_aprox, 0);

  return (
    <article className="detalle">
      <p className="volver">
        <a href={routeHash({ screen: 'recipes' })}>‹ Recetario</a>
      </p>
      <header className="encabezado-pantalla ficha-encabezado">
        <h1 className={recipe.nombre.length > NOMBRE_LARGO ? 'ficha-titulo largo' : 'ficha-titulo'}>{recipe.nombre}</h1>
        <p className="ficha-meta">
          <span className="meta-item" title={label}>
            <TypeIcon recipe={recipe} /> {label}
          </span>
          <span className="meta-item">
            <IconReloj /> {formatMinutes(totalMin)}
            <span className="meta-suave">
              ({formatMinutes(recipe.tiempo_prep_min)} prep + {formatMinutes(recipe.tiempo_coccion_min)} cocción)
            </span>
          </span>
          <span className="meta-item">dificultad {recipe.dificultad}</span>
          {recipe.porciones_num === null && <span className="meta-item">rinde {recipe.porciones_display}</span>}
          {recipe.familia && <span className="meta-item">familia {recipe.familia.replaceAll('_', ' ')}</span>}
          {recipe.candidata_clasica && (
            <span className="meta-item ficha-clasica">
              <IconLaurel /> candidata a clásica
            </span>
          )}
          {recipe.indulgente && (
            <span className="meta-item">
              <IconCuchara className="icono-indulgente" /> indulgente
            </span>
          )}
        </p>
        <ControlDeEstado
          estado={estadoDeReceta(recipe, overlay)}
          onChange={(estado) => void saveOverlay(recipe.id, { estado })}
        />
        {overlay?.nota && <p className="nota-usuario">Tu nota: «{overlay.nota}»</p>}
      </header>

      <RelatedLinks idx={idx} recipe={recipe} />
      {/* El único dato nutricional que se mira cocinando, en bloque propio: el
          resto queda al final detrás de un tap. Lleva el marcador de aproximado
          — la banda entera está abajo, pero un punto medio suelto sin decir que
          lo es sería afirmar de más. */}
      <p className="detalle-energia" title={`entre ${formatGramos(shown.kcal.intervalo.min)} y ${formatGramos(shown.kcal.intervalo.max)} kcal`}>
        <span className="detalle-energia-etiqueta">{portion ? 'por porción' : 'por 100 g'}</span>
        <span className="detalle-energia-cifra">
          <IconBandaAprox className="banda-icono" aria-label="valor aproximado" />
          <span className="cifra">{formatGramos(midpoint(shown.kcal.intervalo))}</span> kcal
        </span>
      </p>
      {nutrition.alerta_b12 && <B12Alert />}

      <PortionScaler
        porcionesBase={recipe.porciones_num}
        factor={factor}
        mostrado={mostrado}
        animando={animando}
        masaEnLaOlla={masaEnLaOlla}
        onFactor={setFactor}
      />

      <section className="ficha-ingredientes" aria-labelledby="titulo-ingredientes">
        <div className="lista-lineas-cabecera">
          <h2 id="titulo-ingredientes" className="lista-lineas-titulo">
            {recipe.lineas.length} ingredientes
          </h2>
          <button type="button" className="boton-enlace" aria-pressed={notas} onClick={() => setNotas((v) => !v)}>
            {notas ? 'ocultar notas' : 'ver notas y sustitutos'}
          </button>
        </div>
        <ul className={animando ? 'lista-lineas recalculando' : 'lista-lineas'}>
          {lineasMostradas.map((line, i) => (
            <IngredientLine
              key={i}
              idx={idx}
              line={line}
              original={recipe.lineas[i]!}
              punto={puntos[i]!}
              notas={notas}
              onSustituir={(ingrediente_id) => sustituir(i, ingrediente_id)}
            />
          ))}
        </ul>
        <NotaDeLaLista hayHueco={puntos.includes('condicional')} alertaB12={nutrition.alerta_b12} />
        <AvisosDeEscalado avisos={avisos} />
      </section>

      <RuleTips recipe={recipe} seed={idx.seed} />

      <section>
        <h2>Pasos</h2>
        <ol className="lista-pasos">
          {recipe.pasos.map((paso, i) => (
            <li key={i}>
              <span className="paso-numero" aria-hidden="true">
                {i + 1}
              </span>
              <span className="paso-texto">{paso}</span>
            </li>
          ))}
        </ol>
        <a className="boton-principal boton-cocinar" href={`${routeHash({ screen: 'cook', id: recipe.id })}`}>
          Cocinar ahora
        </a>
      </section>

      {recipe.secretos_chef.length > 0 && (
        <section>
          <h2>Secretos del chef</h2>
          <ul className="lista-secretos">
            {recipe.secretos_chef.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {(recipe.guarda?.heladera_dias !== undefined || recipe.guarda?.freezer) && (
        <section>
          <h2>Guarda</h2>
          <p className="detalle-meta">
            {recipe.guarda.heladera_dias !== undefined && (
              <span className="meta-item">
                <IconHeladera /> {recipe.guarda.heladera_dias} días en heladera
              </span>
            )}
            {recipe.guarda.freezer && (
              <span className="meta-item">
                <IconCopoNieve className="icono-freezer" /> va al freezer
                {recipe.guarda.freezer_nota && <span className="meta-suave">({recipe.guarda.freezer_nota})</span>}
              </span>
            )}
          </p>
        </section>
      )}

      {recipe.utensilios.length > 0 && (
        <section>
          <h2>Utensilios</h2>
          <ul className="lista-utensilios">
            {recipe.utensilios.map((u, i) => {
              if (u.tipo === 'equipo') {
                const eq = idx.seed.utensilios.equipos.find((e) => e.id === u.id);
                return <li key={i} className="chip">{eq?.nombre ?? u.id}</li>;
              }
              if (u.tipo === 'equipo_libre') return <li key={i} className="chip">{u.nombre.replaceAll('_', ' ')}</li>;
              const rule = idx.seed.utensilios.reglas_utensilio.find((r) => r.id === u.id);
              return (
                <li key={i} className="utensilio-regla">
                  {rule?.recomendacion ?? u.id}
                  {u.calificador && <em className="meta-suave"> ({u.calificador.replaceAll('_', ' ')})</em>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Al final a propósito: primero todo lo que sirve para cocinar. */}
      <NutritionTable
        nutrition={shown}
        seed={idx.seed}
        titulo={nutricionTitulo}
        objetivos={objetivos}
        destacados={perfil?.nutrientes_destacados ?? []}
      />

      <Fuente idx={idx} recipe={recipe} />
      {recipe.nota && <p className="detalle-fuente">{recipe.nota}</p>}
    </article>
  );
}
