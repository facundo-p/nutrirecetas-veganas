import { useMemo } from 'react';
import { routeHash } from '../../app/router';
import { usePerfil } from '../../db/hooks';
import { ingredientesQueMasAportan, recetasQueMasAportan } from '../../domain/fuentes';
import { objetivosDeReferencia, porcentajeDeObjetivo } from '../../domain/objetivos';
import { getSeedIndex } from '../../seed';
import { amountUnit, formatNumber, icSprouts } from '../common/format';
import { nutritionOf } from '../common/nutritionCache';
import { TypeIcon, typeInfo } from '../common/TypeIcon';
import { IconBrotesIc, IconCobertura, IconEscudoB12, IconSemanaArco, IconSol } from '../icons/icons';

/**
 * Qué es un nutriente, cuánto necesitás y de dónde sacarlo. La semilla ya traía
 * `notas`, `ajuste_vegano.descripcion`, `ventana_nota` y `ul`, y hasta acá no
 * los mostraba ninguna pantalla.
 */

/** Cuántas fuentes se listan de cada lado. */
const CUANTAS = 12;

export function NutrientDetail({ id }: { id: string }) {
  const idx = getSeedIndex();
  const perfil = usePerfil();
  const nutriente = idx.nutrientById.get(id);

  const fuentes = useMemo(() => {
    if (!nutriente) return null;
    return {
      recetas: recetasQueMasAportan(idx, nutriente, (recetaId) => nutritionOf(idx, recetaId)).slice(0, CUANTAS),
      ingredientes: ingredientesQueMasAportan(idx, nutriente).slice(0, CUANTAS),
    };
  }, [idx, nutriente]);

  if (!nutriente || !fuentes) {
    return (
      <>
        <header className="encabezado-pantalla">
          <h1>Nutriente no encontrado</h1>
        </header>
        <p>
          No hay ningún nutriente «{id}». <a href={routeHash({ screen: 'nutrients' })}>Volver a nutrientes</a>.
        </p>
      </>
    );
  }

  const objetivos = objetivosDeReferencia(perfil ?? null, idx.seed.nutrientes, new Date());
  const objetivo = objetivos.porNutriente.get(nutriente.id);
  const unidad = amountUnit(nutriente.clave_ingrediente);
  const Ventana = nutriente.ventana === 'dia' ? IconSol : IconSemanaArco;

  return (
    <article className="detalle">
      <p className="volver">
        <a href={routeHash({ screen: 'nutrients' })}>‹ Nutrientes</a>
      </p>

      <header className="encabezado-pantalla">
        <span className="etiqueta-seccion detalle-tipo">
          <span className="chip chip-mini">{nutriente.grupo === 'critico' ? 'crítico' : 'importante'}</span>
          <span className="meta-item" title={`índice de confianza ${nutriente.ic}/10`}>
            <IconBrotesIc nivel={icSprouts(nutriente.ic)} /> IC {nutriente.ic}
          </span>
        </span>
        <h1>{nutriente.nombre}</h1>
        {objetivo && (
          <p className="detalle-meta">
            <span className="meta-item">
              <span className="cifra">
                {formatNumber(objetivo.valor, objetivo.valor >= 100 ? 0 : 1)} {objetivo.unidad}
              </span>
              <span className="meta-suave">
                por día{objetivos.fuente === 'perfil' ? ', para vos' : ', referencia adulta genérica'}
              </span>
            </span>
            <span className="meta-item">
              <Ventana />
              <span className="meta-suave">
                {nutriente.ventana === 'dia'
                  ? 'se mira día a día'
                  : 'se mira en la semana: no hace falta llegar todos los días'}
              </span>
            </span>
          </p>
        )}
        {nutriente.ventana_nota && <p className="nota-ingrediente">{nutriente.ventana_nota}</p>}
      </header>

      {/* Arriba de todo, antes que cualquier número: sin esto un "40 % de la
          dosis" alimentaria se lee tranquilizador cuando no lo es. */}
      {nutriente.ajuste_vegano?.descripcion && (
        <p className="aviso aviso-nutriente">
          <IconEscudoB12 className="inline-icono icono-aviso" aria-hidden="true" />
          <span>
            {nutriente.ajuste_vegano.descripcion}
            {nutriente.ajuste_vegano.ic !== undefined && (
              <em className="meta-suave"> · IC {nutriente.ajuste_vegano.ic}</em>
            )}
          </span>
        </p>
      )}

      <p className="nutriente-descripcion">{nutriente.descripcion}</p>

      {nutriente.ul !== null && (
        <p className="nutricion-referencia">
          Límite superior: {formatNumber(nutriente.ul, nutriente.ul >= 100 ? 0 : 1)} {unidad} por día
          {nutriente.ul_nota && <> · {nutriente.ul_nota}</>}
        </p>
      )}

      <section>
        <h2>Recetas que más aportan</h2>
        <ul className="lista-fuentes">
          {fuentes.recetas.map(({ receta, cantidad, resultado }) => {
            const pct = porcentajeDeObjetivo(resultado, objetivo);
            const { slug, label } = typeInfo(receta);
            return (
              <li key={receta.id} data-cat={slug}>
                <a className="tarjeta fila-fuente" href={routeHash({ screen: 'recipe', id: receta.id })}>
                  <span className="fuente-tipo" title={label}>
                    <TypeIcon recipe={receta} />
                  </span>
                  <span className="fuente-nombre">{receta.nombre}</span>
                  <span className="fuente-cifras">
                    <span className="cifra">
                      {formatNumber(cantidad, cantidad < 10 ? 1 : 0)} {unidad}
                    </span>
                    {pct !== null && <span className="fuente-porcentaje">{formatNumber(pct, 0)} % de la dosis</span>}
                    <span className="fuente-calidad">
                      <IconCobertura /> {formatNumber(resultado.cobertura_pct, 0)} %
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2>Ingredientes que más aportan</h2>
        <p className="nutricion-referencia">Cada 100 g del ingrediente crudo, tal como lo trae la semilla.</p>
        <ul className="lista-fuentes">
          {fuentes.ingredientes.map(({ ingrediente, cantidad }) => (
            <li key={ingrediente.id}>
              <a className="tarjeta fila-fuente" href={routeHash({ screen: 'ingredient', id: ingrediente.id })}>
                <span className="fuente-nombre">{ingrediente.nombre}</span>
                <span className="fuente-cifras">
                  <span className="cifra">
                    {formatNumber(cantidad, cantidad < 10 ? 1 : 0)} {unidad}
                  </span>
                  <span className="fuente-calidad" title={`índice de confianza ${ingrediente.ic}/10`}>
                    <IconBrotesIc nivel={icSprouts(ingrediente.ic)} />
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {nutriente.notas && nutriente.notas.length > 0 && (
        <section>
          <h2>Lo que conviene saber</h2>
          <ul className="lista-secretos">
            {nutriente.notas.map((nota, i) => (
              <li key={i}>
                {nota.texto}
                {nota.ic !== undefined && <em className="meta-suave"> · IC {nota.ic}</em>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="disclaimer">
        La app informa, no diagnostica. Estas dosis son referencias, no una meta que haya que cerrar todos los días.
      </p>
    </article>
  );
}
