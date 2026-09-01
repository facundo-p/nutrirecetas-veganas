import { useRef, useState } from 'react';
import { analizarImport, diasDesde, exportar, importar, nombreDeArchivo, type ReporteImport } from '../../db/backup';
import { useCocciones, useMeta } from '../../db/hooks';
import { registrarBackup } from '../../db/repos';
import { getSeedIndex } from '../../seed';
import { INFO_DE_TEMA, setTema, TEMAS, temaActivo, type Tema } from '../../app/tema';

/**
 * Ajustes y datos. Sin backend, exportar es la única forma de que estos datos
 * sobrevivan a un borrado de sitio o a un cambio de teléfono, así que el
 * recordatorio es insistente a propósito.
 */

export function SettingsScreen() {
  const idx = getSeedIndex();
  const meta = useMeta();
  const cocciones = useCocciones();
  const inputArchivo = useRef<HTMLInputElement>(null);

  // El tema no vive en la base: es del dispositivo, y lo guarda tema.ts.
  const [tema, elegirTema] = useState<Tema>(() => temaActivo());
  const [pendiente, setPendiente] = useState<{ json: unknown; reporte: ReporteImport } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const seedVersion = idx.seed.seed_schema_version;

  const descargar = async () => {
    const backup = await exportar(seedVersion);
    const archivo = new File([JSON.stringify(backup, null, 1)], nombreDeArchivo(), { type: 'application/json' });

    // En el celular, compartir manda el archivo a AirDrop/Drive de una;
    // en desktop no existe, así que se descarga.
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: 'Backup de Nutrirecetas' });
        await registrarBackup();
        setMensaje('Backup compartido.');
        return;
      } catch {
        // cancelado o no disponible: sigue por descarga
      }
    }

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = archivo.name;
    enlace.click();
    URL.revokeObjectURL(url);
    await registrarBackup();
    setMensaje('Backup descargado.');
  };

  const elegirArchivo = async (file: File) => {
    setError(null);
    setMensaje(null);
    try {
      const json: unknown = JSON.parse(await file.text());
      setPendiente({ json, reporte: analizarImport(json) });
    } catch {
      setError('Ese archivo no es un backup de Nutrirecetas (o está dañado). No se tocó nada.');
    }
  };

  const confirmarImport = async () => {
    if (!pendiente) return;
    try {
      await importar(pendiente.json, seedVersion);
      setPendiente(null);
      setMensaje('Listo: tus datos quedaron reemplazados por los del backup.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo importar.');
    }
  };

  const dias = diasDesde(meta?.ultimo_backup);

  return (
    <>
      <header className="encabezado-pantalla">
        <span className="etiqueta-seccion">Ajustes y datos</span>
        <h1>Tus datos</h1>
      </header>

      <section className="bloque-ajustes">
        <h2>Copia de seguridad</h2>
        <p className="campo-ayuda">
          Todo lo tuyo vive solo en este dispositivo. Si borrás el sitio o cambiás de teléfono, el backup es lo único
          que lo trae de vuelta.
        </p>
        <p className="estado-backup">
          {meta?.ultimo_backup ? (
            <>
              Último backup: hace {dias} {dias === 1 ? 'día' : 'días'}.
              {(meta.cambios_desde_backup ?? 0) > 0 && <> Desde entonces hubo {meta.cambios_desde_backup} cambios.</>}
            </>
          ) : (
            <>Todavía no hiciste ningún backup{cocciones && cocciones.length > 0 ? ' y ya tenés datos que perder.' : '.'}</>
          )}
        </p>
        <div className="acciones-ajustes">
          <button type="button" className="boton-principal" onClick={() => void descargar()}>
            Exportar mis datos
          </button>
          <button type="button" className="boton-secundario" onClick={() => inputArchivo.current?.click()}>
            Importar un backup
          </button>
          <input
            ref={inputArchivo}
            type="file"
            accept="application/json,.json"
            className="input-archivo"
            aria-label="Elegir archivo de backup"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void elegirArchivo(file);
              e.target.value = '';
            }}
          />
        </div>

        {pendiente && (
          <div className="confirmacion" role="alertdialog">
            <p>
              Ese backup es del{' '}
              {new Date(pendiente.reporte.exportado_en).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              : {pendiente.reporte.cocciones} cocciones, {pendiente.reporte.overlays} recetas con notas
              {pendiente.reporte.perfil ? ' y tu perfil' : ', sin perfil'}.
            </p>
            {pendiente.reporte.consumos_descartados > 0 && (
              <p>
                Trae también {pendiente.reporte.consumos_descartados} registros de porciones comidas, de cuando la app
                llevaba esa cuenta. <strong>No se importan</strong>: ya no hay dónde ponerlos.
              </p>
            )}
            <p>
              <strong>Importar reemplaza todo lo que tenés ahora.</strong> Antes de hacerlo se guarda una copia de tu
              estado actual.
            </p>
            <div className="confirmacion-acciones">
              <button type="button" className="boton-principal" onClick={() => void confirmarImport()}>
                Reemplazar mis datos
              </button>
              <button type="button" className="boton-chico" onClick={() => setPendiente(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {error && <p className="mensaje-error">{error}</p>}
        {mensaje && <p className="mensaje-ok">{mensaje}</p>}
      </section>

      <section className="bloque-ajustes">
        <h2>Tema visual</h2>
        <p className="campo-ayuda">
          Cambia solo los colores: las mismas pantallas, el mismo fondo, las mismas tipografías. Queda guardado en este
          dispositivo.
        </p>
        <fieldset className="campo">
          <legend className="campo-etiqueta">Elegí un tema</legend>
          <div className="opciones opciones-columna">
            {TEMAS.map((id) => (
              <label key={id} className="opcion">
                <input
                  type="radio"
                  name="tema"
                  checked={tema === id}
                  onChange={() => {
                    setTema(id);
                    elegirTema(id);
                  }}
                />
                <span>
                  {INFO_DE_TEMA[id].nombre} <em className="campo-ayuda">· {INFO_DE_TEMA[id].resumen}</em>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="bloque-ajustes">
        <h2>Versiones</h2>
        <ul className="lista-versiones">
          <li>
            Semilla de datos: <strong>{idx.seed.dataset_version}</strong> (esquema {seedVersion})
          </li>
          <li>
            Tus datos: esquema <strong>{meta?.user_schema_version ?? 1}</strong>
          </li>
          <li>
            {idx.seed.recetas.length} recetas · {idx.seed.ingredientes.length} ingredientes
          </li>
        </ul>
      </section>
    </>
  );
}
