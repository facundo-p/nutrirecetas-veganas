# Issues, PRs, tablero, versionado y `/release` — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la planificación en markdown y los commits directos a `staging` por un sistema de Issues, PRs con CI, tablero y releases versionados con `/release`.

**Architecture:** Todo el trabajo de este plan ocurre en **una rama propia con un PR abierto a `staging` desde la Task 1**, así el CI que se crea en esa misma tarea verifica cada commit siguiente y el sistema se estrena a sí mismo. La configuración de GitHub (labels, campos, vistas, issues) se hace por `gh` y GraphQL, no a mano. Lo único que queda para el navegador es un paso de dos clicks que la API no expone.

**Tech Stack:** `gh` CLI 2.87 · GitHub Actions · GitHub Projects v2 (GraphQL) · Vitest 4 · bash · Node 22.

**Spec:** `docs/superpowers/specs/2026-08-20-issues-prs-versionado-design.md`

## Global Constraints

- Idioma: **código en inglés, todo lo visible en español rioplatense**. Labels, columnas, títulos de issue, changelog y mensajes de error del hook van en castellano.
- Node **22** en CI (el local es 22.22.3). Actions: `actions/checkout@v4`, `actions/setup-node@v4`.
- Repo: `facundo-p/nutrirecetas-veganas`, público. Owner de proyectos: `facundo-p`.
- Commits **convencionales** (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`).
- Todo commit lleva el trailer `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- **Nunca** tocar `.artifacts/`, `src/domain/`, ni nada de la app. Este plan es infraestructura y documentación.
- El hook `.claude/hooks/guard-main.sh` **falla abierto** (exit 0) si no puede parsear su input: esa propiedad se mantiene.
- `npm test` y `npm run build` tienen que quedar verdes al final de cada task.

## Estructura de archivos

| Archivo | Responsabilidad | Task |
|---|---|---|
| `.github/workflows/ci.yml` | Tests + build en cada PR y push a `staging`/`main` | 1 |
| `.claude/hooks/guard-main.sh` | *(modificar)* Bloquear también commits directos a `staging` | 2 |
| `.claude/hooks/guard-main.test.ts` | Contrato del hook: qué bloquea y qué deja pasar | 2 |
| `vite.config.ts` | *(modificar)* Sumar `.claude/**/*.test.ts` al `include` de vitest | 2 |
| `.github/ISSUE_TEMPLATE/epica.yml` | Plantilla de épica (una por fase) | 3 |
| `.github/ISSUE_TEMPLATE/tarea.yml` | Plantilla de sub-issue | 3 |
| `.github/pull_request_template.md` | Cuerpo por defecto de todo PR | 3 |
| `CHANGELOG.md` | Qué cambió en cada versión, para el usuario | 7 |
| `.claude/skills/release/SKILL.md` | La skill `/release` | 7 |
| `.github/workflows/tag-release.yml` | Al mergear a `main`: tag + GitHub Release | 8 |
| `CLAUDE.md` | *(reescritura completa)* Reglas del proyecto, mínima expresión | 9 |
| `.claude/skills/cierre-fase/SKILL.md` | *(modificar)* Sin `05-roadmap.md`; cierra issues y llama a `/release` | 9 |
| `docs/*.md` | *(mover)* Los 6 docs de referencia que salen de `docs/plan/` | 5 |

---

### Task 1: Rama de trabajo, CI y PR abierto

Esta task crea el andamio del resto del plan: el issue, la rama, el CI y un PR en borrador que va a verificar cada commit siguiente.

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: nada.
- Produces: la rama `N-infraestructura-de-issues-prs-y-versionado` (con `N` el número del issue creado en el paso 1), el PR en borrador hacia `staging`, y el check de CI llamado **`verificar`** — que la Task 10 exige en verde.

- [ ] **Step 1: Crear el issue de bootstrap**

Todavía no existen labels; se agregan en la Task 3.

```bash
gh issue create \
  --title "Infraestructura: Issues, PRs, tablero, versionado y /release" \
  --body "Implementa el spec \`docs/superpowers/specs/2026-08-20-issues-prs-versionado-design.md\`.

Reemplaza la planificación en markdown y los commits directos a \`staging\` por Issues + PRs con CI + tablero + releases versionados.

Es el primer issue del repo y estrena el flujo que él mismo define."
```

Anotar el número que devuelve; se usa en todos los pasos siguientes como `N`.

- [ ] **Step 2: Crear la rama desde el issue**

```bash
gh issue develop N --checkout --base staging
git branch --show-current
```

Esperado: una rama tipo `N-infraestructura-de-issues-prs-y-versionado`. **Todo el resto del plan se commitea acá.**

- [ ] **Step 3: Escribir el workflow de CI**

Crear `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [staging, main]
  push:
    branches: [staging, main]

jobs:
  verificar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - run: npm ci

      # Incluye el contrato de temas y el de estilos.
      - name: Tests
        run: npm test

      # Regenera la semilla desde .artifacts/, valida el diff de ids inmutables,
      # compila TS y buildea Vite. Es el gate que /cierre-fase corre a mano.
      - name: Build
        run: npm run build
```

- [ ] **Step 4: Verificar que el CI corre localmente antes de pedírselo a GitHub**

```bash
npm ci && npm test && npm run build
```

Esperado: los tres verdes. Si el build falla acá, falla en CI: arreglarlo antes de seguir.

- [ ] **Step 5: Commit y push**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: tests y build en cada PR y push a staging/main

Primer workflow del repo. Node 22, npm test (incluye los contratos de
temas y estilos) y npm run build (regenera la semilla y valida el diff
de ids inmutables). Los renders quedan afuera a propósito: necesitan
navegador y un humano mirándolos.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
git push -u origin HEAD
```

- [ ] **Step 6: Abrir el PR en borrador**

```bash
gh pr create --draft --base staging \
  --title "Infraestructura: Issues, PRs, tablero, versionado y /release" \
  --body "Closes #N

Implementa \`docs/superpowers/specs/2026-08-20-issues-prs-versionado-design.md\`.

Queda en borrador hasta que el plan esté completo. Cada push re-corre el CI."
```

- [ ] **Step 7: Verificar que el CI arrancó y quedó verde**

```bash
gh pr checks --watch
```

Esperado: el check `verificar` en verde. Si falla, leer el log con `gh run view --log-failed` y arreglar antes de la Task 2.

---

### Task 2: El hook bloquea los commits directos a `staging`

**Files:**
- Modify: `.claude/hooks/guard-main.sh`
- Modify: `vite.config.ts` (el array `test.include`)
- Test: `.claude/hooks/guard-main.test.ts`

**Interfaces:**
- Consumes: la rama y el PR de la Task 1.
- Produces: el contrato del hook — **exit 2 = bloqueado, exit 0 = permitido**. La excepción reconocida es un mensaje de commit que contenga `chore(release)`, de la que depende el paso 7 de la skill `/release` (Task 7).

- [ ] **Step 1: Habilitar los tests de `.claude/` en vitest**

En `vite.config.ts`, dentro de `test`, cambiar el `include` (hoy `['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts']`):

```ts
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', '.claude/**/*.test.ts'],
```

- [ ] **Step 2: Escribir el test que falla**

Crear `.claude/hooks/guard-main.test.ts`:

```ts
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
```

- [ ] **Step 3: Correr el test y ver que falla**

```bash
npx vitest run .claude/hooks/guard-main.test.ts
```

Esperado: FALLA. Los casos de `main` y de push ya pasan (el hook viejo los cubre), pero **"bloquea un commit común"** en staging devuelve 0 en vez de 2.

- [ ] **Step 4: Extender el hook**

En `.claude/hooks/guard-main.sh`, insertar este bloque **después** del `if` que bloquea commits en `main` y **antes** del que bloquea el push a `main`:

```bash
if [ "$branch" = "staging" ] && printf '%s' "$cmd" | grep -qE '\bgit\b[^|;&]*\bcommit\b'; then
  if ! printf '%s' "$cmd" | grep -qF 'chore(release)'; then
    echo "BLOQUEADO por guard-main: 'staging' no recibe commits directos. Abrí la rama de su issue con 'gh issue develop N --checkout' y entrá por PR. La única excepción es el commit 'chore(release)' que escribe /release." >&2
    exit 2
  fi
fi
```

Y actualizar el comentario de cabecera del archivo, que hoy dice "todo se trabaja en 'staging'":

```bash
# guard-main: hace cumplir el flujo de ramas del proyecto.
#   - 'main' solo recibe releases: PR desde 'staging' mergeado a mano por Facu.
#   - 'staging' solo recibe PRs desde ramas de issue; la única excepción es el
#     commit 'chore(release)' de /release.
# Falla abierto (exit 0) si no puede parsear el input: la regla también vive en CLAUDE.md.
```

- [ ] **Step 5: Correr el test y ver que pasa**

```bash
npx vitest run .claude/hooks/guard-main.test.ts
```

Esperado: los 10 casos en verde.

- [ ] **Step 6: Confirmar que no rompió la suite entera**

```bash
npm test
```

Esperado: todo verde, incluido el contrato de temas.

- [ ] **Step 7: Commit y push**

```bash
git add .claude/hooks/guard-main.sh .claude/hooks/guard-main.test.ts vite.config.ts
git commit -m "$(cat <<'EOF'
feat(hook): guard-main también bloquea commits directos a staging

staging pasa a recibir trabajo solo por PR desde una rama de issue. La
única excepción es el commit chore(release) de /release, porque es el
que bumpea la versión antes de abrir el PR a main.

El contrato queda cubierto por un test que corre en el CI: sin él la
regla se degrada sola, como pasó con la de colores.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
git push
```

---

### Task 3: Labels y plantillas

**Files:**
- Create: `.github/ISSUE_TEMPLATE/epica.yml`
- Create: `.github/ISSUE_TEMPLATE/tarea.yml`
- Create: `.github/pull_request_template.md`

**Interfaces:**
- Consumes: la rama de la Task 1.
- Produces: los labels que la Task 6 asigna a cada issue y que el paso 4 de `/release` (Task 7) mapea a secciones del changelog. El mapeo es: `funcionalidad`→**Agregado**, `corrección`→**Corregido**, `datos`→**Datos**, `estilos`/`documentación`/`infra`→**Cambiado**.

- [ ] **Step 1: Crear los labels**

Los que GitHub trae por defecto (`bug`, `enhancement`, `documentation`, …) no se borran; simplemente no se usan.

```bash
# Fases — gris azulado
for n in 0 1 2 3 4; do
  gh label create "fase-$n" --color BFD4E0 --description "Fase $n del roadmap" --force
done

# Tipo — alimentan las secciones del changelog
gh label create "funcionalidad"  --color 2C9C43 --description "Funcionalidad nueva y visible"        --force
gh label create "corrección"     --color C21E56 --description "Arregla algo que estaba mal"          --force
gh label create "datos"          --color E8A33D --description "Corrige o completa datos de la semilla" --force
gh label create "estilos"        --color 9B72CF --description "CSS, tokens, temas"                    --force
gh label create "documentación"  --color 6E7781 --description "Docs, CLAUDE.md, lessons"              --force
gh label create "infra"          --color 24292F --description "CI, hooks, skills, tablero"            --force

# Marcadores
gh label create "épica"    --color 0E8A16 --description "Agrupa los sub-issues de una fase"     --force
gh label create "ruptura"  --color B60205 --description "Obliga al usuario a hacer algo: major" --force
gh label create "post-v1"  --color EDEDED --description "Fuera del alcance de la v1"            --force
```

- [ ] **Step 2: Verificar**

```bash
gh label list --limit 40
```

Esperado: los 14 labels nuevos, con sus descripciones en castellano.

- [ ] **Step 3: Plantilla de épica**

Crear `.github/ISSUE_TEMPLATE/epica.yml`:

```yaml
name: Épica de fase
description: Agrupa los entregables de una fase del roadmap
title: "Fase N — "
labels: ["épica"]
body:
  - type: textarea
    id: objetivo
    attributes:
      label: Objetivo
      description: Qué tiene que poder hacer la app al terminar esta fase, en una o dos oraciones.
    validations:
      required: true

  - type: textarea
    id: cierre
    attributes:
      label: Criterio de cierre
      description: Cómo se sabe que la fase terminó. Concreto y verificable.
      placeholder: "Planificar una semana real y hacer una compra real con la app."
    validations:
      required: true

  - type: textarea
    id: entregables
    attributes:
      label: Entregables
      description: Uno por sub-issue. Se vinculan como sub-issues una vez creados.
    validations:
      required: true

  - type: checkboxes
    id: checkpoint
    attributes:
      label: Checkpoint de cierre
      options:
        - label: "`npm test` y `npm run build` en verde"
        - label: "Renders generados y publicados (`/renders`)"
        - label: "Entrada en `lessons.md`"
        - label: "OK explícito de Facu"
        - label: "`/release` corrido"
```

- [ ] **Step 4: Plantilla de tarea**

Crear `.github/ISSUE_TEMPLATE/tarea.yml`:

```yaml
name: Tarea
description: Un entregable revisable, hijo de una épica
title: ""
body:
  - type: input
    id: epica
    attributes:
      label: Épica
      description: Número del issue de la fase a la que pertenece.
      placeholder: "#5"

  - type: textarea
    id: que
    attributes:
      label: Qué hay que hacer
    validations:
      required: true

  - type: textarea
    id: verificacion
    attributes:
      label: Cómo se verifica
      description: Qué test, qué pantalla o qué render prueba que está hecho.
    validations:
      required: true

  - type: textarea
    id: notas
    attributes:
      label: Notas
      description: Decisiones ya tomadas, invariantes que toca, cosas a no romper.
```

- [ ] **Step 5: Plantilla de PR**

Crear `.github/pull_request_template.md`:

```markdown
Closes #

## Qué cambia

<!-- Para el usuario, no para el diff. Una o dos oraciones. -->

## Checklist

- [ ] `npm test` en verde
- [ ] `npm run build` en verde
- [ ] Si tocó algo visual: renders generados y mirados
- [ ] Si el cambio *no* debía verse: baseline comparado con `cmp`
- [ ] Sin `style={{ }}` ni colores literales fuera de `src/styles/temas/`
```

- [ ] **Step 6: Commitear y confirmar que GitHub las parsea**

GitHub ignora en silencio las plantillas mal formadas, así que la única
verificación real es publicarlas y mirarlas:

```bash
git add .github/ISSUE_TEMPLATE/ .github/pull_request_template.md
git commit -m "$(cat <<'EOF'
feat(github): labels en castellano y plantillas de issue y PR

Los labels de tipo alimentan las secciones del CHANGELOG que escribe
/release: funcionalidad→Agregado, corrección→Corregido, datos→Datos.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
git push
```

Después del push, abrir `https://github.com/facundo-p/nutrirecetas-veganas/issues/new/choose` y confirmar que aparecen las dos plantillas. Si no aparecen, hay un error de YAML: revisar la indentación.

---

### Task 4: El tablero

**Files:** ninguno en el repo — todo es configuración de GitHub.

**Interfaces:**
- Consumes: nada del repo.
- Produces: el número de proyecto (`PROJECT_NUMBER`) y su id (`PROJECT_ID`), que la Task 6 usa para agregar cada issue y setearle el estado. Los nombres de las opciones de `Estado` son exactamente: `Backlog`, `En curso`, `En revisión de Facu`, `Hecho`, `Publicado`.

- [ ] **Step 1: Crear el proyecto y vincularlo al repo**

```bash
gh project create --owner facundo-p --title "Nutrirecetas Veganas"
gh project list --owner facundo-p
```

Anotar el número. Después:

```bash
PROJECT_NUMBER=<el número>
gh project link "$PROJECT_NUMBER" --owner facundo-p --repo facundo-p/nutrirecetas-veganas
PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner facundo-p --format json --jq .id)
echo "$PROJECT_ID"
```

- [ ] **Step 2: Renombrar `Status` a `Estado` y ponerle las opciones en castellano**

`gh project field-create` no edita campos existentes; hay que ir por GraphQL.

```bash
STATUS_ID=$(gh project field-list "$PROJECT_NUMBER" --owner facundo-p --format json \
  --jq '.fields[] | select(.name == "Status") | .id')

gh api graphql -f query='
mutation($field: ID!) {
  updateProjectV2Field(input: {
    fieldId: $field,
    name: "Estado",
    singleSelectOptions: [
      {name: "Backlog",             color: GRAY,   description: "Registrado, sin compromiso"},
      {name: "En curso",            color: BLUE,   description: "Hay una rama abierta"},
      {name: "En revisión de Facu", color: YELLOW, description: "Implementado, esperando el OK"},
      {name: "Hecho",               color: GREEN,  description: "Mergeado a staging"},
      {name: "Publicado",           color: PURPLE, description: "Salió en un release a main"}
    ]
  }) { projectV2Field { ... on ProjectV2SingleSelectField { name options { name } } } }
}' -F field="$STATUS_ID"
```

Esperado: devuelve `name: "Estado"` con las cinco opciones. **Si la mutación falla**, hacerlo en el navegador (Settings del proyecto → campo Status → renombrar y reemplazar opciones) y seguir; no bloquea el resto.

- [ ] **Step 3: Crear el campo `Estado PR`**

```bash
gh project field-create "$PROJECT_NUMBER" --owner facundo-p \
  --name "Estado PR" --data-type SINGLE_SELECT \
  --single-select-options "Borrador,CI corriendo,Listo para mergear,Mergeado"

gh project field-list "$PROJECT_NUMBER" --owner facundo-p
```

Esperado: los dos campos, `Estado` y `Estado PR`, con sus opciones.

- [ ] **Step 4: Crear las dos vistas**

La vista `Table` que GitHub crea por defecto se deja. Se agregan dos de tipo board:

```bash
for VISTA in "Issues" "PRs"; do
  gh api graphql -f query='
  mutation($project: ID!, $name: String!) {
    createProjectV2View(input: {projectId: $project, name: $name, layout: BOARD_LAYOUT}) {
      projectV2View { id name }
    }
  }' -F project="$PROJECT_ID" -F name="$VISTA"
done
```

Anotar los dos ids que devuelve.

- [ ] **Step 5: Ponerles el filtro a cada vista**

```bash
gh api graphql -f query='
mutation($view: ID!, $filter: String!) {
  updateProjectV2View(input: {viewId: $view, filter: $filter}) { projectV2View { name filter } }
}' -F view="<id de la vista Issues>" -F filter="is:issue"

gh api graphql -f query='
mutation($view: ID!, $filter: String!) {
  updateProjectV2View(input: {viewId: $view, filter: $filter}) { projectV2View { name filter } }
}' -F view="<id de la vista PRs>" -F filter="is:pr"
```

- [ ] **Step 6: El paso manual — dos clicks, una sola vez**

La agrupación por columna **no es seteable por API**: `ProjectV2ViewConfigurationInput` solo acepta `visibleFieldIds`. Verificado antes de escribir el spec.

La vista **Issues** ya agrupa sola por `Estado`, porque un board layout agrupa por el campo de estado del proyecto. La vista **PRs** hay que agruparla a mano:

1. Abrir el proyecto → pestaña **PRs**.
2. Menú `⌄` de la vista → **Group by** → **Estado PR**.

Y dejarlo escrito en el README del proyecto, para que la próxima vez que se
recree o se copie el tablero nadie tenga que redescubrirlo:

```bash
gh project edit "$PROJECT_NUMBER" --owner facundo-p \
  --description "Tablero de Nutrirecetas Veganas: ciclo de vida de issues y de PRs." \
  --readme "## Las dos vistas

**Issues** — el ciclo de vida de cada tarea, agrupado por \`Estado\`:
Backlog → En curso → En revisión de Facu → Hecho → Publicado.

**PRs** — agrupado por \`Estado PR\`: Borrador → CI corriendo → Listo para
mergear → Mergeado.

## Ojo al recrear el tablero

La agrupación por columna **no se puede setear por API**: \`ProjectV2View
ConfigurationInput\` solo acepta \`visibleFieldIds\`. La vista de Issues agrupa
sola por ser \`Estado\` el campo de estado del proyecto, pero la de PRs hay que
agruparla a mano: menú \`⌄\` de la vista → Group by → Estado PR."
```

- [ ] **Step 7: Prender los workflows nativos**

En Settings del proyecto → **Workflows**, activar:

- *Item added to project* → `Estado` = **Backlog**
- *Pull request merged* → `Estado PR` = **Mergeado**
- *Item closed* → `Estado` = **Hecho**

Las columnas del medio se mueven arrastrando, una vez por tarea.

- [ ] **Step 8: Verificar de punta a punta**

Agregar el PR de la Task 1 al tablero y confirmar que cae en la vista de PRs:

```bash
gh project item-add "$PROJECT_NUMBER" --owner facundo-p \
  --url "$(gh pr view --json url --jq .url)"
gh project item-list "$PROJECT_NUMBER" --owner facundo-p
```

Esperado: el PR aparece, y en la vista **PRs** del navegador se ve como tarjeta.

---

### Task 5: Migrar `docs/plan/` a `docs/`

**Files:**
- Move: los 6 docs de referencia · Delete: los 3 de planificación
- Modify: los punteros internos entre docs que quedaron rotos

**Interfaces:**
- Consumes: nada.
- Produces: las rutas finales que la Task 9 cita en los punteros de `CLAUDE.md`: `docs/auditoria-dataset.md`, `docs/arquitectura.md`, `docs/funcionalidades.md`, `docs/estetica-e-interaccion.md`, `docs/decisiones-de-datos.md`, `docs/riesgos.md`.

- [ ] **Step 1: Mover los seis que sobreviven**

```bash
git mv docs/plan/01-auditoria.md              docs/auditoria-dataset.md
git mv docs/plan/02-arquitectura.md           docs/arquitectura.md
git mv docs/plan/03-funcionalidades.md        docs/funcionalidades.md
git mv docs/plan/04-interaccion-y-estetica.md docs/estetica-e-interaccion.md
git mv docs/plan/fase1-gate-datos.md          docs/decisiones-de-datos.md
git mv docs/plan/06-riesgos-y-preguntas.md    docs/riesgos.md
```

- [ ] **Step 2: Sacar de `docs/riesgos.md` las preguntas ya resueltas**

Sobreviven la tabla de riesgos y el registro de decisiones tomadas. La sección "Preguntas abiertas" se reemplaza entera por:

```markdown
## Preguntas abiertas

Las 1 y 2 (`rendimiento_g` de los preparados, tabla de porciones) se resolvieron
en el gate de Fase 1 → `docs/decisiones-de-datos.md`.

Las que siguen abiertas viven como issues en el tablero: sustitutos de texto
libre, hosting, y la ficha de `uva`.
```

- [ ] **Step 3: Borrar los tres de planificación**

```bash
git rm docs/plan/05-roadmap.md
git rm docs/plan/fase1-implementacion.md
git rm docs/plan/fase2-implementacion.md
rmdir docs/plan
```

`fase1-implementacion.md` y `fase2-implementacion.md` se borran sin migrar su detalle: lo que importa de ellos ya está en `lessons.md` (lecciones) y en el código (la implementación). `05-roadmap.md` se migra a las épicas en la Task 6 — **no borrarlo antes de tenerlo abierto para copiar los entregables**.

- [ ] **Step 4: Encontrar los punteros rotos**

```bash
grep -rn "docs/plan\|01-auditoria\|02-arquitectura\|03-funcionalidades\|04-interaccion\|05-roadmap\|06-riesgos\|fase1-gate-datos\|fase1-implementacion\|fase2-implementacion" \
  --include="*.md" --include="*.ts" --include="*.tsx" --include="*.json" \
  . | grep -v node_modules | grep -v "docs/superpowers"
```

Esperado: apariciones en `CLAUDE.md` (se arregla en la Task 9), `README.md`, `lessons.md` y entre los propios docs movidos.

- [ ] **Step 5: Arreglarlos**

Reemplazar cada ruta vieja por la nueva según la tabla del Step 1. Donde el puntero era a `05-roadmap.md`, reemplazar por el tablero de issues: `https://github.com/users/facundo-p/projects/PROJECT_NUMBER`.

`CLAUDE.md` se deja para la Task 9, que lo reescribe entero.

- [ ] **Step 6: Verificar que no quedó ninguno**

```bash
grep -rn "docs/plan" --include="*.md" . | grep -v node_modules | grep -v "docs/superpowers"
```

Esperado: solo las menciones dentro de `CLAUDE.md`, que la Task 9 resuelve.

- [ ] **Step 7: Commit y push**

```bash
git add -A docs README.md lessons.md
git commit -m "$(cat <<'EOF'
docs: la planificación sale del markdown y los docs de referencia salen de plan/

docs/plan/ desaparece. Los seis docs que son conocimiento del dominio
—auditoría, arquitectura, funcionalidades, estética, decisiones de datos
y riesgos— pasan a docs/ con nombres que dicen qué son. El roadmap y los
planes de fase se migran a épicas del tablero.

lessons.md se queda: es memoria narrativa, no planificación.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
git push
```

---

### Task 6: Poblar el tablero con la historia y el futuro

**Files:** ninguno en el repo.

**Interfaces:**
- Consumes: los labels (Task 3), `PROJECT_NUMBER` (Task 4), y `docs/plan/05-roadmap.md` **abierto desde git** para copiar los entregables. La Task 5 ya lo borró, así que se lo recupera del commit anterior a su borrado, sin depender de cuántos commits pasaron desde entonces:
  ```bash
  git show "$(git rev-list -1 HEAD -- docs/plan/05-roadmap.md)^:docs/plan/05-roadmap.md"
  ```
- Produces: los issues que la Task 7 usa al probar `/release`, y los números de épica que la Task 9 cita en `/cierre-fase`.

- [ ] **Step 1: Crear las cinco épicas**

```bash
gh issue create --label "épica,fase-0" --title "Fase 0 — Plan y dirección visual" --body "**Cerrada el 2026-08-19.**

Plan del proyecto, CLAUDE.md, hook guard-main, y la dirección visual definida tras 5 iteraciones de mockups (Render 0) → Propuesta C \"Carta de estación\".

El detalle vive en \`lessons.md\`."

gh issue create --label "épica,fase-1" --title "Fase 1 — Dataset, cimientos y recetario" --body "**Cerrada el 2026-08-19.**

Pipeline \`build-seed\` con la semilla canónica, gate de datos revisado y aplicado, motor nutricional puro con golden tests, y la UI del recetario: búsqueda, filtros, detalle con nutrición en vivo, ingredientes y glosario.

El detalle vive en \`lessons.md\`."

gh issue create --label "épica,fase-2" --title "Fase 2 — Perfil, cocinar y registrar" --body "**Objetivo**: cerrar el ciclo cocinar → registrar → semáforo del día.

**Criterio de cierre**: ciclo completo funcionando ✅, backup round-trip testeado ✅, renders revisados por Facu ← acá estamos.

Decisiones de producto tomadas al arrancar:
1. El semáforo cuenta *porciones comidas*, no cocciones. Al registrar se declara cuántas se comieron; el resto queda como sobras.
2. En esta fase el semáforo mide solo cocciones de la app, con aviso explícito de que es parcial."

gh issue create --label "épica,fase-3" --title "Fase 3 — Compras y semana" --body "**Objetivo**: planificar la semana y comprar con la app.

**Criterio de cierre**: planificar una semana real y hacer una compra real con la app; renders revisados."

gh issue create --label "épica,fase-4" --title "Fase 4 — Recetas propias y robustez (v1)" --body "**Objetivo**: cerrar la v1.

**Criterio de cierre**: v1 completa → \`/release 1.0.0\` → PR staging→main para aprobación explícita de Facu. Retro de backlog para decidir la siguiente etapa."
```

Anotar los números. Se los llama `E0`…`E4`.

- [ ] **Step 2: Sub-issues de la Fase 2**

Los cinco primeros nacen cerrados; el sexto es el único abierto.

```bash
gh issue create --label "fase-2,funcionalidad" --title "Onboarding de perfil real con suplementos" \
  --body "Datos reales del usuario y suplementos declarados → RDA personalizadas y semáforo por porción. Sin placeholders."

gh issue create --label "fase-2,funcionalidad" --title "Escalado de recetas con avisos en Detalle" \
  --body "Escalado lineal con los avisos de la política acordada."

gh issue create --label "fase-2,funcionalidad" --title "Flujo Cocinar ahora" \
  --body "Personalización (desmarcar, sustituir, agregar) con recálculo y advertencias por \`imprescindible\`/\`funcion\` → pasos con tipografía grande y wake lock → registro de cocción con variaciones, notas y porciones."

gh issue create --label "fase-2,funcionalidad" --title "Overlays: subir IC, notas y favoritas" \
  --body "Subir el índice de confianza al probar y aprobar una receta; notas propias; favoritas."

gh issue create --label "fase-2,funcionalidad" --title "Export/import y recordatorio de backup" \
  --body "El primer dato de usuario estrena la red de seguridad. Round-trip testeado."

gh issue create --label "fase-2" --title "Revisar los renders de la Fase 2" \
  --body "Generar los renders con \`/renders\` en los tres temas y publicarlos para el OK de Facu. Es lo único que falta para cerrar la fase."
```

- [ ] **Step 3: Sub-issues de la Fase 3**

```bash
gh issue create --label "fase-3,funcionalidad" --title "Lista de compras consolidada y modo verdulería" \
  --body "Multi-selección de recetas → lista consolidada: gramos primero, unidades de referencia, estacionalidad, agrupada por góndola. Más un modo verdulería que funcione offline.

Ojo: 17 frescos no tienen \`peso_por_unidad\`, así que muestran solo gramos."

gh issue create --label "fase-3,funcionalidad" --title "Planificador semanal con semáforo proyectado" \
  --body "Semáforo proyectado en vivo (día y semana móvil de 7 días) combinando el plan con las cocciones ya registradas."

gh issue create --label "fase-3,funcionalidad" --title "Pantalla Hoy completa" \
  --body "Semáforo del día + plan del día + accesos rápidos."
```

- [ ] **Step 4: Sub-issues de la Fase 4**

```bash
gh issue create --label "fase-4,funcionalidad" --title "Carga y edición de recetas propias" \
  --body "Líneas con \`funcion\` e \`imprescindible\`, pasos, guarda."

gh issue create --label "fase-4,funcionalidad" --title "Convertir una cocción en receta propia" \
  --body "Desde una cocción con variaciones, con linaje \`deriva_de\`."

gh issue create --label "fase-4,datos" --title "Actualización de semilla end-to-end" \
  --body "Simulacro de semilla v2: deprecaciones y overlays huérfanos. Contrato: un id se depreca, no se renombra."

gh issue create --label "fase-4,infra" --title "Pulido PWA final" \
  --body "Onboarding de instalación en iOS, migraciones con fixtures, auto-export pre-migración, Lighthouse offline e instalable.

Mitiga el riesgo #1 del proyecto: la purga de storage de Safari a los 7 días."
```

- [ ] **Step 5: Tareas de datos y sueltos**

```bash
gh issue create --label "datos" --title "peso_por_unidad de 17 frescos usados en recetas" \
  --body "Apio, coliflor, puerro, repollo y otros no tienen \`peso_por_unidad\` en \`equivalencias.json\`. Mientras tanto la lista de compras muestra solo gramos para esos.

Del gate de Fase 1."

gh issue create --label "datos" --title "Ficha de ingrediente para la uva" \
  --body "Hoy aparece en estacionalidad pero se descarta al construir la semilla. Decidir: ficha mínima, o dejarla solo en estacionalidad."

gh issue create --label "datos" --title "Cargar vitamina K" \
  --body "Ningún ingrediente trae \`vitk_ug\`, así que siempre se muestra \"sin datos\". Cargarla para las hojas verdes la volvería útil."

gh issue create --label "datos" --title "Mapear los sustitutos de texto libre" \
  --body "100 de 166 no resuelven a un id. Se mapean progresivamente, empezando por las recetas más cocinadas. En la v1 quedan textuales."

gh issue create --label "infra" --title "Decidir el hosting" \
  --body "Para compartir la app con amigos hace falta un deploy estático público. Cualquiera sirve para una SPA estática: GitHub Pages, Netlify, Vercel.

Es la pregunta 4 de \`docs/riesgos.md\`. No bloquea los releases 0.x."

gh issue create --label "post-v1" --title "Backlog post-v1" \
  --body "Registrado, no descartado. Se retoma en la retro del cierre de la v1:

- [ ] Modo cocina manos libres completo
- [ ] Despensa y freezer
- [ ] Detección automática de variaciones repetidas
- [ ] Reglas de utensilios como avisos
- [ ] Sync opcional vía archivo en la nube del usuario
- [ ] Auditoría USDA de los ~20 ingredientes más usados"
```

- [ ] **Step 6: Vincular los sub-issues a sus épicas**

`gh` no tiene comando para sub-issues; se hace con la mutación `addSubIssue`, que toma **node ids**, no números.

```bash
# Node id de un issue, por número:
id_de() {
  gh issue view "$1" --json id --jq .id
}

vincular() {  # vincular <número de la épica> <número del sub-issue>
  gh api graphql -f query='
  mutation($padre: ID!, $hijo: ID!) {
    addSubIssue(input: {issueId: $padre, subIssueId: $hijo}) {
      issue { number title }
    }
  }' -F padre="$(id_de "$1")" -F hijo="$(id_de "$2")"
}
```

Vincular cada sub-issue de los Steps 2, 3 y 4 a su épica (`E2`, `E3`, `E4`). Los issues del Step 5 **no se vinculan**: son sueltos a propósito.

Las épicas `E0` y `E1` no llevan sub-issues: su detalle vive en `lessons.md`.

- [ ] **Step 7: Cerrar lo que ya está hecho**

```bash
gh issue close E0 E1 --reason completed
# Y los cinco sub-issues cerrados de la Fase 2 (Step 2, todos menos "Revisar los renders"):
gh issue close <n1> <n2> <n3> <n4> <n5> --reason completed
```

- [ ] **Step 8: Agregar todo al tablero y ponerle estado a cada uno**

```bash
for n in $(gh issue list --state all --limit 60 --json number --jq '.[].number'); do
  gh project item-add "$PROJECT_NUMBER" --owner facundo-p \
    --url "https://github.com/facundo-p/nutrirecetas-veganas/issues/$n"
done
```

Después, en la vista **Issues** del navegador, acomodar las columnas:

| Issue | Columna |
|---|---|
| `E0`, `E1` y los 5 sub-issues cerrados de Fase 2 | **Hecho** |
| `E2` y "Revisar los renders de la Fase 2" | **En revisión de Facu** |
| Todo lo demás | **Backlog** |

- [ ] **Step 9: Verificar**

```bash
gh issue list --state all --limit 60
gh project item-list "$PROJECT_NUMBER" --owner facundo-p
```

Esperado: **25 issues** en el tablero — 5 épicas, 13 sub-issues (6 de Fase 2, 3 de Fase 3, 4 de Fase 4), 4 de datos, hosting, backlog post-v1, y el de bootstrap de la Task 1. En el navegador, `E2` muestra su barra de progreso en 5/6.

---

### Task 7: `CHANGELOG.md` y la skill `/release`

**Files:**
- Create: `CHANGELOG.md`
- Create: `.claude/skills/release/SKILL.md`

**Interfaces:**
- Consumes: el label de tipo de cada issue (Task 3) y el hook con la excepción `chore(release)` (Task 2).
- Produces: la skill `/release [versión]`, que la Task 9 cita en `CLAUDE.md` y en `/cierre-fase`, y el formato de encabezado `## [X.Y.Z] — YYYY-MM-DD` del que depende el `awk` de la Task 8.

- [ ] **Step 1: Crear el `CHANGELOG.md` inicial**

```markdown
# Changelog

Qué cambió en cada versión de Nutrirecetas Veganas, contado desde lo que se ve al
usarla. Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

El criterio para decidir qué número sube está en `CLAUDE.md`.

## [No publicado]

Lo que está en `staging` y todavía no salió en un release.

### Cambiado
- La planificación se mudó de `docs/plan/` a Issues, el trabajo entra por PR con
  CI, y los releases se arman con `/release`. (#1)
```

- [ ] **Step 2: Escribir la skill**

Crear `.claude/skills/release/SKILL.md`:

````markdown
---
name: release
description: Arma un release: propone el número de versión, escribe el CHANGELOG, bumpea package.json y abre el PR de staging a main con el CI en verde. Usar cuando Facu aprobó una versión y hay que publicarla.
---

# /release — armar un release

Acepta una versión opcional: `/release 0.3.0`. Sin parámetro, la deriva.

**Frena en el paso 9. No mergea, no taggea, no publica.** El merge lo hace Facu a
mano; el tag y el GitHub Release los crea `tag-release.yml` solo.

## 1. Verificar el terreno

```bash
git branch --show-current   # tiene que decir: staging
git status --porcelain      # tiene que estar vacío
git fetch origin && git status -sb | head -1
git rev-list --count origin/main..staging
```

Si no está parado en `staging`, si el árbol está sucio, si la rama está
desincronizada con `origin`, o si `staging` no está por delante de `main`:
**parar y decirlo**. No arreglarlo por cuenta propia.

## 2. Calcular el rango

```bash
git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD
```

El rango es `<eso>..staging`. Sin tags todavía, arranca en el commit raíz.

## 3. Derivar la versión

```bash
git log <rango> --format='%s%n%b'
```

| Encuentra | Propone |
|---|---|
| `feat!:` · `BREAKING CHANGE:` · un issue cerrado con label `ruptura` | major — o **minor si <1.0.0** |
| `feat:` | minor |
| `fix:` `perf:` `style:` `refactor:` `docs:` `test:` `chore:` | patch |

Gana el más alto. Aplicar los desempates de `CLAUDE.md`, sobre todo el de datos:
corregir la semilla es patch, salvo que cambie un id o borre un ingrediente o una
receta — eso deja overlays huérfanos y es major.

**Decir siempre por qué**, citando el commit que lo disparó:

> Propongo **0.3.0** (minor): `feat(compras): lista consolidada` agrega
> funcionalidad visible y ningún cambio obliga a Facu a hacer nada.

`/release 1.0.0` es la única forma de llegar al 1.0.0: la regla 4 impide
proponerlo solo. Que la app se declare versión 1 tiene que ser una decisión.

## 4. Juntar las novedades

```bash
git log <rango> --format='%s'
gh pr list --state merged --base staging --limit 100 \
  --json number,title,mergedAt,closingIssuesReferences
```

Agrupar por el label de tipo del issue que cada PR cerró:

| Label | Sección |
|---|---|
| `funcionalidad` | **Agregado** |
| `corrección` | **Corregido** |
| `datos` | **Datos** |
| `estilos` · `documentación` · `infra` | **Cambiado** |
| lo que se quitó | **Quitado** |

## 5. Escribir la entrada del changelog

Reemplazar el contenido de `## [No publicado]` por la entrada nueva, arriba de
todo, y dejar `## [No publicado]` vacío.

**Cada línea dice qué cambió para Facu, no qué commit hubo.** Si una línea se
puede leer sin saber nada de git y sigue significando algo, está bien escrita.

```markdown
## [0.2.0] — 2026-08-21

### Agregado
- Onboarding de perfil real con suplementos: el semáforo ahora usa tus RDA. (#8)
- Flujo **Cocinar ahora**: personalización con recálculo en vivo, pasos con
  tipografía grande y wake lock, y registro de cocción. (#9)

### Datos
- La margarina pasa a ser el sustituto de la manteca vegana. (#7)
```

El encabezado va exacto así: `## [X.Y.Z] — YYYY-MM-DD`, con raya (—), porque
`tag-release.yml` lo parsea para armar el cuerpo del Release.

## 6. Bumpear la versión

```bash
npm version <versión> --no-git-tag-version
```

## 7. Commitear en staging

Es la única excepción que `guard-main` permite sobre `staging`, y depende de que
el mensaje diga literalmente `chore(release)`:

```bash
git add CHANGELOG.md package.json package-lock.json
git commit -m "chore(release): v<versión>"
git push
```

## 8. Abrir el PR a main

```bash
gh pr create --base main --head staging \
  --title "Release v<versión>" \
  --body "<la entrada del changelog + los issues que cierra>"
```

**Merge commit, no squash**: así `main` y `staging` no divergen y el próximo
release parte de un ancestro común.

## 9. Esperar el CI y entregar el link

```bash
gh pr checks --watch
```

Verde → pasarle el link a Facu y **parar ahí**. Rojo → decir qué falló y no
tocar nada más.

## Después, sin intervención

Facu mergea con **merge commit**. `tag-release.yml` detecta el push a `main`, lee
la versión de `package.json`, crea el tag `vX.Y.Z` y publica el GitHub Release con
la sección del changelog.

Al terminar: mover a **Publicado** los issues del release en el tablero.
````

- [ ] **Step 3: Verificar que la skill se registra**

```bash
ls .claude/skills/
head -5 .claude/skills/release/SKILL.md
```

Esperado: la carpeta `release/` junto a `cierre-fase/` y `renders/`, y un frontmatter con `name: release`.

- [ ] **Step 4: Ensayo en seco de la derivación de versión**

Sin ejecutar la skill, correr a mano lo que hace su paso 3 y confirmar que el resultado es el esperado:

```bash
git log $(git rev-list --max-parents=0 HEAD)..staging --format='%s' | \
  sed -E 's/(\(.*\))?(!)?:.*/\1\2/' | sort | uniq -c | sort -rn
```

Esperado: predominan `feat`, y no hay ningún `feat!`. O sea: `/release` sobre `staging` propondría **0.2.0** (minor, y no major por la regla 4). Ese es el número que la Task 10 anticipa.

- [ ] **Step 5: Commit y push**

```bash
git add CHANGELOG.md .claude/skills/release/SKILL.md
git commit -m "$(cat <<'EOF'
feat(release): CHANGELOG.md y la skill /release

/release propone el número de versión desde los commits convencionales
—explicando por qué—, escribe la entrada del changelog redactada para el
usuario, bumpea package.json y abre el PR a main. Frena con el CI en
verde: el merge lo hace Facu.

El 1.0.0 no se propone solo: hay que pedirlo con /release 1.0.0.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
git push
```

---

### Task 8: Tag y Release automáticos al mergear a `main`

**Files:**
- Create: `.github/workflows/tag-release.yml`

**Interfaces:**
- Consumes: el formato de encabezado `## [X.Y.Z] — YYYY-MM-DD` que escribe `/release` (Task 7), y `version` de `package.json`.
- Produces: el tag `vX.Y.Z`, del que depende el paso 2 de `/release` para calcular el rango del release siguiente.

- [ ] **Step 1: Escribir el workflow**

Crear `.github/workflows/tag-release.yml`:

```yaml
name: Tag y Release

# Al mergear el PR de release, la versión ya está en package.json: de ahí sale
# el tag. Si el push a main no trae una versión nueva, no hace nada.
on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  publicar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Leer la versión
        id: v
        run: echo "version=$(node -p "require('./package.json').version")" >> "$GITHUB_OUTPUT"

      - name: ¿El tag ya existe?
        id: tag
        run: |
          if git rev-parse "v${{ steps.v.outputs.version }}" >/dev/null 2>&1; then
            echo "existe=si" >> "$GITHUB_OUTPUT"
          else
            echo "existe=no" >> "$GITHUB_OUTPUT"
          fi

      # La sección del changelog de esta versión, sin su encabezado: va como
      # cuerpo del Release. El separador es una raya (—), no un guion.
      - name: Extraer la sección del changelog
        if: steps.tag.outputs.existe == 'no'
        run: |
          awk -v v="${{ steps.v.outputs.version }}" '
            $0 ~ "^## \\[" v "\\]" { dentro = 1; next }
            dentro && /^## \[/     { exit }
            dentro                 { print }
          ' CHANGELOG.md > cuerpo.md
          test -s cuerpo.md || { echo "CHANGELOG.md no tiene sección para v${{ steps.v.outputs.version }}"; exit 1; }
          cat cuerpo.md

      - name: Crear el tag y publicar el Release
        if: steps.tag.outputs.existe == 'no'
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          git tag "v${{ steps.v.outputs.version }}"
          git push origin "v${{ steps.v.outputs.version }}"
          gh release create "v${{ steps.v.outputs.version }}" \
            --title "v${{ steps.v.outputs.version }}" \
            --notes-file cuerpo.md
```

- [ ] **Step 2: Probar el `awk` contra un changelog de verdad**

El workflow recién corre al mergear a `main`, así que la parte frágil se prueba ahora, local:

```bash
cat > /tmp/prueba-changelog.md <<'EOF'
# Changelog

## [No publicado]

## [0.2.0] — 2026-08-21

### Agregado
- Onboarding de perfil real. (#8)

### Datos
- La margarina reemplaza a la manteca vegana. (#7)

## [0.1.0] — 2026-08-19

### Agregado
- Recetario navegable offline.
EOF

awk -v v="0.2.0" '
  $0 ~ "^## \\[" v "\\]" { dentro = 1; next }
  dentro && /^## \[/     { exit }
  dentro                 { print }
' /tmp/prueba-changelog.md
```

Esperado: solo las secciones **Agregado** y **Datos** de 0.2.0. Ni el encabezado, ni nada de 0.1.0, ni de "No publicado".

- [ ] **Step 3: Verificar que el YAML parsea**

```bash
node -e "console.log(require('fs').readFileSync('.github/workflows/tag-release.yml','utf8').length + ' bytes')"
git add .github/workflows/tag-release.yml
git commit -m "$(cat <<'EOF'
ci: al mergear a main, tag y GitHub Release automáticos

Lee la versión de package.json, verifica que el tag no exista, y publica
el Release con la sección del changelog como cuerpo. Sin esto el tag se
olvida, y sin tag /release no puede calcular el rango del siguiente.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
git push
```

Tras el push, confirmar en `https://github.com/facundo-p/nutrirecetas-veganas/actions` que el workflow aparece listado y sin errores de sintaxis.

---

### Task 9: `CLAUDE.md` reescrito y `/cierre-fase` actualizada

**Files:**
- Rewrite: `CLAUDE.md`
- Modify: `.claude/skills/cierre-fase/SKILL.md`

**Interfaces:**
- Consumes: las rutas de la Task 5, los números de épica de la Task 6, la skill `/release` de la Task 7.
- Produces: nada que otra task consuma.

- [ ] **Step 1: Guardar el viejo para poder comparar**

```bash
git show HEAD:CLAUDE.md > /tmp/claude-md-viejo.md
grep -c "" /tmp/claude-md-viejo.md
```

- [ ] **Step 2: Reescribir `CLAUDE.md` entero**

Criterio: **una regla, una oración**. El "por qué" sobrevive solo cuando sin él la regla se aplica mal. Lo que ya está escrito en otro lado se reemplaza por un puntero. **Se comprime, no se recorta**: los 8 invariantes y las 8 reglas de estilo se mantienen todos.

Contenido completo:

````markdown
# CLAUDE.md — Nutrirecetas Veganas

PWA personal de recetas veganas con base nutricional. Un usuario por dispositivo, sin backend, offline-first, mantenida por una persona en su tiempo libre: **simplicidad de mantenimiento por sobre sofisticación, siempre**.

Idioma: código en inglés, UI y docs en **español rioplatense**.

## Git y flujo de trabajo (duras)

- **La planificación vive en Issues**, no en markdown: una épica por fase, sub-issues por entregable.
- **Una rama por issue**: `gh issue develop N --checkout`. Nunca commitear directo a `staging`; el hook `.claude/hooks/guard-main.sh` lo bloquea.
- **El trabajo entra a `staging` por PR** con `Closes #N`, CI en verde y squash merge.
- **`main` solo recibe releases**: el PR que abre `/release`, mergeado a mano por Facu con merge commit. Nunca commitear ni pushear a `main`.
- `.artifacts/` es **read-only**. Toda corrección de datos va a `scripts/build-seed/curated-tables.ts`.

## Versionado

`MAJOR.MINOR.PATCH`, redefinido para una app sin API pública:

- **MAJOR** — cambia el contrato con los datos del usuario o el alcance del producto. En la práctica: **si antes de actualizar hay que hacer algo** (backup, rehacer el onboarding), es major.
- **MINOR** — funcionalidad nueva y visible que no obliga a nada.
- **PATCH** — todo lo demás.

Desempates: (1) gana el más alto; (2) corregir datos de la semilla es patch, salvo que cambie un id o borre un ingrediente o receta → major; (3) tema nuevo es minor, ajustar tokens es patch; (4) antes de 1.0.0 no hay major derivado — una ruptura sube el minor, y el salto a 1.0.0 se pide a mano con `/release 1.0.0`; (5) las dependencias solas no justifican un release.

`/release` propone el número, escribe `CHANGELOG.md` y abre el PR a `main`. No mergea.

## Invariantes del dominio (no negociables, vienen del dataset)

1. **El gramo es la unidad canónica**: `g_aprox` es la única fuente de verdad para cálculo; `unidad` es solo display.
2. La nutrición **se calcula desde los ingredientes**; `perfil_nutricional_porcion_aprox` no se usa (45 % de desvíos >30 %).
3. **El semáforo evalúa cada nutriente en SU ventana** (`dia` | `semana` móvil de 7 días), nunca por comida individual.
4. **Un suplemento declarado apaga la exigencia alimentaria** de ese nutriente (`cubierto_por_suplemento`).
5. **La incertidumbre se muestra**: rangos como bandas, IC 1-10 visible, cobertura reportada. Nulos jamás son cero en silencio.
6. **Alerta B12 obligatoria**: si una receta usa levadura nutricional como fuente de B12, advertir que muchas marcas argentinas no están fortificadas. Es seguridad, no cosmética.
7. El UL de magnesio aplica solo a suplementos: nunca alertar exceso de Mg alimentario.
8. **La app informa, no diagnostica.** Fuera de alcance: embarazo, lactancia, menores, condiciones médicas.

## Estilos (duras al escribir código nuevo)

1. **Cero estilo en los `.tsx`**: ni `style={{ }}`, ni objetos de estilo, ni `<style>`, ni CSS-in-JS, ni CSS Modules. El TSX pone `className`; el CSS decide color, tamaño y forma.
2. **Una hoja por carpeta de `src/ui/`**, en `src/styles/pantallas/`: `cook/`→`cocina.css`, `diary/`→`diario.css`, `recipes/`→`recetario.css`, `recipe-detail/`→`receta.css`, `today/`→`hoy.css`, `profile/`→`perfil.css`, `settings/`→`ajustes.css`, `ingredients/`→`ingredientes.css`, `glossary/`→`glosario.css`. Lo compartido va en `componentes.css`; el chrome, en `layout.css`.
3. **Pantalla nueva = hoja nueva + su `@import` en `src/styles/index.css`**, el único que importa `main.tsx` y donde se lee el orden de la cascada.
4. **Nada de valores mágicos**: `--sp-*`, `--fs-*`, `--font-*`, `--radio*`, `--borde*`. Medida nueva → `tokens.css`, que no puede tener colores.
5. **El estado se comunica con atributos**, no con estilos calculados: `data-*` propios (`data-cat`, `data-paso`) o ARIA real (`aria-current`, `aria-pressed`, `aria-selected`). Nunca `style={{ width: pct }}` ni custom properties seteadas desde React.
6. **Clases en castellano, kebab-case, BEM liviano**: bloque (`semaforo`), elemento `bloque-elemento` (`semaforo-icono`), variante `bloque-variante` (`chip-mini`), estado como clase suelta (`sin-datos`, `inactiva`). Cero utilitarias.
7. **Prohibido el reborde lateral de acento en tarjetas y el emoji como ícono** (anti-look-IA, pedido explícito de Facu). Los íconos son SVG con `currentColor` en `src/ui/icons/icons.tsx`; su color va en una clase `.icono-*`.
8. **Al terminar**: `npm test`. Si tocaste algo visual, renders; si el cambio *no* debía verse, baseline antes y `cmp` después.

## Temas visuales

Tres temas intercambiables: **D "el color dice de qué se trata"** (default), **C "carta de estación"** y **A "botánica editorial"**. Se eligen en Ajustes o con `?tema=a|c|d`, quedan en `localStorage` y se aplican antes de pintar (script inline de `index.html`).

```
1. FORMA   src/styles/tokens.css   tipografía, escala, espaciado, bordes.
                                   PROHIBIDO un color acá.
2. TEMAS   src/styles/temas/       única capa que escribe colores.
             tema-{a,c,d}.css      paleta cruda (--p-*, privada) + contrato de roles.
             categorias.css        puente [data-cat] → --cat-actual.
3. APP     el resto de styles/     solo tokens de rol.
```

**Ninguna regla de la app nombra un color**: usan tokens de rol (`--titulo-seccion`, `--accion`, `--cifra`, `--navegar`, `--aviso`, `--dato-suave`, `--marca`, `--link`, `--cat-*`) y cada tema decide qué color los cumple. Lo hace cumplir `src/styles/contrato-de-temas.test.ts`, no la disciplina: falla ante un hex en la capa de la app, un `--p-*` fuera de su tema, un CSS de la app que menciona un tema, o un tema con el contrato incompleto. Antes de ese test la regla se había degradado a 141 violaciones sin que nadie lo notara.

**Agregar un tema**: (1) `src/styles/temas/tema-X.css` con su paleta y **todos** los roles; (2) `@import` en `index.css`; (3) sumar la letra a `TEMAS` e `INFO_DE_TEMA` en `src/app/tema.ts` y al `var TEMAS` del script inline de `index.html`; (4) `npm test`. No se toca ningún componente.

**Al tocar color**: cambiar el token de rol en el archivo del tema, nunca un hex suelto en un componente. Un rol nuevo se declara en **todos** los temas.

**Custom properties anidadas**: una property que contiene `var()` se resuelve **donde se declara**, no donde se usa. Por eso `--titulo-receta` se declara sobre `[data-cat]` y no en `:root`, y es lo que permite `var(--titulo-receta-fijo, var(--cat-actual))`.

**Colores nuevos, medidos** contra la vara que cumple el tema D: **ΔE ≥ 26 entre categorías**, **ΔE ≥ 13 contra los roles funcionales vecinos**, **contraste ≥ 4.5:1 como texto** sobre el papel (3:1 si es relleno). Medir antes de escribir el CSS. Si el tono no llega, variante `-honda` (`--p-zanahoria-honda`).

**Renders**: `npm run renders -- fase-N --tema=a|c|d` → `docs/renders/fase-N-tema-{a,c,d}/`.

## Arquitectura

- TypeScript + React 19 + Vite (SPA estática) + vite-plugin-pwa + Dexie.js + Zod + Zustand + Vitest.
- **La semilla nunca entra a IndexedDB; los datos de usuario nunca salen de IndexedDB.**
- `scripts/build-seed/` normaliza `.artifacts/` → `seed.json` en build-time. Forma desconocida = falla el build, nunca el runtime.
- Motor nutricional en `src/domain/`: funciones puras, sin React, DOM ni Dexie. Es lo único con cobertura exhaustiva.
- Toda pantalla es **mobile-first y 100 % usable desde el celular**.

## Cierre de fase

Cada fase cierra con renders publicados, una entrada en `lessons.md` y el OK explícito de Facu: la skill `/cierre-fase`. Aprobada la fase, `/release`.

## Punteros

- `lessons.md` — bitácora entre sesiones. Toda sesión arranca leyéndola.
- `CHANGELOG.md` — qué cambió en cada versión.
- El tablero de Issues — qué falta y qué está en curso.
- `docs/arquitectura.md` · `docs/auditoria-dataset.md` · `docs/estetica-e-interaccion.md` · `docs/funcionalidades.md` · `docs/decisiones-de-datos.md` · `docs/riesgos.md`
- `.artifacts/README-dataset.md` — doc del dataset; la auditoría corrige varios de sus puntos.
````

En el puntero del tablero, reemplazar por la URL real: `https://github.com/users/facundo-p/projects/PROJECT_NUMBER`.

- [ ] **Step 3: Verificar regla por regla que no se perdió nada**

Abrir `/tmp/claude-md-viejo.md` al lado del nuevo y confirmar:

- [ ] Los **8 invariantes del dominio**, con su contenido: gramo canónico · nutrición desde ingredientes · ventana del semáforo · suplemento que apaga · incertidumbre visible · alerta B12 · UL de magnesio · informa y no diagnostica.
- [ ] Las **8 reglas de estilo**: cero estilo en TSX · una hoja por carpeta con las 9 rutas · pantalla nueva = hoja + import · nada de valores mágicos · estado por atributos · nombres BEM en castellano · prohibido reborde y emoji · verificación al terminar.
- [ ] Las **tres capas de temas** con el bloque de código, el contrato de roles, cómo agregar un tema en 4 pasos, la trampa de las custom properties anidadas, y los **tres umbrales medidos** (ΔE 26, ΔE 13, 4.5:1 / 3:1).
- [ ] La **arquitectura**: stack, la doble regla de la semilla e IndexedDB, build-seed en build-time, dominio puro, mobile-first.
- [ ] `.artifacts/` read-only y a dónde van las correcciones.

Si algo falta, agregarlo antes de commitear.

- [ ] **Step 4: Confirmar que se comprimió de verdad**

```bash
wc -w /tmp/claude-md-viejo.md CLAUDE.md
```

Esperado: el nuevo, bastante más corto. Si quedó igual o más largo, no se aplicó el criterio: volver al Step 2.

- [ ] **Step 5: Actualizar `/cierre-fase`**

En `.claude/skills/cierre-fase/SKILL.md`, reemplazar los pasos 5, 6 y 7 y los recordatorios finales por:

```markdown
5. **Issues**: cerrar los sub-issues de la fase y mover su épica a "En revisión de Facu" en el tablero.
6. **Commit** en la rama del issue y PR a `staging` con el CI en verde (jamás commitear directo a `staging`).
7. **Reporte a Facu**: resumen corto con (a) qué quedó funcionando, (b) link al Artifact de renders, (c) preguntas abiertas del gate. **La fase NO se cierra hasta el OK explícito de Facu.**
8. **Release**: con el OK dado, correr `/release`.

Recordatorios duros:
- `main` solo recibe el PR de release que abre `/release`, mergeado a mano por Facu.
- `.artifacts/` jamás se toca; las correcciones de datos van a `scripts/build-seed/curated-tables.ts` y al gate.
```

- [ ] **Step 6: Verificar que no quedaron punteros muertos**

```bash
grep -rn "docs/plan\|05-roadmap" CLAUDE.md .claude/skills/
```

Esperado: sin resultados.

- [ ] **Step 7: Correr la suite**

```bash
npm test && npm run build
```

Esperado: los dos verdes.

- [ ] **Step 8: Commit y push**

```bash
git add CLAUDE.md .claude/skills/cierre-fase/SKILL.md
git commit -m "$(cat <<'EOF'
docs: CLAUDE.md reescrito a mínima expresión, con git y versionado nuevos

Una regla, una oración. El porqué sobrevive solo donde sin él la regla se
aplica mal. Se comprimió, no se recortó: los 8 invariantes del dominio y
las 8 reglas de estilo están todos.

Nuevo: flujo de rama por issue, criterio de versionado con sus cinco
desempates, y punteros a los docs movidos. /cierre-fase deja de apuntar a
05-roadmap.md y termina llamando a /release.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
git push
```

---

### Task 10: Cerrar el PR y estrenar el sistema

**Files:** ninguno.

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: el sistema andando en `staging`.

- [ ] **Step 1: Repasar el diff completo**

```bash
git diff staging...HEAD --stat
```

Esperado: `.github/` nuevo, `CHANGELOG.md` nuevo, `.claude/skills/release/` nuevo, el hook y su test, `vite.config.ts`, `CLAUDE.md`, `/cierre-fase`, y los movimientos de `docs/`.

- [ ] **Step 2: Verificación final local**

```bash
npm test && npm run build
```

Esperado: los dos verdes. **No seguir si alguno falla.**

- [ ] **Step 3: Sacar el PR de borrador**

```bash
gh pr ready
gh pr checks --watch
```

Esperado: `verificar` en verde.

- [ ] **Step 4: Confirmar que el guard funciona de verdad**

Antes de mergear, probarlo contra el repo real:

```bash
git checkout staging
git commit --allow-empty -m "feat: esto tiene que ser bloqueado"
```

Esperado: el hook lo bloquea con el mensaje que explica `gh issue develop`. Volver con `git checkout -`.

- [ ] **Step 5: Mergear con squash**

```bash
git checkout staging
gh pr merge --squash --delete-branch
git pull
```

Esperado: el issue de bootstrap se cierra solo y su tarjeta se mueve a **Hecho**.

- [ ] **Step 6: Reportarle a Facu**

Resumen con: el link al tablero, el recordatorio del paso manual de dos clicks (agrupar la vista de PRs por `Estado PR`, Task 4 Step 6), que la fase 2 está en "En revisión de Facu" esperando renders, y que cuando la apruebe, `/release` propondrá **0.2.0**.
