import { DIFFICULTY_LEVELS, type Recipe } from '../../seed/schema';
import { IconDificultad } from '../icons/icons';

type NivelDeDificultad = 1 | 2 | 3 | 4 | 5;

export function nivelDeDificultad(dificultad: Recipe['dificultad']): NivelDeDificultad {
  return (DIFFICULTY_LEVELS.indexOf(dificultad) + 1) as NivelDeDificultad;
}

/** El ícono solo: el nombre del nivel lo dice el lector de pantalla y lo explica la «i». */
export function Dificultad({ dificultad }: { dificultad: Recipe['dificultad'] }) {
  return (
    <IconDificultad
      nivel={nivelDeDificultad(dificultad)}
      role="img"
      aria-hidden={false}
      aria-label={`dificultad ${dificultad}`}
    />
  );
}
