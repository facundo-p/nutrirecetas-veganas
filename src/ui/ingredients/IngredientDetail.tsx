import { getSeedIndex } from '../../seed';
import type { Ingredient } from '../../seed/schema';
import { routeHash } from '../../app/router';
import { amountUnit, currentMonth, formatPorcentaje, legible, MONTH_NAMES } from '../common/format';
import { ingredientInSeason } from '../../domain/season';
import { porcentajeAfirmableSolo } from '../../domain/objetivos';
import { enOrdenCanonico, resultadosDeIngrediente } from '../../domain/aporte';
import { ingredienteSinDato, sustitutosDeIngrediente } from '../../domain/ingrediente';
import { CuadradoDeNutriente } from '../common/CuadradoDeNutriente';
import { useObjetivos } from '../common/useObjetivos';
import { SobreQueDosis, SobreQueDosisCorta } from '../common/SobreQueDosis';
import { Informacion } from '../common/Informacion';
import { IconCopoNieve, IconHeladera, IconSustituir, IconTemporada } from '../icons/icons';
import { IndiceConfianza } from '../common/IndiceConfianza';
import { IntervalBand } from '../recipe-detail/IntervalBand';

/** Etiquetas para claves que no están en el catálogo de 20 nutrientes. */
const EXTRA_LABELS: Record<string, { nombre: string; unidad: string }> = {
  sodio_mg: { nombre: 'Sodio', unidad: 'mg' },
  grasa_saturada_g: { nombre: 'Grasa saturada', unidad: 'g' },
};

