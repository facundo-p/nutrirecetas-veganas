import { useEffect, useRef, type ReactNode } from 'react';
import { getSeedIndex } from '../../seed';
import { DIFFICULTY_LEVELS } from '../../seed/schema';
import { ESTADOS_DE_RECETA, ETIQUETA_PLURAL_DE_ESTADO } from '../../domain/estado';
import { enOrdenCanonico, nombreDeNutriente, nutrienteConColor } from '../../domain/aporte';
import { legible } from '../common/format';
import { nivelDeDificultad } from '../common/Dificultad';
import { IconDificultad } from '../icons/icons';
import { CuadradoDeNutriente } from '../common/CuadradoDeNutriente';
import { SobreQueDosisCorta } from '../common/SobreQueDosis';
import { useObjetivos } from '../common/useObjetivos';
import { allFamilies, EMPTY_FILTERS, type RecipeFiltersState } from './filtering';

const TIPOS: Array<{ valor: RecipeFiltersState['tipo']; etiqueta: string }> = [
  { valor: 'salada', etiqueta: 'saladas' },
  { valor: 'dulce', etiqueta: 'dulces' },
  { valor: 'pan', etiqueta: 'panes y masas' },
  { valor: 'combo', etiqueta: 'combos' },
  { valor: 'preparados', etiqueta: 'preparados' },
];

const TIEMPOS = [
  { valor: 30, etiqueta: 'hasta 30 min' },
  { valor: 60, etiqueta: 'hasta 1 h' },
  { valor: 90, etiqueta: 'hasta 1 h 30' },
];

/** El botón de cierre dice el resultado: así se sabe antes de cerrar si quedó algo. */
function etiquetaDeCierre(resultados: number): string {
  if (resultados === 0) return 'Ninguna receta con esos filtros';
  return resultados === 1 ? 'Ver 1 receta' : `Ver ${resultados} recetas`;
}

function Grupo({ titulo, ayuda, children }: { titulo: string; ayuda?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="grupo-filtros">
      <legend className="grupo-filtros-titulo">{titulo}</legend>
      {ayuda && <p className="grupo-filtros-ayuda">{ayuda}</p>}
      <div className="grupo-filtros-chips">{children}</div>
    </fieldset>
  );
}

function Chip({
  activo,
  onClick,
  nutriente,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  nutriente?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" className="chip-filtro" aria-pressed={activo} data-nut={nutriente} onClick={onClick}>
      {children}
    </button>
  );
}

interface Props {
  filters: RecipeFiltersState;
  onChange: (next: RecipeFiltersState) => void;
  resultados: number;
  onCerrar: () => void;
}

/**
 * Los filtros, en una hoja que sube desde abajo. Se aplican en vivo mientras
 * está abierta. Cada grupo es de una sola elección: tocar la activa la suelta.
 */
export function ModalDeFiltros({ filters, onChange, resultados, onCerrar }: Props) {
  const idx = getSeedIndex();
  const objetivos = useObjetivos();
  const hoja = useRef<HTMLDivElement>(null);
  const cerrar = useRef(onCerrar);
  useEffect(() => {
    cerrar.current = onCerrar;
  });

  // El foco entra a la hoja al abrir, y Escape la cierra desde cualquier lado.
  useEffect(() => {
    hoja.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar.current();
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, []);

  const set = (patch: Partial<RecipeFiltersState>) => onChange({ ...filters, ...patch });

  return (
    <div className="modal-filtros">
      <button type="button" className="modal-velo" aria-label="Cerrar los filtros" onClick={onCerrar} />
      <div className="modal-hoja" role="dialog" aria-modal="true" aria-labelledby="titulo-filtros" tabIndex={-1} ref={hoja}>
        <div className="modal-cabecera">
          <h2 id="titulo-filtros">Filtros</h2>
          <button type="button" className="boton-enlace" onClick={() => onChange({ ...EMPTY_FILTERS, q: filters.q })}>
            limpiar todo
          </button>
        </div>

        <Grupo titulo="Qué tipo">
          {TIPOS.map(({ valor, etiqueta }) => (
            <Chip key={valor} activo={filters.tipo === valor} onClick={() => set({ tipo: filters.tipo === valor ? 'todas' : valor })}>
              {etiqueta}
            </Chip>
          ))}
        </Grupo>

        <Grupo titulo="Tiempo y estación">
          {TIEMPOS.map(({ valor, etiqueta }) => (
            <Chip
              key={valor}
              activo={filters.tiempoMax === valor}
              onClick={() => set({ tiempoMax: filters.tiempoMax === valor ? null : valor })}
            >
              {etiqueta}
            </Chip>
          ))}
          <Chip activo={filters.deEstacion} onClick={() => set({ deEstacion: !filters.deEstacion })}>
            de estación
          </Chip>
        </Grupo>

        <Grupo titulo="Dificultad">
          {DIFFICULTY_LEVELS.map((d) => (
            <Chip key={d} activo={filters.dificultad === d} onClick={() => set({ dificultad: filters.dificultad === d ? '' : d })}>
              <IconDificultad nivel={nivelDeDificultad(d)} /> {d}
            </Chip>
          ))}
        </Grupo>

        <Grupo titulo="Para vos">
          {ESTADOS_DE_RECETA.map((estado) => (
            <Chip
              key={estado}
              activo={filters.estado === estado}
              onClick={() => set({ estado: filters.estado === estado ? '' : estado })}
            >
              {ETIQUETA_PLURAL_DE_ESTADO[estado]}
            </Chip>
          ))}
        </Grupo>

        <Grupo titulo="Familia">
          {allFamilies().map((familia) => (
            <Chip
              key={familia}
              activo={filters.familia === familia}
              onClick={() => set({ familia: filters.familia === familia ? '' : familia })}
            >
              {legible(familia)}
            </Chip>
          ))}
        </Grupo>

        <Grupo
          titulo="Que cubra al menos un quinto del día en"
          ayuda={
            <>
              Por porción, sobre <SobreQueDosisCorta fuente={objetivos.fuente} />.
            </>
          }
        >
          {enOrdenCanonico(idx.seed.nutrientes).map((n) => (
            <Chip
              key={n.id}
              activo={filters.ricaEn === n.id}
              nutriente={nutrienteConColor(n.id)}
              onClick={() => set({ ricaEn: filters.ricaEn === n.id ? '' : n.id })}
            >
              <CuadradoDeNutriente nutrienteId={n.id} />
              {nombreDeNutriente(n)}
            </Chip>
          ))}
        </Grupo>

        <div className="modal-pie">
          <button type="button" className="boton-principal modal-cerrar" onClick={onCerrar}>
            {etiquetaDeCierre(resultados)}
          </button>
        </div>
      </div>
    </div>
  );
}
