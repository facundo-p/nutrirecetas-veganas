/**
 * Mueve a "Publicado" los issues del tablero cuyo cierre ya está en `main`.
 *
 * Lo corre `/release` después de que Facu mergea el PR a `main`. Automatizarlo
 * en Actions no se puede: el GITHUB_TOKEN no escribe en Projects de usuario, y
 * la alternativa era mantener un PAT vivo como secret.
 *
 *   npx tsx scripts/tablero-publicado.ts [--seco]
 *
 * Es idempotente: lo que ya está en la columna no se vuelve a tocar.
 */

import { execFileSync } from 'node:child_process';
import { issuesQueCierra, planDePublicacion, type ItemDeTablero } from './tablero';

const PROYECTO = '3';
const DUENIO = 'facundo-p';
const CAMPO = 'Status';
const COLUMNA = 'Publicado';

const seco = process.argv.includes('--seco');

const correr = (bin: string, args: string[]): string =>
  execFileSync(bin, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

const json = <T>(bin: string, args: string[]): T => JSON.parse(correr(bin, args)) as T;

/** El nombre es el contrato: si alguien renombra la columna, esto falla claro. */
function opcionDeColumna(): { proyecto: string; campo: string; opcion: string } {
  const proyecto = json<{ id: string }>('gh', ['project', 'view', PROYECTO, '--owner', DUENIO, '--format', 'json']);
  const campos = json<{ fields: { id: string; name: string; options?: { id: string; name: string }[] }[] }>('gh', [
    'project',
    'field-list',
    PROYECTO,
    '--owner',
    DUENIO,
    '--format',
    'json',
  ]);

  const campo = campos.fields.find((f) => f.name === CAMPO);
  if (!campo) throw new Error(`El tablero no tiene un campo "${CAMPO}". Campos: ${campos.fields.map((f) => f.name).join(', ')}`);

  const opcion = campo.options?.find((o) => o.name === COLUMNA);
  if (!opcion)
    throw new Error(
      `El campo "${CAMPO}" no tiene la columna "${COLUMNA}". Columnas: ${(campo.options ?? []).map((o) => o.name).join(', ')}`,
    );

  return { proyecto: proyecto.id, campo: campo.id, opcion: opcion.id };
}

function itemsDelTablero(): ItemDeTablero[] {
  const { items } = json<{
    items: { id: string; status?: string; content?: { number?: number; type?: string; title?: string } }[];
  }>('gh', ['project', 'item-list', PROYECTO, '--owner', DUENIO, '--limit', '200', '--format', 'json']);

  return items
    .filter((i) => typeof i.content?.number === 'number')
    .map((i) => ({
      id: i.id,
      numero: i.content!.number!,
      tipo: i.content!.type === 'PullRequest' ? ('PullRequest' as const) : ('Issue' as const),
      estado: i.status ?? null,
      titulo: i.content!.title ?? '',
    }));
}

function main(): void {
  const log = correr('git', ['log', 'origin/main', '--format=%s%n%b']);
  const publicados = issuesQueCierra(log);
  const { proyecto, campo, opcion } = opcionDeColumna();
  const plan = planDePublicacion(itemsDelTablero(), publicados, COLUMNA);

  if (plan.mover.length === 0) {
    console.log(`Nada que mover: ${plan.yaEstan.length} issues ya están en "${COLUMNA}".`);
    return;
  }

  console.log(`${plan.mover.length} issues pasan a "${COLUMNA}"${seco ? ' (seco: no se toca nada)' : ''}:`);
  const fallados: number[] = [];
  for (const item of plan.mover) {
    console.log(`  #${item.numero}  ${item.estado ?? 'sin columna'} → ${COLUMNA}  ${item.titulo.slice(0, 52)}`);
    if (seco) continue;
    try {
      correr('gh', [
        'project',
        'item-edit',
        '--id',
        item.id,
        '--project-id',
        proyecto,
        '--field-id',
        campo,
        '--single-select-option-id',
        opcion,
      ]);
    } catch (error) {
      console.error(`  ↳ falló #${item.numero}: ${(error as Error).message.split('\n')[0]}`);
      fallados.push(item.numero);
    }
  }

  if (plan.yaEstan.length > 0) console.log(`Ya estaban: ${plan.yaEstan.map((i) => `#${i.numero}`).join(' ')}`);

  if (fallados.length > 0) {
    console.error(`\nNo se pudieron mover: ${fallados.map((n) => `#${n}`).join(' ')}`);
    process.exitCode = 1;
  }
}

main();
