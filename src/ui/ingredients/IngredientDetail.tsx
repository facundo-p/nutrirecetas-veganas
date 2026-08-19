import { getSeedIndex } from '../../seed';
import type { Ingredient } from '../../seed/schema';
import { routeHash } from '../../app/router';
import { amountUnit, icSprouts, MONTH_NAMES } from '../common/format';
import { ingredientInSeason } from '../common/season';
import { IconBrotesIc, IconCopoNieve, IconHeladera, IconTemporada } from '../icons/icons';
import { IntervalBand } from '../recipe-detail/IntervalBand';

/** Etiquetas para claves que no están en el catálogo de 20 nutrientes. */
const EXTRA_LABELS: Record<string, { nombre: string; unidad: string }> = {
  sodio_mg: { nombre: 'Sodio', unidad: 'mg' },
  grasa_saturada_g: { nombre: 'Grasa saturada', unidad: 'g' },
};

export function IngredientDetail({ id }: { id: string }) {
  const idx = getSeedIndex();
  const ing = idx.ingredientById.get(id);
  if (!ing) {
    return (
      <>
        <header className="encabezado-pantalla">
          <h1>Ingrediente no encontrado</h1>
        </header>
        <p>
          No hay ningún ingrediente «{id}». <a href={routeHash({ screen: 'ingredients' })}>Volver a ingredientes</a>.
        </p>
      </>
    );
  }

  const byClave = new Map(idx.seed.nutrientes.map((n) => [n.clave_ingrediente, n]));
  const valores = Object.entries(ing.nutrientes) as Array<[string, NonNullable<Ingredient['kcal']>]>;
  const season = idx.seasonalityByIngredient.get(ing.id);
  const storage = idx.storageFor(ing);
  const pesoUnidad = idx.seed.equivalencias.peso_por_unidad.filter((e) => e.ingrediente_id === ing.id);
  const secoCocido = idx.seed.equivalencias.conversion_seco_cocido.filter((e) => e.ingrediente_id === ing.id);
  const recetas = idx.recipesWithIngredient(ing.id);

  return (
    <article className="detalle">
      <p className="volver">
        <a href={routeHash({ screen: 'ingredients' })}>‹ Ingredientes</a>
      </p>
      <header className="encabezado-pantalla">
        <span className="etiqueta-seccion detalle-tipo">
          <span className="chip chip-mini">{ing.categoria.replaceAll('_', ' ')}</span>
          <span className="meta-item" title={`índice de confianza ${ing.ic}/10`}>
            <IconBrotesIc nivel={icSprouts(ing.ic)} /> IC {ing.ic}
          </span>
        </span>
        <h1>{ing.nombre}</h1>
        {ing.sinonimos.length > 0 && <p className="detalle-meta">también: {ing.sinonimos.join(' · ')}</p>}
        {ing.notas && <p className="nota-ingrediente">{ing.notas}</p>}
        {ing.sustituto_local && <p className="detalle-meta">sustituto local: {ing.sustituto_local}</p>}
      </header>

      <section className="nutricion">
        <div className="nutricion-cabecera">
          <h2>Nutrición por 100 g</h2>
          {ing.base && <p className="nutricion-cobertura-global">valores en estado: {ing.base}</p>}
        </div>
        {ing.kcal && (
          <div className="nutricion-kcal">
            <IntervalBand intervalo={ing.kcal.intervalo} unidad="kcal" />
          </div>
        )}
        {valores.length === 0 && !ing.kcal ? (
          <p className="nutriente-sin-datos">Sin datos nutricionales: el aporte de este ingrediente se considera irrelevante.</p>
        ) : (
          <ul className="nutricion-lista">
            {valores.map(([clave, value]) => {
              const cat = byClave.get(clave as never);
              const label = cat
                ? { nombre: cat.nombre, unidad: amountUnit(cat.clave_ingrediente) }
                : (EXTRA_LABELS[clave] ?? { nombre: clave, unidad: '' });
              return (
                <li key={clave} className="nutriente">
                  <span className="nutriente-nombre">{label.nombre}</span>
                  <IntervalBand intervalo={value.intervalo} unidad={label.unidad} />
                  {value.nota && <span className="nutriente-calidad">{value.nota}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {season && (
        <section>
          <h2>Estacionalidad (AMBA)</h2>
          <p className="detalle-meta">
            <span className="meta-item">
              <IconTemporada className={ingredientInSeason(idx, ing.id) ? 'icono-temporada' : 'icono-fuera-temporada'} />
              pico: {season.meses_pico.map((m) => MONTH_NAMES[m - 1]?.slice(0, 3)).join(', ')}
            </span>
            {season.disponible_todo_ano && <span className="chip chip-mini">disponible todo el año</span>}
          </p>
          {season.nota && <p className="detalle-fuente">{season.nota}</p>}
        </section>
      )}

      {storage.length > 0 && (
        <section>
          <h2>Conservación</h2>
          <ul className="lista-conservacion">
            {storage.map((item) => (
              <li key={item.item} className={item.seguridad_critica ? 'conservacion seguridad' : 'conservacion'}>
                <span className="conservacion-item">{item.item.replaceAll('_', ' ')}</span>
                <span className="detalle-meta">
                  {item.despensa_dias !== undefined && <span className="meta-item">despensa {item.despensa_dias} d</span>}
                  {item.heladera_dias !== undefined && (
                    <span className="meta-item">
                      <IconHeladera /> {item.heladera_dias} d
                    </span>
                  )}
                  {item.freezer_dias !== undefined && (
                    <span className="meta-item">
                      <IconCopoNieve /> {item.freezer_dias} d
                    </span>
                  )}
                </span>
                {item.nota && <span className="detalle-fuente">{item.nota}</span>}
                {item.seguridad_critica && <span className="chip chip-mini chip-alerta">seguridad</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(pesoUnidad.length > 0 || secoCocido.length > 0) && (
        <section>
          <h2>Equivalencias</h2>
          <ul className="lista-equivalencias">
            {pesoUnidad.map((e, i) => (
              <li key={`u${i}`}>
                1 {e.unidad_real ?? 'unidad'}
                {e.tamano ? ` ${e.tamano}` : ''} ≈ <span className="cifra">{e.g} g</span>
                {e.rango && (
                  <span className="meta-suave">
                    ({e.rango[0]}–{e.rango[1]} g)
                  </span>
                )}
              </li>
            ))}
            {secoCocido.map((e, i) => (
              <li key={`s${i}`}>
                seco → cocido: ×{e.factor_peso ?? `${e.rango?.[0]}–${e.rango?.[1]}`}
                {e.nota && <span className="meta-suave">({e.nota})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recetas.length > 0 && (
        <section>
          <h2>Recetas que lo usan</h2>
          <p className="relaciones">
            {recetas.map((r, i) => (
              <span key={r.id}>
                {i > 0 && ' · '}
                <a href={routeHash({ screen: 'recipe', id: r.id })}>{r.nombre}</a>
              </span>
            ))}
          </p>
        </section>
      )}
    </article>
  );
}
