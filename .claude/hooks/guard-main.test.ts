import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, test } from 'vitest';

/**
 * El contrato del guard, hecho cumplir por máquina.
 *
 * El hook decide mirando dos cosas: la rama en la que está parado el repo y el
 * comando que Claude Code le pasa por stdin como JSON. Por eso cada caso corre
 * dentro de un repo git temporal parado en la rama que el caso necesita.
 *
 *   exit 2 = bloqueado    exit 0 = permitido
 *
 * La propiedad de "falla abierto" es deliberada: si el hook no puede parsear su
 * input, deja pasar. La regla también vive en CLAUDE.md.
 */

const HOOK = fileURLToPath(new URL('./guard-main.sh', import.meta.url));
const temporales: string[] = [];

/** Un repo git vacío parado en la rama pedida. `symbolic-ref` funciona sin commits. */
function repoEn(rama: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'guard-main-'));
  temporales.push(dir);
  execFileSync('git', ['init', '-q', '-b', rama], { cwd: dir });
  return dir;
}

/** Corre el hook como lo corre Claude Code: el comando llega por stdin como JSON. */
function correr(comando: string, cwd: string): number {
  const res = spawnSync('bash', [HOOK], {
    cwd,
    input: JSON.stringify({ tool_input: { command: comando } }),
    encoding: 'utf8',
  });
  return res.status ?? -1;
}

afterAll(() => {
  for (const dir of temporales) rmSync(dir, { recursive: true, force: true });
});

describe('parado en staging', () => {
  test('bloquea un commit común', () => {
    expect(correr('git commit -m "feat: algo"', repoEn('staging'))).toBe(2);
  });

  test('deja pasar el commit de release, que es la única excepción', () => {
    expect(correr('git commit -m "chore(release): v0.2.0"', repoEn('staging'))).toBe(0);
  });

  test('no se mete con los comandos de lectura', () => {
    const repo = repoEn('staging');
    expect(correr('git status', repo)).toBe(0);
    expect(correr('git log --oneline -5', repo)).toBe(0);
  });
});

describe('parado en una rama de issue', () => {
  test('deja commitear libremente', () => {
    expect(correr('git commit -m "feat: algo"', repoEn('14-plan-semanal'))).toBe(0);
  });
});

describe('parado en main', () => {
  test('bloquea commit y merge', () => {
    const repo = repoEn('main');
    expect(correr('git commit -m "lo que sea"', repo)).toBe(2);
    expect(correr('git merge staging', repo)).toBe(2);
  });

  test('bloquea también el commit de release: a main no se commitea nunca', () => {
    expect(correr('git commit -m "chore(release): v0.2.0"', repoEn('main'))).toBe(2);
  });
});

describe('sin importar dónde esté parado', () => {
  test('bloquea el push a main', () => {
    expect(correr('git push origin main', repoEn('14-plan-semanal'))).toBe(2);
  });

  test('bloquea borrar main', () => {
    expect(correr('git branch -D main', repoEn('staging'))).toBe(2);
  });

  test('ignora lo que no es git', () => {
    expect(correr('npm test', repoEn('staging'))).toBe(0);
  });
});
