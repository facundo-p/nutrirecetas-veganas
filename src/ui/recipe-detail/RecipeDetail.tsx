import { getSeedIndex, type SeedIndex } from '../../seed';
import type { Line, Recipe } from '../../seed/schema';
import { per100g, perPortion } from '../../domain/nutrition';
import { routeHash } from '../../app/router';
import { difficultyFlames, formatMinutes, formatNumber, icSprouts } from '../common/format';
import { nutritionOf } from '../common/nutritionCache';
import { ingredientInSeason } from '../common/season';
import { TypeIcon, typeInfo } from '../common/TypeIcon';
import {
  IconAsterisco,
  IconBrotesIc,
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
  const enPico = line.ref.tipo === 'ingrediente' && ingredientInSeason(idx, line.ref.id);
  const unidad = line.unidad_display.replaceAll('_', ' ');
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
          {line.cantidad} {unidad}
          {`${line.cantidad} ${unidad}` !== `${line.g_aprox} g` && (
            <span className="linea-gramos"> · {formatNumber(line.g_aprox, 0)} g</span>
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
  if (!recipe) {
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

  const nutrition = nutritionOf(idx, id);
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
          <span className="meta-item" title={`índice de confianza ${recipe.ic}/10`}>
            <IconBrotesIc nivel={icSprouts(recipe.ic)} /> IC {recipe.ic}
          </span>
        </p>
      </header>

      <RelatedLinks idx={idx} recipe={recipe} />
      {nutrition.alerta_b12 && <B12Alert />}

      <section>
        <h2>Ingredientes</h2>
        <ul className="lista-lineas">
          {recipe.lineas.map((line, i) => (
            <IngredientLine key={i} idx={idx} line={line} />
          ))}
        </ul>
      </section>

      <NutritionTable nutrition={shown} seed={idx.seed} titulo={nutricionTitulo} />
      <RuleTips recipe={recipe} seed={idx.seed} />

      <section>
        <h2>Pasos</h2>
        <ol className="lista-pasos">
          {recipe.pasos.map((paso, i) => (
            <li key={i}>{paso}</li>
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
