import { useMemo, useState, type FormEvent } from 'react';
import { usePerfil } from '../../db/hooks';
import { savePerfil } from '../../db/repos';
import type { ProfileData, SuplementoDeclarado } from '../../db/schema';
import { objetivosDelPerfil } from '../../domain/profile';
import { getSeedIndex } from '../../seed';
import { formatNumber } from '../common/format';
import { IconCapsula } from '../icons/icons';
import { SupplementsEditor } from './SupplementsEditor';

/**
 * Perfil real. El dataset trae un perfil de ejemplo con datos inventados
 * (1990-01-01, 75 kg): acá los campos arrancan vacíos a propósito — un
 * objetivo calculado sobre un placeholder es peor que no tener objetivo.
 */

const ACTIVIDADES = [
  { valor: 1, etiqueta: 'Sedentario', ayuda: 'trabajo de escritorio, poco movimiento' },
  { valor: 1.1, etiqueta: 'Activo', ayuda: 'caminás bastante o entrenás liviano' },
  { valor: 1.2, etiqueta: 'Fuerza o +60', ayuda: 'entrenás fuerza, o tenés más de 60 años' },
] as const;

export function ProfileScreen() {
  const idx = getSeedIndex();
  const perfilGuardado = usePerfil();

  const [nombre, setNombre] = useState('');
  type SexoElegido = 'masculino' | 'femenino' | '';
  const [sexo, setSexo] = useState<SexoElegido>('');
  const [nacimiento, setNacimiento] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [actividad, setActividad] = useState<1 | 1.1 | 1.2>(1);
  const [suplementos, setSuplementos] = useState<SuplementoDeclarado[]>([]);
  const [cargado, setCargado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Primera vez que llegan los datos guardados: se vuelcan al formulario.
  if (perfilGuardado && !cargado) {
    setNombre(perfilGuardado.nombre ?? '');
    setSexo(perfilGuardado.sexo_para_requerimientos);
    setNacimiento(perfilGuardado.fecha_nacimiento);
    setPeso(String(perfilGuardado.peso_kg));
    setAltura(perfilGuardado.altura_cm === undefined ? '' : String(perfilGuardado.altura_cm));
    setActividad(perfilGuardado.multiplicador_actividad);
    setSuplementos(perfilGuardado.suplementos);
    setCargado(true);
  }

  const objetivos = useMemo(() => {
    if (!perfilGuardado) return null;
    return [...objetivosDelPerfil(perfilGuardado, idx.seed.nutrientes, new Date()).values()];
  }, [perfilGuardado, idx]);

  const completo = sexo !== '' && /^\d{4}-\d{2}-\d{2}$/.test(nacimiento) && Number(peso) > 0;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!completo) return;
    const datos: ProfileData = {
      ...(nombre.trim() !== '' ? { nombre: nombre.trim() } : {}),
      sexo_para_requerimientos: sexo,
      fecha_nacimiento: nacimiento,
      peso_kg: Number(peso),
      ...(Number(altura) > 0 ? { altura_cm: Number(altura) } : {}),
      multiplicador_actividad: actividad,
      suplementos,
      overrides: perfilGuardado?.overrides ?? [],
      nutrientes_destacados:
        perfilGuardado?.nutrientes_destacados.length
          ? perfilGuardado.nutrientes_destacados
          : ['hierro', 'b12', 'calcio', 'zinc', 'yodo', 'omega3', 'proteina'],
    };
    await savePerfil(datos);
    setGuardado(true);
  };

  return (
    <>
      <header className="encabezado-pantalla">
        <span className="etiqueta-seccion">Mi perfil</span>
        <h1>{perfilGuardado ? 'Tus datos' : 'Empecemos por vos'}</h1>
        <p className="intro-vacia">
          Con esto se calculan tus objetivos por nutriente. Nada de esto sale de tu teléfono.
        </p>
      </header>

      <form className="formulario" onSubmit={(e) => void guardar(e)}>
        <label className="campo">
          <span className="campo-etiqueta">Nombre (opcional)</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" />
        </label>

        <fieldset className="campo">
          <legend className="campo-etiqueta">Sexo para requerimientos</legend>
          <p className="campo-ayuda">
            Es el parámetro fisiológico que usan las tablas de referencia (RDA), no una pregunta sobre identidad.
          </p>
          <div className="opciones">
            {(['masculino', 'femenino'] as const).map((valor) => (
              <label key={valor} className="opcion">
                <input
                  type="radio"
                  name="sexo"
                  value={valor}
                  checked={sexo === valor}
                  onChange={() => setSexo(valor)}
                />
                <span>{valor === 'masculino' ? 'Masculino' : 'Femenino'}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="campo">
          <span className="campo-etiqueta">Fecha de nacimiento</span>
          <input type="date" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} required />
        </label>

        <div className="campos-fila">
          <label className="campo">
            <span className="campo-etiqueta">Peso (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              min="20"
              max="300"
              step="0.5"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              required
            />
          </label>
          <label className="campo">
            <span className="campo-etiqueta">Altura (cm, opcional)</span>
            <input
              type="number"
              inputMode="numeric"
              min="100"
              max="250"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
            />
          </label>
        </div>

        <fieldset className="campo">
          <legend className="campo-etiqueta">Actividad</legend>
          <p className="campo-ayuda">Solo mueve el objetivo de proteína.</p>
          <div className="opciones opciones-columna">
            {ACTIVIDADES.map(({ valor, etiqueta, ayuda }) => (
              <label key={valor} className="opcion">
                <input
                  type="radio"
                  name="actividad"
                  checked={actividad === valor}
                  onChange={() => setActividad(valor)}
                />
                <span>
                  {etiqueta} <em className="campo-ayuda">· {ayuda}</em>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <SupplementsEditor
          suplementos={suplementos}
          nutrientes={idx.seed.nutrientes}
          onChange={setSuplementos}
        />

        <button type="submit" className="boton-principal" disabled={!completo}>
          {perfilGuardado ? 'Guardar cambios' : 'Calcular mis objetivos'}
        </button>
        {guardado && <p className="mensaje-ok">Listo, tus objetivos quedaron actualizados.</p>}
      </form>

      {objetivos && (
        <section className="objetivos">
          <h2 className="etiqueta-seccion">Tus objetivos diarios</h2>
          <ul className="lista-objetivos">
            {objetivos.map((o) => (
              <li key={o.nutriente_id} className="objetivo">
                <span className="objetivo-nombre">{o.nombre}</span>
                <span className="objetivo-valor">
                  {o.cubierto_por_suplemento ? (
                    <span className="objetivo-suplemento">
                      <IconCapsula /> cubierto por suplemento
                    </span>
                  ) : (
                    <>
                      <span className="cifra">
                        {formatNumber(o.valor, o.valor >= 100 ? 0 : 1)} {o.unidad}
                      </span>
                      {o.origen === 'override' && <em className="objetivo-origen"> · fijado por vos</em>}
                      {o.aproximada && <em className="objetivo-origen"> · aproximado</em>}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="disclaimer">
        La app informa, no diagnostica. Queda fuera de alcance: embarazo, lactancia, menores de edad y condiciones
        médicas. Controlá B12, vitamina D y ferritina con análisis.
      </p>
    </>
  );
}
