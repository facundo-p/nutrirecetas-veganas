import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

/**
 * Un repo parado en `rama` con un merge a medio terminar: dos ramas tocaron la
 * misma línea, así que git dejó `MERGE_HEAD` y espera que alguien resuelva y
 * cierre. Es el estado exacto en el que el guard no tiene que estorbar.
 */
function repoConMergeTrabado(rama: string): string {
  const dir = repoEn(rama);
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
  git('config', 'user.email', 'test@test');
  git('config', 'user.name', 'test');
  writeFileSync(join(dir, 'f.txt'), 'base\n');
  git('add', 'f.txt');
  git('commit', '-qm', 'base');
  git('checkout', '-qb', 'otra');
  writeFileSync(join(dir, 'f.txt'), 'otra\n');
  git('commit', '-qam', 'otra');
  git('checkout', '-q', rama);
  writeFileSync(join(dir, 'f.txt'), `${rama}\n`);
  git('commit', '-qam', rama);
  try {
    git('merge', 'otra');
  } catch {
    // el conflicto es el punto del helper
  }
  if (!existsSync(join(dir, '.git', 'MERGE_HEAD'))) throw new Error('el merge no quedó trabado');
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

/**
 * El guard mira el string entero del comando. Sin distinguir la invocación de
 * sus argumentos, cualquier texto que nombre "git" y más adelante un verbo
 * prohibido queda bloqueado — y los cuerpos de los issues de este proyecto
 * hablan de git todo el tiempo.
 */
describe('el texto de los argumentos no es un comando', () => {
  test('deja crear un issue cuyo cuerpo habla de git y de merges', () => {
    const cuerpo =
      'el tag lo crea el workflow sobre el merge de main, y git describe no lo alcanza ' +
      'porque no es ancestro, así que ese merge commit queda afuera del rango';
    expect(correr(`gh issue create --body "${cuerpo}"`, repoEn('staging'))).toBe(0);
  });

  test('deja abrir un PR cuyo cuerpo nombra git, push y main', () => {
    const cuerpo = 'git describe falla acá y el push que importa es el de main, que hace Facu a mano';
    expect(correr(`gh pr create --body "${cuerpo}"`, repoEn('14-plan-semanal'))).toBe(0);
  });

  test('no es cosa de gh: cualquier texto sobre git pasa', () => {
    expect(correr('echo "para cerrar el merge hace falta git y después un commit"', repoEn('staging'))).toBe(0);
  });

  test('pero el subcomando real sigue contando, con opciones globales de git en el medio', () => {
    expect(correr('git -C /tmp/repo commit -m "feat: algo"', repoEn('staging'))).toBe(2);
    expect(correr('git --no-pager commit -m "feat: algo"', repoEn('staging'))).toBe(2);
    expect(correr('git -c user.name=x commit -m "feat: algo"', repoEn('staging'))).toBe(2);
  });

  test('y el guard no exige que git abra el comando: envuelto también cuenta', () => {
    // Acotar "git" a posición de comando sería el paso siguiente natural y
    // dejaría pasar esto. Un falso positivo cuesta un rodeo; este falso
    // negativo, datos.
    expect(correr('bash -c "git commit -m x"', repoEn('staging'))).toBe(2);
    expect(correr('npm test && git commit -m "feat: algo"', repoEn('staging'))).toBe(2);
  });
});

/**
 * Un merge que entra limpio commitea solo y el guard lo deja pasar; si hay
 * conflicto, cerrarlo a mano es la misma operación. Bloquear solo la segunda
 * hacía que la regla dependiera del azar del conflicto.
 */
describe('con un merge trabado en curso', () => {
  test('en staging deja cerrar el merge', () => {
    const repo = repoConMergeTrabado('staging');
    expect(correr('git commit --no-edit', repo)).toBe(0);
    expect(correr('git merge --continue', repo)).toBe(0);
  });

  test('la excepción dura lo que dura el merge', () => {
    const repo = repoConMergeTrabado('staging');
    expect(correr('git commit --no-edit', repo)).toBe(0);
    execFileSync('git', ['merge', '--abort'], { cwd: repo });
    expect(correr('git commit --no-edit', repo)).toBe(2);
  });

  test('en main no: a main no se commitea ni en medio de un merge', () => {
    expect(correr('git commit --no-edit', repoConMergeTrabado('main'))).toBe(2);
  });
});
