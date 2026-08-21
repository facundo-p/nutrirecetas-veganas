# Issues, PRs, tablero, versionado y `/release`

**Fecha**: 2026-08-20 · **Estado**: aprobado por Facu, listo para plan de implementación

Diseño del sistema de trabajo del proyecto: dónde vive la planificación, cómo entra
el código, cómo se numeran las versiones y cómo sale un release.

## Por qué

Hasta hoy la planificación vivía en markdown (`docs/plan/05-roadmap.md`, los
`faseN-implementacion.md`) y todo el código entraba por commits directos a
`staging`. Eso funcionó para arrancar, pero tiene tres agujeros: el roadmap se
desactualiza en silencio, no hay ningún punto donde el código se verifique antes
de estar en `staging`, y no existe forma de decir "esta es la versión que estoy
usando" ni de saber qué cambió entre dos momentos.

## Estado del repo al escribir esto

- `github.com/facundo-p/nutrirecetas-veganas`, público, issues habilitados.
- **Sin `.github/`**: no hay un solo workflow de CI.
- Cero issues, cero PRs, cero tags, sin proyecto asociado.
- `package.json` en `0.1.0`.
- `main` tiene sólo el commit raíz con `.gitignore`; todo el trabajo está en `staging`.
- Fases 0 y 1 cerradas; fase 2 implementada, pendiente de revisión de Facu; fases 3 y 4 por delante.
- Los commits ya son convencionales (22 `feat`, 13 `docs`, 2 `test`, 2 `chore`, 1 `refactor`, 1 `fix`).
- Repo limpio: `dist/` y `.DS_Store` ignorados, nada de basura trackeada.

## Decisiones tomadas

| Decisión | Elegido | Descartado |
|---|---|---|
| Modelo de ramas | Rama por issue → PR a `staging` | Seguir commiteando directo a `staging` |
| `docs/plan/` | Separar: planificación → Issues, decisiones → `docs/` | Migrar todo a Issues · dejarlo congelado |
| Arranque | Historia retroactiva + releases 0.x | Esperar a v1.0.0 con `main` vacía |
| Automatización | Punto medio: 2 workflows | Sólo CI · bot de versionado (release-please) |

---

## 1 — Modelo de trabajo: Issues y PRs

**Jerarquía de dos niveles, no tres.** Una **épica** por fase del roadmap y
**sub-issues** nativos de GitHub colgando de ella, uno por entregable revisable.
Con dos niveles alcanza para saber qué falta para cerrar una fase mirando la
barra de progreso que GitHub dibuja sola en la épica.

**El ciclo de una tarea:**

```
gh issue develop 14 --checkout     → rama 14-plan-semanal, salida de staging
   trabajo + commits convencionales
gh pr create --base staging        → PR con "Closes #14" en el cuerpo
   CI: npm test + npm run build
   squash merge                     → #14 se cierra solo, la rama se borra sola
```

`staging` **deja de recibir commits directos**. Única excepción: el commit
`chore(release): vX.Y.Z` que escribe `/release`.

**Labels** (en castellano, agrupadas por color):

- Fase: `fase-0` `fase-1` `fase-2` `fase-3` `fase-4`
- Tipo: `funcionalidad` `corrección` `datos` `estilos` `documentación` `infra`
- Marcadores: `épica` `ruptura` `post-v1`

Las de tipo son las que alimentan las secciones del changelog.

### Plantillas

- `.github/ISSUE_TEMPLATE/epica.yml` — objetivo de la fase, criterio de cierre,
  checkpoint de renders.
- `.github/ISSUE_TEMPLATE/tarea.yml` — qué hay que hacer, cómo se verifica, a qué
  épica pertenece.
- `.github/pull_request_template.md` — qué cambia, `Closes #N`, y el checklist
  mínimo (tests verdes, build verde, renders si tocó algo visual).

## 2 — El tablero

Un proyecto (`Nutrirecetas Veganas`) vinculado al repo, con **dos vistas y dos
campos de estado distintos**. Un único campo `Status` compartido haría que las
columnas de issues y de PRs se pisen.

| Vista **Issues** — campo `Estado` | Vista **PRs** — campo `Estado PR` |
|---|---|
| **Backlog** — registrado, sin compromiso | **Borrador** — draft, trabajo en curso |
| **En curso** — hay rama abierta | **CI corriendo** — abierto, checks pendientes |
| **En revisión de Facu** — implementado, esperando el OK | **Listo para mergear** — CI en verde |
| **Hecho** — mergeado a `staging` | **Mergeado** |
| **Publicado** — salió en un release a `main` | |