export function IngredientDetail({ id }: { id: string }) {
  const idx = getSeedIndex();
  const objetivos = useObjetivos();
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

  const valores = ing.nutrientes as Partial<Record<string, NonNullable<Ingredient['kcal']>>>;
  const delCatalogo = enOrdenCanonico(idx.seed.nutrientes).filter((n) => valores[n.clave_ingrediente] !== undefined);
  const extras = Object.keys(EXTRA_LABELS).filter((clave) => valores[clave] !== undefined);
  const sinDato = ingredienteSinDato(ing);
  const sustitutos = sustitutosDeIngrediente(idx.seed.recetas, ing.id);
  const haySustitutos =
    sustitutos.resolubles.length + sustitutos.textuales.length > 0 || ing.sustituto_local !== undefined;
  const resultados = resultadosDeIngrediente(ing);
  const season = idx.seasonalityByIngredient.get(ing.id);
  const storage = idx.storageFor(ing);
  const pesoUnidad = idx.seed.equivalencias.peso_por_unidad.filter((e) => e.ingrediente_id === ing.id);
  const secoCocido = idx.seed.equivalencias.conversion_seco_cocido.filter((e) => e.ingrediente_id === ing.id);
  const recetas = idx.recipesWithIngredient(ing.id);

  return (
    <article className="detalle">
      <div className="fila-con-informacion">
        <p className="volver">
          <a href={routeHash({ screen: 'ingredients' })}>‹ Ingredientes</a>
        </p>
        <Informacion>
          <p>
            Todo cada 100 g del ingrediente, en el estado que dice la ficha. Los porcentajes son sobre{' '}
            <SobreQueDosis fuente={objetivos.fuente} />.
          </p>
          <p>«—» en el porcentaje: el rango arranca en cero y el punto medio diría de más.</p>
        </Informacion>
      </div>
      <header className="encabezado-pantalla">
        <span className="etiqueta-seccion detalle-tipo">
          <span className="chip chip-mini">{legible(ing.categoria)}</span>
          <span className="meta-item">
            <IndiceConfianza ic={ing.ic} />
          </span>
        </span>
        <h1>{ing.nombre}</h1>
        {ing.sinonimos.length > 0 && <p className="detalle-meta">también: {ing.sinonimos.join(' · ')}</p>}
        {ing.notas && <p className="nota-ingrediente">{ing.notas}</p>}
      </header>

      <section className="nutricion">
        <div className="nutricion-cabecera">
          <h2>Aporte por 100 g</h2>
          {ing.base && <p className="nutricion-cobertura-global">valores en estado: {ing.base}</p>}
        </div>
        {ing.kcal && (
          <div className="nutricion-kcal">
            <IntervalBand intervalo={ing.kcal.intervalo} unidad="kcal" />
          </div>
        )}
        {sinDato ? (
          <div className="aviso sin-dato-ingrediente">
            <p>No tenemos un dato confiable de este ingrediente, así que no lo cargamos.</p>
            <p>
              Las recetas que lo llevan calculan con el resto y dicen sobre qué parte del peso. No inventamos el número.
            </p>
          </div>
        ) : ing.aporte_nulo ? (
          <p className="nutriente-sin-datos">No aporta nutrientes: en las recetas cuenta como dato, no como hueco.</p>
        ) : (
          <>
            <p className="nutricion-referencia">
              % sobre <SobreQueDosisCorta fuente={objetivos.fuente} />
            </p>
            <ul className="nutricion-lista nutricion-lista-con-porcentaje">
              {delCatalogo.map((cat) => {
                // Sin la banda al lado, un rango que arranca en cero no se afirma:
                // la B12 de la levadura daría miles de por ciento (invariante 6).
                const pct = porcentajeAfirmableSolo(
                  resultados[cat.clave_ingrediente],
                  objetivos.porNutriente.get(cat.id),
                );
                const value = valores[cat.clave_ingrediente]!;
                return (
                  <li key={cat.id} className="nutriente">
                    <span className="nutriente-nombre">
                      <CuadradoDeNutriente nutrienteId={cat.id} aporta={pct !== null} />
                      {cat.nombre}
                    </span>
                    <IntervalBand intervalo={value.intervalo} unidad={amountUnit(cat.clave_ingrediente)} />
                    <span className="nutriente-porcentaje">
                      <span className="cifra">{pct === null ? '—' : formatPorcentaje(pct)}</span>
                    </span>
                    {value.nota && <span className="nutriente-calidad">{value.nota}</span>}
                  </li>
                );
              })}
              {/* Sodio y grasa saturada no tienen RDA: no hay contra qué medirlos. */}
              {extras.map((clave) => {
                const value = valores[clave]!;
                return (
                  <li key={clave} className="nutriente">
                    <span className="nutriente-nombre">{EXTRA_LABELS[clave]!.nombre}</span>
                    <IntervalBand intervalo={value.intervalo} unidad={EXTRA_LABELS[clave]!.unidad} />
                    {value.nota && <span className="nutriente-calidad">{value.nota}</span>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {haySustitutos && (
        <section>
          <h2>Si no tenés</h2>
          <ul className="lista-sustitutos">
            {sustitutos.resolubles.map((id) => (
              <li key={id}>
                <a className="chip chip-mini" href={routeHash({ screen: 'ingredient', id })}>
                  <IconSustituir /> {idx.ingredientById.get(id)?.nombre ?? id}
                </a>
              </li>
            ))}
            {sustitutos.textuales.map((t) => (
              <li key={t.valor}>
                <span className="chip chip-mini chip-texto">{t.valor}</span>{' '}
                <span className="meta-suave">en {t.recetas.join(', ')}</span>
              </li>
            ))}
            {ing.sustituto_local && (
              <li>
                <span className="chip chip-mini chip-texto">{ing.sustituto_local}</span>{' '}
                <span className="meta-suave">sustituto local</span>
              </li>
            )}
          </ul>
        </section>
      )}

      {(season || storage.length > 0 || pesoUnidad.length > 0 || secoCocido.length > 0) && (
        <section className="tarjeta guarda-ingrediente">
          <h2>Cómo se compra y se guarda</h2>
          {season && (
            <div>
              <h3>Estacionalidad (AMBA)</h3>
              <p className="detalle-meta">
                <span className="meta-item">
                  <IconTemporada
                    className={
                      ingredientInSeason(idx, ing.id, currentMonth()) ? 'icono-temporada' : 'icono-fuera-temporada'
                    }
                  />
                  pico: {season.meses_pico.map((m) => MONTH_NAMES[m - 1]?.slice(0, 3)).join(', ')}
                </span>
                {season.disponible_todo_ano && <span className="chip chip-mini">disponible todo el año</span>}
              </p>
              {season.nota && <p className="detalle-fuente">{season.nota}</p>}
            </div>
          )}

          {storage.length > 0 && (
            <div>
              <h3>Conservación</h3>
              <ul className="lista-conservacion">
                {storage.map((item) => (
                  <li key={item.item} className={item.seguridad_critica ? 'conservacion seguridad' : 'conservacion'}>
                    <span className="conservacion-item">{legible(item.item)}</span>
                    <span className="detalle-meta">
                      {item.despensa_dias !== undefined && (
                        <span className="meta-item">despensa {item.despensa_dias} d</span>
                      )}
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
            </div>
          )}

          {(pesoUnidad.length > 0 || secoCocido.length > 0) && (
            <div>
              <h3>Equivalencias</h3>
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
            </div>
          )}
        </section>
      )}

      <section>
        <h2>Aparece en</h2>
        {recetas.length > 0 ? (
          <ul className="lista-aparece-en">
            {recetas.map((r) => (
              <li key={r.id}>
                <a href={routeHash({ screen: 'recipe', id: r.id })}>{r.nombre}</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detalle-meta">Todavía no lo usa ninguna receta del recetario.</p>
        )}
      </section>
    </article>
  );
}
