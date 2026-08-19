import type { Recipe, Seed } from '../../seed/schema';

/**
 * Reglas R como tips de la receta (Fase 1: se muestran los mensajes de las
 * reglas disparadas del dataset; el evaluador vivo del AST llega en Fase 2 con
 * la sesión de cocina). Un calificador tipo "no_aplica_…" degrada a nota gris.
 */

function legible(calificador: string): string {
  return calificador.replaceAll('_', ' ');
}

export function RuleTips({ recipe, seed }: { recipe: Recipe; seed: Seed }) {
  if (recipe.reglas.length === 0) return null;
  return (
    <section>
      <h2>Para aprovecharla mejor</h2>
      <ul className="tips-reglas">
        {recipe.reglas.map((ref) => {
          const rule = seed.reglas.find((r) => r.id === ref.id);
          if (!rule) return null;
          const noAplica = ref.calificador?.startsWith('no_') ?? false;
          return (
            <li key={ref.id + (ref.calificador ?? '')} className={noAplica ? 'tip no-aplica' : 'tip'}>
              <span className={`tip-tipo tip-${rule.tipo}`}>{rule.tipo}</span>
              <span>
                {rule.mensaje}
                {ref.calificador && <em className="tip-calificador"> ({legible(ref.calificador)})</em>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