"En revisión de Facu" es el checkpoint que el roadmap ya exige (renders + OK
explícito) y que hoy no vive en ningún lado.

### Qué se puede automatizar y qué no

Verificado contra la API antes de escribir esto:

- `createProjectV2View` **existe** → las dos vistas se crean por GraphQL.
- `updateProjectV2View` acepta `filter` → los filtros (`is:issue` / `is:pr`) se setean por API.
- `ProjectV2ViewConfigurationInput` sólo acepta `visibleFieldIds` → **la agrupación
  por columna NO es seteable por API**.
- `addSubIssue` **existe** → los sub-issues se vinculan por GraphQL.
- `gh project field-create` crea los campos single-select con sus opciones.

**Consecuencia práctica**: se **renombra el campo `Status` que GitHub crea solo** a
`Estado` y se le reemplazan las opciones por las cinco de la tabla — así la vista de
Issues agrupa sola, porque un board layout agrupa por el campo de estado del proyecto
por defecto. `Estado PR` es un campo single-select nuevo, y su vista necesita **un
paso manual único de dos clicks**: abrirla → agrupar por `Estado PR`. Queda
documentado en el README del proyecto; no hay forma de evitarlo por API.

Los workflows nativos de GitHub Projects cubren *item agregado al proyecto*,
*PR mergeado* e *issue cerrado*. Las columnas del medio se mueven a mano, que es
una vez por tarea.

## 3 — CI (`.github/workflows/ci.yml`)

Dispara en `pull_request` hacia `staging` o `main`, y en `push` a esas dos ramas.
Node 22 (el local es 22.22.3), `npm ci`, y dos pasos:

- **`npm test`** — vitest, que incluye el contrato de temas y el de estilos.
- **`npm run build`** — regenera la semilla desde `.artifacts/`, valida el diff de
  ids inmutables, compila TS y buildea Vite. Es el mismo gate que `/cierre-fase`
  corre a mano hoy.

**Los renders quedan fuera del CI a propósito**: necesitan navegador y, sobre todo,
necesitan un humano mirándolos. Siguen viniendo por `/renders` en el checkpoint.

## 4 — Criterio de versionado

SemVer no aplica tal cual: no hay API pública. Hay **una persona, una UI y una base
IndexedDB**. Los tres números se redefinen contra eso:

- **MAJOR** — cambia el contrato con los datos del usuario o el alcance del producto.
  Regla operativa, la que decide en la práctica: **si antes de actualizar hay que
  hacer algo** (exportar un backup, rehacer el onboarding, revisar el perfil), **es
  major**. También lo es cerrar una etapa completa de roadmap.
- **MINOR** — funcionalidad nueva y visible que no obliga a nada: pantalla nueva,
  flujo nuevo, tema nuevo, campo nuevo en una entidad.
- **PATCH** — todo lo demás: bugs, ajustes de estilo, correcciones de datos de la
  semilla, textos, performance, refactors internos, dependencias.

### Reglas de desempate

1. **Gana el más alto.** Un release con un fix y una pantalla nueva es minor.
2. **Corregir datos de la semilla es patch** — salvo que cambie un id o elimine un
   ingrediente/receta: eso deja overlays y cocciones huérfanos, o sea que obliga a
   hacer algo → major.
3. **Tema visual**: ajustar tokens es patch, un tema nuevo elegible es minor.
4. **Antes de 1.0.0 no hay major derivado.** Una ruptura pre-1.0 sube el minor
   (SemVer lo autoriza). Hasta v1.0.0 la escala real es `0.MINOR.PATCH`.
5. **Las dependencias solas nunca justifican un release.** Viajan con lo que haya.

El salto a **1.0.0 es deliberado y manual**, no derivado: la regla 4 impide que
`/release` lo proponga solo. Cuando la fase 4 cierre, Facu corre `/release 1.0.0`.
Es la única forma de llegar al 1.0.0, y es a propósito — que la app se declare
"versión 1" tiene que ser una decisión, no el efecto colateral de un `feat!:`.

### Cómo lo deriva `/release`

Mirando los commits entre el último tag y `staging`:

