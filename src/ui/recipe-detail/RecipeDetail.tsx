import { getSeedIndex, type SeedIndex } from '../../seed';
import type { Recipe } from '../../seed/schema';
import { enSuBase } from '../../domain/nutrition';
import { routeHash } from '../../app/router';
import { formatMinutes, legible } from '../common/format';
import { nutritionOf } from '../common/nutritionCache';
import { useObjetivos } from '../common/useObjetivos';
import { TypeIcon, typeInfo } from '../common/TypeIcon';
import { IconCopoNieve, IconCuchara, IconLaurel, IconHeladera, IconRamaBifurca, IconReloj } from '../icons/icons';
import { useOverlay, usePerfil } from '../../db/hooks';
import { estadoDeReceta } from '../../domain/estado';
import { MenuDeEstado } from '../common/EstadoDeReceta';
import { saveOverlay } from '../../db/repos';
import { PortionScaler } from './PortionScaler';
import { B12Alert } from './B12Alert';
import { PanelDeAporte } from './PanelDeAporte';
import { lineasQueAportan } from '../../domain/fuentes';
import { RuleTips } from './RuleTips';
import { ListaDeIngredientes } from './ListaDeIngredientes';
import { useRecetaEnVista } from './useRecetaEnVista';
import { Lamina } from '../common/Lamina';
import { Informacion } from '../common/Informacion';
import { SobreQueDosis } from '../common/SobreQueDosis';
import type { FuenteDeObjetivo } from '../../domain/objetivos';

/** Desde acá el nombre de la receta baja de tamaño: a 40 px no entra en dos renglones. */
const NOMBRE_LARGO = 40;

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

function Guarda({ recipe }: { recipe: Recipe }) {
  const guarda = recipe.guarda;
  if (!guarda || (guarda.heladera_dias === undefined && !guarda.freezer)) return null;
  return (
    <section>
      <h2>Guarda</h2>
      <p className="detalle-meta">
        {guarda.heladera_dias !== undefined && (
          <span className="meta-item">
            <IconHeladera /> {guarda.heladera_dias} días en heladera
          </span>
        )}
        {guarda.freezer && (
          <span className="meta-item">
            <IconCopoNieve className="icono-freezer" /> va al freezer
            {guarda.freezer_nota && <span className="meta-suave">({guarda.freezer_nota})</span>}
          </span>
        )}
      </p>
    </section>
  );
}

