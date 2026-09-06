import { useMemo, useState } from 'react';
import { getSeedIndex, type SeedIndex } from '../../seed';
import type { Line, Recipe } from '../../seed/schema';
import { per100g, perPortion } from '../../domain/nutrition';
import { routeHash } from '../../app/router';
import { currentMonth, difficultyFlames, formatCantidad, formatGramos, formatMinutes } from '../common/format';
import { nutritionOf } from '../common/nutritionCache';
import { ingredientInSeason } from '../../domain/season';
import { TypeIcon, typeInfo } from '../common/TypeIcon';
import {
  IconAsterisco,
  IconBandaAprox,
  IconCopoNieve,
  IconCuchara,
  IconEstrellaBrotada,
  IconHeladera,
  IconLlama,
  IconPlato,
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
import { saveOverlay } from '../../db/repos';
import { PortionScaler } from './PortionScaler';
import { B12Alert } from './B12Alert';
import { NutritionTable } from './NutritionTable';
import { RuleTips } from './RuleTips';

function lineName(idx: SeedIndex, line: Line): { nombre: string; href: string; esPreparado: boolean } {
  if (line.ref.tipo === 'receta') {
    const prep = idx.recipeById.get(line.ref.id);
    return { nombre: prep?.nombre ?? line.ref.id, href: routeHash({ screen: 'recipe', id: line.ref.id }), esPreparado: true };
  }
  const ing = idx.ingredientById.get(line.ref.id);
  return { nombre: ing?.nombre ?? line.ref.id, href: routeHash({ screen: 'ingredient', id: line.ref.id }), esPreparado: false };
}

function IngredientLine({ idx, line }: { idx: SeedIndex; line: Line }) {
  const { nombre, href, esPreparado } = lineName(idx, line);
  const enPico = line.ref.tipo === 'ingrediente' && ingredientInSeason(idx, line.ref.id, currentMonth());
  const unidad = line.unidad_display.replaceAll('_', ' ');
  const cantidad = formatCantidad(line.cantidad);
  const gramos = formatGramos(line.g_aprox);
  const resolubles = line.sustitutos.filter((s) => s.tipo === 'id');
  const textuales = line.sustitutos.filter((s) => s.tipo === 'texto');
  return (
    <li className="linea-ingrediente">
      <span className="linea-principal">
        <span className="linea-nombre">
          <a href={href}>{nombre}</a>
          {esPreparado && <span className="chip chip-mini chip-preparado">preparado</span>}
          {line.imprescindible && (
            <IconAsterisco className="inline-icono icono-imprescindible" aria-label="imprescindible" />
          )}
          {enPico && (
            <IconTemporada className="inline-icono icono-temporada" aria-label="en temporada" />
          )}
        </span>
        <span className="puntos-guia" aria-hidden="true" />
        <span className="linea-cantidad">
          {cantidad} {unidad}
          {`${cantidad} ${unidad}` !== `${gramos} g` && (
            <span className="linea-gramos"> · {gramos} g</span>
          )}
        </span>
      </span>
      {(line.funcion || line.nota || line.sustitutos.length > 0) && (
        <span className="linea-detalles">
          {line.funcion && <em className="linea-funcion">{line.funcion}</em>}
          {line.nota && <span className="linea-nota">{line.nota}</span>}
          {resolubles.map((s) => {
            const ing = idx.ingredientById.get(s.valor);
            return (
              <a key={s.valor} className="chip chip-mini" href={routeHash({ screen: 'ingredient', id: s.valor })}>
                <IconSustituir /> {ing?.nombre ?? s.valor}
              </a>
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

export function RecipeDetail({ id }: { id: string }) {
  const idx = getSeedIndex();
  const recipe = idx.recipeById.get(id);

  const [factor, setFactor] = useState(1);
  const overlay = useOverlay(id);
  const perfil = usePerfil();

  // `usePerfil` devuelve undefined mientras carga y null si no hay: hasta que se
  // sepa, la referencia genérica es la respuesta correcta, no un hueco.
  const objetivos = useMemo(
    () => objetivosDeReferencia(perfil ?? null, idx.seed.nutrientes, new Date()),
    [perfil, idx],
  );

  const escalada = useMemo(() => {
    if (!recipe || factor === 1) return null;
    return {
      lineas: escalarLineas(recipe.lineas, factor),
      avisos: avisosDeEscalado(recipe, factor, idx.seed),
    };
  }, [recipe, factor, idx]);

  const nutrition = useMemo(() => {
    if (!recipe) return null;
    if (factor === 1) return nutritionOf(idx, id);
    // receta sintética escalada: la nutrición por porción no cambia, pero los totales sí
    const sintetica = {
      ...recipe,
      id: `${recipe.id}__x${factor}`,
      lineas: escalarLineas(recipe.lineas, factor),
      porciones_num: recipe.porciones_num === null ? null : recipe.porciones_num * factor,
    };
    const recipeById = new Map(idx.recipeById);
    recipeById.set(sintetica.id, sintetica);
    return computeNutrition(sintetica.id, { ...idx, recipeById });
  }, [recipe, factor, idx, id]);

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
  const { label, slug } = typeInfo(recipe);
  const totalMin = recipe.tiempo_prep_min + recipe.tiempo_coccion_min;

  return (
    <article className="detalle" data-cat={slug}>
      <p className="volver">
        <a href={routeHash({ screen: 'recipes' })}>‹ Recetario</a>
      </p>
      <header className="encabezado-pantalla">
        <span className="etiqueta-seccion detalle-tipo">
          <TypeIcon recipe={recipe} /> {label}
          {recipe.familia && <span className="chip chip-mini">familia: {recipe.familia}</span>}
          {recipe.estado === 'por-probar' ? (
            <span className="chip chip-mini">por probar</span>
          ) : (
            <span className="chip chip-mini chip-probada">probada</span>
          )}
        </span>
        <h1>
          {recipe.nombre}
          {recipe.candidata_clasica && (
            <IconEstrellaBrotada className="inline-icono icono-clasica" aria-label="candidata a clásica" />
          )}
          {recipe.indulgente && (
            <IconCuchara className="inline-icono icono-indulgente" aria-label="indulgente" />
          )}
        </h1>
        <p className="detalle-meta">
          <span className="meta-item">
            <IconReloj /> {formatMinutes(totalMin)}
            <span className="meta-suave">
              ({formatMinutes(recipe.tiempo_prep_min)} prep + {formatMinutes(recipe.tiempo_coccion_min)} cocción)
            </span>
          </span>
          <span className="meta-item" title={recipe.dificultad}>
            {Array.from({ length: difficultyFlames(recipe.dificultad) }, (_, i) => (
              <IconLlama key={i} />
            ))}
            {recipe.dificultad}
          </span>
          <span className="meta-item">
            <IconPlato /> {recipe.porciones_display}
          </span>
          <button
            type="button"
            className="boton-enlace"
            aria-pressed={overlay?.favorita === true}
            onClick={() => void saveOverlay(recipe.id, { favorita: !(overlay?.favorita ?? false) })}
          >
            <IconEstrellaBrotada className="inline-icono" /> {overlay?.favorita ? 'favorita' : 'marcar favorita'}
          </button>
        </p>
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

      <section>
        <h2>Ingredientes</h2>
        <PortionScaler
          porcionesBase={recipe.porciones_num}
          factor={factor}
          onFactor={setFactor}
          avisos={escalada?.avisos ?? []}
        />
        <ul className="lista-lineas">
          {(escalada?.lineas ?? recipe.lineas).map((line, i) => (
            <IngredientLine key={i} idx={idx} line={line} />
          ))}
        </ul>
        <a className="boton-principal boton-cocinar" href={`${routeHash({ screen: 'cook', id: recipe.id })}`}>
          Cocinar ahora
        </a>
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

      {recipe.fuente?.ref && (
        <p className="detalle-fuente">
          Fuente: {recipe.fuente.ref}
          {recipe.fuente.titulo_original && <> · «{recipe.fuente.titulo_original}»</>}
          {recipe.fuente.nota && <> · {recipe.fuente.nota}</>}
        </p>
      )}
      {recipe.nota && <p className="detalle-fuente">{recipe.nota}</p>}
    </article>
  );
}