| Encuentra | Propone |
|---|---|
| `feat!:` · `BREAKING CHANGE:` · issue cerrado con label `ruptura` | major — o minor si <1.0.0 (regla 4) |
| `feat:` | minor |
| `fix:` `perf:` `style:` `refactor:` `docs:` `test:` `chore:` | patch |

Siempre muestra **por qué** propone ese número, citando el commit que lo disparó.
Con parámetro (`/release 0.3.0`) usa ese y no discute.

**Escala esperada**: `v0.2.0` (fase 2) → `v0.3.0` (fase 3) → `v1.0.0` (fase 4,
todas las fases planificadas hasta hoy).

## 5 — `CHANGELOG.md`

Formato Keep a Changelog, en castellano rioplatense, lo más nuevo arriba. Secciones
por release, sólo las que apliquen:

**Agregado · Cambiado · Corregido · Datos · Quitado**

"Datos" no es del estándar: es propia del proyecto. Una corrección de la semilla
cambia números que ya se vieron en pantalla, así que merece su renglón y no puede
esconderse entre los fixes.

Cada línea dice **qué cambió para el usuario**, no qué commit hubo, y referencia el
issue:

```markdown
## [0.2.0] — 2026-08-21

### Agregado
- Onboarding de perfil real con suplementos: el semáforo ahora usa tus RDA. (#8)
- Flujo **Cocinar ahora**: personalización con recálculo en vivo, pasos con
  tipografía grande y wake lock, y registro de cocción. (#9)
- Export/import de todos tus datos, con recordatorio de backup. (#11)

### Datos
- La margarina pasa a ser el sustituto de la manteca vegana. (#7)
```

## 6 — La skill `/release`

`.claude/skills/release/SKILL.md`. Acepta un parámetro opcional con la versión.

1. **Verifica el terreno**: parado en `staging`, árbol limpio, sincronizado con
   `origin`, y `staging` por delante de `main`. Si algo falla, para y lo dice.
2. **Calcula el rango** `último tag → staging` (si no hay tags, desde el commit raíz).
3. **Deriva la versión** con la tabla de arriba, o usa el parámetro. Explica el porqué.
4. **Junta las novedades**: commits del rango + issues cerrados por esos PRs,
   agrupados por sección del changelog según su label de tipo.
5. **Escribe la entrada de `CHANGELOG.md`** — redactada, no volcada.
6. **Bump de `version`** en `package.json`.
7. **Commit `chore(release): vX.Y.Z`** en `staging` (la excepción del guard) y push.
8. **Abre el PR `staging → main`** con el cuerpo = la entrada del changelog + los
   issues que cierra.
9. **Espera el CI** (`gh pr checks --watch`) y devuelve el link.

**Y ahí para. No mergea, no taggea, no publica.**

### Después del merge

`.github/workflows/tag-release.yml` dispara en `push` a `main`: lee la versión de
`package.json`, verifica que el tag no exista todavía, crea `vX.Y.Z` y publica el
GitHub Release con esa sección del changelog como cuerpo. Necesita
`permissions: contents: write`.

### Estrategia de merge

- PRs de issue → `staging`: **squash**. Un issue, un commit.
- PR de release → `main`: **merge commit**. Así `main` y `staging` no divergen y el
  próximo release parte de un ancestro común.

## 7 — Reordenamiento del repo

```
docs/plan/01-auditoria.md              → docs/auditoria-dataset.md
docs/plan/02-arquitectura.md           → docs/arquitectura.md
docs/plan/03-funcionalidades.md        → docs/funcionalidades.md
docs/plan/04-interaccion-y-estetica.md → docs/estetica-e-interaccion.md
docs/plan/fase1-gate-datos.md          → docs/decisiones-de-datos.md
docs/plan/06-riesgos-y-preguntas.md    → docs/riesgos.md
docs/plan/05-roadmap.md                → BORRADO (migrado a épicas)
docs/plan/fase1-implementacion.md      → BORRADO (ya vive en lessons.md)
docs/plan/fase2-implementacion.md      → BORRADO (migrado a la épica de Fase 2)
```

De `06-riesgos-y-preguntas.md` sobreviven la tabla de riesgos y el registro de
decisiones tomadas. Las preguntas abiertas 1 y 2 ya se resolvieron en el gate de
Fase 1; las 3 (sustitutos de texto libre), 4 (hosting) y 5 (`uva`) salen como issues.