function Utensilios({ idx, recipe }: { idx: SeedIndex; recipe: Recipe }) {
  if (recipe.utensilios.length === 0) return null;
  return (
    <section>
      <h2>Utensilios</h2>
      <ul className="lista-utensilios">
        {recipe.utensilios.map((u, i) => {
          if (u.tipo === 'equipo') {
            const eq = idx.seed.utensilios.equipos.find((e) => e.id === u.id);
            return <li key={i} className="chip">{eq?.nombre ?? u.id}</li>;
          }
          if (u.tipo === 'equipo_libre') return <li key={i} className="chip">{legible(u.nombre)}</li>;
          const rule = idx.seed.utensilios.reglas_utensilio.find((r) => r.id === u.id);
          return (
            <li key={i} className="utensilio-regla">
              {rule?.recomendacion ?? u.id}
              {u.calificador && <em className="meta-suave"> ({legible(u.calificador)})</em>}
            </li>
          );
        })}
      </ul>
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

/**
 * Lo que explica la ficha, detrás de su «i»: la B12 primero, cuando la receta
 * lleva levadura, y después cómo leer la lista y el panel de aporte.
 */
function InfoDeLaFicha({ alertaB12, fuente }: { alertaB12: boolean; fuente: FuenteDeObjetivo }) {
  return (
    <>
      {alertaB12 && <B12Alert />}
      <h3>Los ingredientes</h3>
      <p>
        Todo se guarda en gramos, así que la escala es exacta. El punto dice qué nutriente trae sobre todo cada
        ingrediente, con el mismo color que las barras del recetario: neutro si no trae ninguno con dato, y hueco si el
        aporte es condicional. El asterisco marca lo que no se puede sacar.
      </p>
      <h3>Qué aporta</h3>
      <p>
        Todos los nutrientes, ingrediente por ingrediente, y cada dato dice de dónde salió. Los porcentajes son sobre{' '}
        <SobreQueDosis fuente={fuente} />: es información, no una cuenta que haya que cerrar. Con color, los que aparecen
        en las barras del recetario.
      </p>
      <p>Los brotes dicen cuánta confianza tiene el dato; la barra, cuánto del día cubre una porción.</p>
    </>
  );
}

function FichaDeReceta({ recipe }: { recipe: Recipe }) {
  const idx = getSeedIndex();
  const vista = useRecetaEnVista(idx, recipe);
  const overlay = useOverlay(recipe.id);
  const perfil = usePerfil();
  const objetivos = useObjetivos();

  const { medida, base } = enSuBase(vista.nutrition);
  const { label } = typeInfo(recipe);
  const totalMin = recipe.tiempo_prep_min + recipe.tiempo_coccion_min;
  const masaEnLaOlla = vista.lineasMostradas.reduce((total, linea) => total + linea.g_aprox, 0);

  return (
    <article className="detalle">
      <p className="volver">
        <a href={routeHash({ screen: 'recipes' })}>‹ Recetario</a>
      </p>
      <header className="encabezado-pantalla ficha-encabezado">
        {recipe.lamina && <Lamina id={recipe.lamina} lugar="ficha" />}
        <h1 className={recipe.nombre.length > NOMBRE_LARGO ? 'ficha-titulo largo' : 'ficha-titulo'}>{recipe.nombre}</h1>
        <div className="detalle-meta ficha-meta">
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
          {recipe.familia && <span className="meta-item">familia {legible(recipe.familia)}</span>}
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
          <MenuDeEstado
            estado={estadoDeReceta(recipe, overlay)}
            onChange={(estado) => void saveOverlay(recipe.id, { estado })}
          />
          <Informacion>
            <InfoDeLaFicha alertaB12={vista.nutrition.alerta_b12} fuente={objetivos.fuente} />
          </Informacion>
        </div>
        {overlay?.nota && <p className="nota-usuario">Tu nota: «{overlay.nota}»</p>}
      </header>

      <RelatedLinks idx={idx} recipe={recipe} />

      <PortionScaler
        porcionesBase={recipe.porciones_num}
        factor={vista.factor}
        mostrado={vista.mostrado}
        animando={vista.animando}
        masaEnLaOlla={masaEnLaOlla}
        onFactor={vista.setFactor}
      />

      <ListaDeIngredientes idx={idx} recipe={recipe} vista={vista} objetivos={objetivos} />

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
        <a
          className="boton-principal boton-cocinar"
          href={routeHash({ screen: 'cook', id: recipe.id, factor: vista.factor })}
        >
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

      <Guarda recipe={recipe} />
      <Utensilios idx={idx} recipe={recipe} />

      {/* Al final a propósito: primero todo lo que sirve para cocinar. */}
      <PanelDeAporte
        nutrition={medida}
        base={base}
        nutrientes={idx.seed.nutrientes}
        objetivos={objetivos}
        destacados={perfil?.nutrientes_destacados ?? []}
        aportantes={(nutriente) =>
          lineasQueAportan(idx, vista.lineasElegidas, nutriente.clave_ingrediente, (recetaId) => nutritionOf(idx, recetaId))
        }
      />

      <Fuente idx={idx} recipe={recipe} />
      {recipe.nota && <p className="detalle-fuente">{recipe.nota}</p>}
      <Lamina id="perejil" lugar="cierre" />
    </article>
  );
}

export function RecipeDetail({ id }: { id: string }) {
  const recipe = getSeedIndex().recipeById.get(id);
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
  return <FichaDeReceta recipe={recipe} />;
}
