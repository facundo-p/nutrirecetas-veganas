import { useState } from 'react';
import { getSeedIndex } from '../../seed';
import { icSprouts } from '../common/format';
import { ICON_CATALOG } from '../icons/catalog';
import { IconBrotesIc } from '../icons/icons';

/** Glosario doble: pestaña de íconos (cada uno explicado) + términos culinarios. */

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
        <span className="etiqueta-seccion">Glosario</span>
        <h1>Glosario</h1>
      </header>
      <div className="pestanas" role="tablist" aria-label="Secciones del glosario">
        <button role="tab" aria-selected={tab === 'iconos'} className="pestana" onClick={() => setTab('iconos')}>
          Íconos
        </button>
        <button role="tab" aria-selected={tab === 'terminos'} className="pestana" onClick={() => setTab('terminos')}>
          Términos culinarios
        </button>
      </div>

      {tab === 'iconos' ? (
        <div className="glosario-iconos">
          {iconGroups.map((grupo) => (
            <section key={grupo}>
              <h2 className="etiqueta-seccion nutricion-grupo">{grupo}</h2>
              <ul className="lista-iconos">
                {ICON_CATALOG.filter((e) => e.grupo === grupo).map(({ id, Componente, significado, cat }) => (
                  <li key={id} className="tarjeta ficha-icono" data-cat={cat}>
                    <Componente className="ficha-icono-svg" />
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
                        <span className="termino-ic" title={`índice de confianza ${t.ic}/10`}>
                          <IconBrotesIc nivel={icSprouts(t.ic)} />
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