`lessons.md` **se queda como está**: es memoria narrativa entre sesiones, no
planificación, y CLAUDE.md la usa como punto de arranque.

`docs/renders/` se queda donde está.

## 8 — Cambios a las reglas del proyecto

### `.claude/hooks/guard-main.sh`

Se extiende para bloquear `git commit` estando parado en `staging`, **salvo que el
mensaje empiece con `chore(release)`**. El mensaje de error explica cómo salir:
`gh issue develop N --checkout`. Todo lo que ya bloquea sobre `main` se mantiene
igual.

### `CLAUDE.md` — reescritura completa

No alcanza con parchear las secciones que cambian: se reescribe **entero** bajo un
criterio de **mínima expresión**. Cada regla dice lo que hay que saber para
cumplirla y nada más; se elimina toda palabrería que no sea imprescindible para
entender la regla enunciada. Ninguna regla ni invariante se pierde en el camino —
se comprime, no se recorta.

Qué se aplica al reescribir:

- Una regla, una oración. Sin preámbulos ni justificaciones repetidas.
- El "por qué" sobrevive sólo cuando sin él la regla se aplica mal (ej.: por qué
  `--titulo-receta` se declara sobre `[data-cat]`).
- Se van los ejemplos que ilustran algo ya obvio por el enunciado.
- Lo que ya está escrito en otro lado se reemplaza por un puntero (`lessons.md`,
  `docs/`, el spec de temas).
- Los 8 invariantes del dominio y las 8 reglas de estilo **se mantienen todos**: son
  el núcleo no negociable.

Contenido que cambia además de la forma:

- "Reglas de git": rama por issue → PR a `staging` → release a `main`.
- Sección nueva de versionado: el criterio y las cinco reglas de desempate.
- Punteros a los docs movidos (hoy apunta a `docs/plan/02-arquitectura.md` y a la
  auditoría, que dejan de existir en esa ruta).
- Mención de `/release` y `CHANGELOG.md`.
- La planificación ya no vive en markdown: se lee del tablero de Issues.

**Verificación**: al terminar, releer el `CLAUDE.md` viejo (`git show`) contra el
nuevo y confirmar regla por regla que ninguna se perdió.

### `.claude/skills/cierre-fase/SKILL.md`

El paso 5 dice "marcar el avance en `docs/plan/05-roadmap.md`", archivo que deja de
existir. Pasa a ser: cerrar los sub-issues, mover la épica a "En revisión de Facu",
y al aprobar, correr `/release`.

## 9 — Issues a crear

Aproximadamente 16, con sus sub-issues vinculados:

- **Épicas cerradas**: Fase 0 (plan y dirección visual), Fase 1 (dataset, cimientos,
  recetario). Una línea de resumen cada una; el detalle ya vive en `lessons.md`.
- **Épica en curso**: Fase 2 (perfil, cocinar, registrar) con sus sub-issues —
  todos cerrados salvo "revisar renders de fase 2".
- **Épicas de backlog**: Fase 3 (compras y semana) y Fase 4 (recetas propias y
  robustez), cada una con sus sub-issues sacados del roadmap.
- **Tareas de datos** del gate de Fase 1: `peso_por_unidad` de 17 frescos · ficha de
  `uva` · vitamina K · sustitutos de texto libre.
- **Sueltos**: decidir hosting (pregunta 4 de riesgos) y el backlog post-v1 del
  roadmap.

## Fuera de alcance

- Renders en CI (necesitan un humano).
- Deploy automático a hosting: primero hay que decidir dónde (issue propio).
- Automatizar el merge o el tag desde `/release`: el merge lo hace Facu a mano.
- Mover tarjetas del tablero por Action: los workflows nativos alcanzan.
- Tocar `.artifacts/`, el motor de dominio o cualquier cosa de la app.

## Criterio de éxito

1. `gh issue develop N --checkout` → commit → `gh pr create --base staging` → CI verde
   → squash merge cierra el issue y mueve la tarjeta.
2. Un `git commit` directo en `staging` queda bloqueado por el hook, con un mensaje
   que explica qué hacer.
3. `/release` sobre la fase 2 aprobada propone `0.2.0`, explica por qué, escribe el
   changelog, abre el PR a `main` y espera el CI.
4. Al mergear ese PR aparecen solos el tag `v0.2.0` y el GitHub Release.
5. `docs/plan/` ya no existe y ningún puntero de `CLAUDE.md` quedó roto.
