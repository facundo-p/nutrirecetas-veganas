import { useEnLinea } from '../../app/conexion';
import { useCocciones } from '../../db/hooks';
import { getSeedIndex } from '../../seed';
import { Informacion } from '../common/Informacion';
import { Lamina } from '../common/Lamina';

const FUNCIONA = [
  'Buscar y filtrar recetas',
  'Las fichas, con el escalado y las sustituciones',
  'Cocinar paso a paso y registrar la cocción',
  'El diario, tu perfil y tus favoritas',
  'Ingredientes y nutrientes',
  'Exportar e importar el backup como archivo',
];

const ESPERA_LA_CONEXION = [
  'Enterarte de una versión nueva: el aviso llega cuando vuelve',
  'Mandar el backup a Drive o al mail; descargarlo anda igual',
];

/** Offline es el modo normal de esta app, no un error: el tono es de inventario. */
export function OfflineScreen() {
  const enLinea = useEnLinea();
  const { seed } = getSeedIndex();
  const cocciones = useCocciones();

  return (
    <>
      <header className="encabezado-pantalla">
        <div className="fila-con-informacion">
          <span className="etiqueta-seccion">{enLinea ? 'Funciona sin conexión' : 'Sin conexión'}</span>
          <Informacion>
            <p>
              Al instalarla, la app se guardó entera en este teléfono: recetas, ingredientes, letras y dibujos. La
              conexión solo trae versiones nuevas.
            </p>
            <p>Lo tuyo vive solo en este dispositivo, y por eso existe el backup.</p>
          </Informacion>
        </div>
        <h1>{enLinea ? 'Anda igual sin internet' : 'Todo sigue andando'}</h1>
      </header>

      <p className="sin-conexion-cuenta">
        <span className="cifra">{seed.recetas.length}</span> recetas y{' '}
        <span className="cifra">{seed.ingredientes.length}</span> ingredientes guardados en este teléfono
        {cocciones && cocciones.length > 0 && (
          <>
            , y tus <span className="cifra">{cocciones.length}</span> cocciones
          </>
        )}
        .
      </p>

      <section className="inventario">
        <h2 className="etiqueta-seccion">Funciona</h2>
        <ul>
          {FUNCIONA.map((item) => (
            <li key={item} className="inventario-item" data-anda="si">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="inventario">
        <h2 className="etiqueta-seccion">Espera a la conexión</h2>
        <ul>
          {ESPERA_LA_CONEXION.map((item) => (
            <li key={item} className="inventario-item" data-anda="no">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <Lamina id="cebolla" lugar="cierre" />
    </>
  );
}
