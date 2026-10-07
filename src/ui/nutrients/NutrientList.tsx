import { useMemo, useState } from 'react';
import { routeHash } from '../../app/router';
import { enOrdenCanonico, esNutrienteDeBarra } from '../../domain/aporte';
import { algunIngredienteTieneDato, ingredientesQueMasAportan, recetasQueMasAportan } from '../../domain/fuentes';
import { getSeedIndex, type SeedIndex } from '../../seed';
import type { Nutrient } from '../../seed/schema';
import { CuadradoDeNutriente } from '../common/CuadradoDeNutriente';
import { EncabezadoPantalla } from '../common/EncabezadoPantalla';
import { IndiceConfianza } from '../common/IndiceConfianza';
import { nutritionOf } from '../common/nutritionCache';
import { useObjetivos } from '../common/useObjetivos';
import { ExplicacionB12 } from './ExplicacionB12';

/**
 * Donde vive todo lo nutricional que no es la ficha de una receta. Es una
 * sección aparte a propósito: a quien no le interesa el dato no le tiene que
 * estorbar, y acá solo entra quien lo vino a buscar. Es también la que explica
 * el sistema de color: por qué cada nutriente está o no en las barras.
 */

const CUANTOS_APORTANTES = 3;

interface ResumenDeNutriente {
  nutriente: Nutrient;
  recetas: number;
  conDato: boolean;
  aportantes: string[];
}

const enMinuscula = (nombre: string) => nombre.charAt(0).toLowerCase() + nombre.slice(1);

function resumir(idx: SeedIndex, nutriente: Nutrient): ResumenDeNutriente {
  return {
    nutriente,
    recetas: recetasQueMasAportan(idx, nutriente, (recetaId) => nutritionOf(idx, recetaId)).length,
    conDato: algunIngredienteTieneDato(idx, nutriente),
    aportantes: ingredientesQueMasAportan(idx, nutriente).map(({ ingrediente }) => enMinuscula(ingrediente.nombre)),
  };
}

function enCuantasRecetas({ recetas, conDato }: ResumenDeNutriente): string {
  if (!conDato) return 'sin dato cargado';
  if (recetas === 0) return 'ninguna receta la aporta';
  return recetas === 1 ? 'en 1 receta' : `en ${recetas} recetas`;
}

function PorQue({ resumen }: { resumen: ResumenDeNutriente }) {
  const { nutriente, conDato } = resumen;
  if (nutriente.id === 'b12') return <ExplicacionB12 />;
  if (!conDato)
    return <p>Ningún ingrediente tiene dato cargado: preferimos dejarlo vacío antes que estimar.</p>;
  if (esNutrienteDeBarra(nutriente.id)) return <p>Está en las barras de las recetas.</p>;
  if (nutriente.id === 'yodo')
    return (
      <p>
        Es crítico, pero casi todo el yodo de una receta sale de la sal yodada, y la sal de cada receta es una
        estimación («una pizca», «una cucharadita»). Está en la ficha de cada receta; en la barra no, porque pintaría
        una precisión que no tiene.
      </p>
    );
  if (nutriente.id === 'vitd')
    return <p>No está en las barras: se obtiene del sol más que de la comida, y casi ningún alimento vegetal la trae.</p>;
  return (
    <p>
      No está en las barras: entran los que más importan en una dieta vegana, cuando hay dato en suficientes
      ingredientes para que un casillero diga algo.
    </p>
  );
}

function FilaDeNutriente({
  resumen,
  abierta,
  onAlternar,
}: {
  resumen: ResumenDeNutriente;
  abierta: boolean;
  onAlternar: () => void;
}) {
  const { nutriente, aportantes } = resumen;
  // Ningún ingrediente la trae afirmable: se dice de dónde sale de verdad.
  const loAportan =
    nutriente.id === 'b12'
      ? 'suplementos; alimentos fortificados, si la etiqueta lo dice'
      : aportantes.slice(0, CUANTOS_APORTANTES).join(', ');
  return (
    <li className="tarjeta fila-nutriente">
      <button type="button" className="boton-plano fila-nutriente-cabecera" aria-expanded={abierta} onClick={onAlternar}>
        <CuadradoDeNutriente nutrienteId={nutriente.id} />
        <span className="fila-nutriente-nombre">{nutriente.nombre}</span>
        <span className="fila-nutriente-recetas">{enCuantasRecetas(resumen)}</span>
        <span className="fila-nutriente-confianza">
          <IndiceConfianza ic={nutriente.ic} />
        </span>
      </button>
      {abierta && (
        <div className="fila-nutriente-detalle">
          <PorQue resumen={resumen} />
          {loAportan && <p>Lo aportan sobre todo: {loAportan}.</p>}
          <a href={routeHash({ screen: 'nutrient', id: nutriente.id })}>Ver la ficha ›</a>
        </div>
      )}
    </li>
  );
}

export function NutrientList() {
  const idx = getSeedIndex();
  const objetivos = useObjetivos();
  const [abierta, setAbierta] = useState<string | null>(null);
  const resumenes = useMemo(() => enOrdenCanonico(idx.seed.nutrientes).map((n) => resumir(idx, n)), [idx]);

  return (
    <>
      <EncabezadoPantalla
        titulo="Nutrientes"
        lamina="lechuga"
        informacion={
          <>
            <p>
              Con color, los que aparecen en las barras de las recetas; en hueco, los que no. Tocá uno para saber por
              qué.
            </p>
            <p>Cada fila cuenta las recetas en las que una porción trae un dato que se puede afirmar.</p>
            {objetivos.fuente === 'perfil' ? (
              <p>Las dosis de cada ficha son las tuyas, calculadas desde tu perfil.</p>
            ) : (
              <p>
                Las dosis de cada ficha son las de la <strong>referencia adulta genérica</strong>.{' '}
                <a href={routeHash({ screen: 'profile' })}>Completá tu perfil</a> para que sean las tuyas.
              </p>
            )}
          </>
        }
      />
      <ul className="lista-nutrientes">
        {resumenes.map((resumen) => (
          <FilaDeNutriente
            key={resumen.nutriente.id}
            resumen={resumen}
            abierta={abierta === resumen.nutriente.id}
            onAlternar={() => setAbierta(abierta === resumen.nutriente.id ? null : resumen.nutriente.id)}
          />
        ))}
      </ul>
    </>
  );
}
