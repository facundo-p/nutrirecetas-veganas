import { useState } from 'react';
import { getSeedIndex } from '../../seed';
import { IndiceConfianza } from '../common/IndiceConfianza';
import { Informacion } from '../common/Informacion';
import { ICON_CATALOG, type CatalogEntry } from '../icons/catalog';

/** Glosario doble: pestaña de íconos y colores (cada uno explicado) + términos culinarios. */

const ICON_GROUPS: Record<CatalogEntry['grupo'], string> = {
  colores: 'Los colores',
  ventana: 'Cada cuánto se mira',
  datos: 'El dato y su confianza',
  'tipo de receta': 'Tipo de receta',
  prácticos: 'Para cocinar',
  extras: 'Cómo marcás cada receta',
  navegación: 'Secciones',
};

const TERM_GROUPS: Record<string, string> = {
  tecnica_calor: 'Técnicas de calor',
  preparacion: 'Preparación',
  corte: 'Cortes',
  concepto: 'Conceptos',
  sabor: 'Sabor',
  mito: 'Mitos',
};

export function Glossary() {
  const idx = getSeedIndex();
  const [tab, setTab] = useState<'iconos' | 'terminos'>('iconos');

  const iconGroups = [...new Set(ICON_CATALOG.map((e) => e.grupo))];
  const termGroups = [...new Set(idx.seed.glosario.map((t) => t.categoria))];

  return (
    <>
      <header className="encabezado-pantalla">
        <div className="fila-con-informacion">
          <span className="etiqueta-seccion">Glosario</span>
          <Informacion>
            <p>
              Cada ícono y cada color de la app, con lo que quiere decir. La «i» de cada pantalla explica los suyos con
              estas mismas palabras: salen de acá.
            </p>
            <p>
              Los términos culinarios son los que usan los pasos de las recetas. Los brotes dicen cuán firme es cada
              definición.
            </p>
          </Informacion>
        </div>
        <h1>Qué quiere decir cada cosa</h1>
      </header>
      <div className="pestanas" role="tablist" aria-label="Secciones del glosario">
        <button role="tab" aria-selected={tab === 'iconos'} className="pestana" onClick={() => setTab('iconos')}>
          Íconos y colores
        </button>
        <button role="tab" aria-selected={tab === 'terminos'} className="pestana" onClick={() => setTab('terminos')}>
          Términos culinarios
        </button>
      </div>

      {tab === 'iconos' ? (
        <div className="glosario-iconos">
          {iconGroups.map((grupo) => (
            <section key={grupo}>
              <h2 className="etiqueta-seccion nutricion-grupo">{ICON_GROUPS[grupo]}</h2>
              <ul className="lista-iconos">
                {ICON_CATALOG.filter((e) => e.grupo === grupo).map(({ id, Componente, significado }) => (
                  <li key={id} className="fila-icono">
                    <span className="fila-icono-glifo">
                      <Componente className="fila-icono-svg" />
                    </span>
                    <span>{significado}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="glosario-terminos">
          {termGroups.map((grupo) => (
            <section key={grupo}>
              <h2 className="etiqueta-seccion nutricion-grupo">{TERM_GROUPS[grupo] ?? grupo}</h2>
              <dl className="lista-terminos">
                {idx.seed.glosario
                  .filter((t) => t.categoria === grupo)
                  .map((t) => (
                    <div key={t.id} className="termino">
                      <dt>
                        {t.termino}
                        {t.sinonimos && t.sinonimos.length > 0 && (
                          <span className="meta-suave"> · {t.sinonimos.join(' · ')}</span>
                        )}
                        <span className="termino-ic">
                          <IndiceConfianza ic={t.ic} compacto />
                        </span>
                      </dt>
                      <dd>
                        {t.definicion}
                        {t.nota && <em className="meta-suave"> {t.nota}</em>}
                      </dd>
                    </div>
                  ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
