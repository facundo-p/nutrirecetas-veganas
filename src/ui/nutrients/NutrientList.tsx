import { routeHash } from '../../app/router';
import { usePerfil } from '../../db/hooks';
import { objetivosDeReferencia } from '../../domain/objetivos';
import { getSeedIndex } from '../../seed';
import { formatNumber } from '../common/format';
import { EncabezadoPantalla } from '../common/EncabezadoPantalla';
import { IconSemanaArco, IconSol } from '../icons/icons';

/**
 * Donde vive todo lo nutricional que no es la ficha de una receta. Es una
 * sección aparte a propósito: a quien no le interesa el dato no le tiene que
 * estorbar, y acá solo entra quien lo vino a buscar.
 */

const GRUPOS = [
  { etiqueta: 'Nutrientes críticos', filtro: 'critico' as const },
  { etiqueta: 'Importantes', filtro: 'importante' as const },
];

export function NutrientList() {
  const idx = getSeedIndex();
  const perfil = usePerfil();
  const objetivos = objetivosDeReferencia(perfil ?? null, idx.seed.nutrientes, new Date());

  return (
    <>
      <EncabezadoPantalla etiqueta="Nutrientes" titulo="Nutrientes" />
      <p className="nutricion-referencia">
        {objetivos.fuente === 'perfil' ? (
          <>Las dosis son las tuyas, calculadas desde tu perfil.</>
        ) : (
          <>
            Las dosis son las de la <strong>referencia adulta genérica</strong>.{' '}
            <a href={routeHash({ screen: 'profile' })}>Completá tu perfil</a> para que sean las tuyas.
          </>
        )}
      </p>

      {GRUPOS.map(({ etiqueta, filtro }) => (
        <section key={filtro} className="grupo-nutrientes">
          <h2 className="etiqueta-seccion">{etiqueta}</h2>
          <ul className="lista-nutrientes">
            {idx.seed.nutrientes
              .filter((n) => n.grupo === filtro)
              .map((n) => {
                const objetivo = objetivos.porNutriente.get(n.id);
                return (
                  <li key={n.id}>
                    <a className="tarjeta fila-nutriente" href={routeHash({ screen: 'nutrient', id: n.id })}>
                      <span className="fila-nutriente-nombre">
                        {n.ventana === 'dia' ? (
                          <IconSol className="nutriente-ventana" aria-label="se mira día a día" />
                        ) : (
                          <IconSemanaArco className="nutriente-ventana" aria-label="se mira en la semana" />
                        )}
                        {n.nombre}
                      </span>
                      {objetivo && (
                        <span className="cifra">
                          {formatNumber(objetivo.valor, objetivo.valor >= 100 ? 0 : 1)} {objetivo.unidad}
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </>
  );
}
