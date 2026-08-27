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
git fetch origin --tags && git status -sb | head -1
git rev-list --count origin/main..staging
```

Si no está parado en `staging`, si el árbol está sucio, si la rama está
desincronizada con `origin`, o si `staging` no está por delante de `main`:
**parar y decirlo**. No arreglarlo por cuenta propia.

## 2. Calcular el rango

El rango es **`origin/main..staging`**: lo que está en `staging` y `main` todavía
no tiene. Eso *es* el release, por definición — a `main` solo entran releases.

```bash
git log origin/main..staging --format='%h %s'
```

**No usar `git describe` para esto.** El tag lo crea `tag-release.yml` sobre el
merge commit de `main`, que nunca es ancestro de `staging`: `describe` no lo
alcanza y devuelve un tag viejo. Al armar v0.4.0 devolvía `v0.2.0`, y con ese
rango la entrada habría repetido entera la de v0.3.0. Va a fallar igual en cada
release mientras `main` se mergee con merge commit — que es lo que corresponde.

Si `origin/main` todavía no existe, el rango arranca en el commit raíz:
`git rev-list --max-parents=0 HEAD`.

Para nombrar el último release publicado (no para el rango), el tag sí se lee
desde `main`: `git describe --tags --abbrev=0 origin/main`.

## 3. Derivar la versión

Se bumpea sobre la de `package.json`, que ya trae la del release anterior.

```bash
git log origin/main..staging --format='%s%n%b'
```

| Encuentra | Propone |
|---|---|
| `feat!:` · `BREAKING CHANGE:` · un issue cerrado con label `ruptura` | major — o **minor si <1.0.0** |
| `feat:` | minor |
| `fix:` `perf:` `style:` `refactor:` `docs:` `test:` `chore:` | patch |

Gana el más alto. Aplicar los desempates de `CLAUDE.md`, sobre todo el de datos:
corregir la semilla es patch, salvo que cambie un id o borre un ingrediente o una
receta — eso deja overlays huérfanos y es major.

**Una migración con pérdida es siempre ruptura**, aunque ningún commit diga
`feat!`. Si en el rango hay un `version(N)` nuevo en `db.ts` que borra una tabla
o saca un campo del perfil, es ruptura: obliga a exportar antes de actualizar.
Buscarlo a mano, porque el label del issue puede haberse olvidado:

```bash
git diff origin/main..staging -- src/db/db.ts src/db/schema.ts | grep -E '^\+.*version\(|^-.*Schema'
```

**Decir siempre por qué**, citando el commit que lo disparó:

> Propongo **0.3.0** (minor): `feat(compras): lista consolidada` agrega
> funcionalidad visible y ningún cambio obliga a Facu a hacer nada.

`/release 1.0.0` es la única forma de llegar al 1.0.0: la regla 4 impide
proponerlo solo. Que la app se declare versión 1 tiene que ser una decisión.

## 4. Juntar las novedades

Los issues del release son los que cierran los commits **del rango**, y el label
de tipo de cada uno decide la sección. Una sola tubería, sin variable intermedia
—`for n in $VAR` no separa palabras en zsh, que es la shell de Facu:

```bash
git log origin/main..staging --format='%s%n%b' \
  | grep -oiE '(closes|cierra|fixes) #[0-9]+' | grep -oE '[0-9]+' | sort -un \
  | xargs -I{} gh issue view {} --json number,title,labels \
      --jq '"\(.number) \([.labels[].name]) \(.title)"'
```

Leer igual los `%s` del rango: un commit puede entrar sin issue (el propio
`chore(release)`, o un arreglo que salió al paso) y también cuenta para la
versión.

Dos formas que **no** sirven, comprobadas al armar v0.4.0:

- `gh pr list --state merged --base staging` lista todos los PR de la historia
  del repo, sin distinguir cuáles ya salieron en un release.
- `closingIssuesReferences` vuelve vacío en los PR ya mergeados; el vínculo hay
  que leerlo del `Closes #N` del cuerpo del commit.

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
- Flujo **Cocinar ahora**: personalización con recálculo en vivo, pasos con
  tipografía grande y wake lock, y registro de cocción. (#9)

### Quitado
- La pantalla Hoy: la app abre en el recetario. (#91)

### Datos
- La margarina pasa a ser el sustituto de la manteca vegana. (#7)
```

### Si el release borra datos de usuario

Va **primero, antes de las secciones**, en prosa y sin rodeos: qué se borra, qué
sobrevive y qué hacer antes de actualizar. Alguien que lee el changelog después
de haber actualizado ya no puede exportar nada.

```markdown
## [0.5.0] — 2026-08-27

**Esta versión borra datos.** Se van los registros de porciones comidas, las
sobras, y los suplementos y objetivos a mano del perfil. Tus cocciones, tus
notas y tus favoritas quedan enteras. Si querés conservar lo que se va,
exportá desde Ajustes **antes** de actualizar.
```

Comprobar además que la app lo avise sola: `ULTIMA_VERSION_CON_PERDIDA` en
`App.tsx` tiene que apuntar a la versión de esquema que borró. Si quedó atrás, el
aviso no aparece y el changelog es lo único que lo dice — y el changelog se lee
después.

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

## Mientras tanto, sin intervención

Facu mergea con **merge commit**. `tag-release.yml` detecta el push a `main`, lee
la versión de `package.json`, crea el tag `vX.Y.Z` y publica el GitHub Release con
la sección del changelog.

## 10. Cerrar el tablero, ya mergeado

Corre **cuando Facu avisa que mergeó**, no al abrir el PR: antes del merge no hay
nada publicado que marcar.

```bash
git fetch origin --tags
npm run tablero -- --seco   # qué se va a mover
npm run tablero             # moverlo
```

Mueve a **Publicado** los issues cuyo cierre ya está en `main`. Es idempotente:
lo que ya está en la columna no se vuelve a tocar, así que se puede correr de
nuevo sin miedo.

Si falla nombrando un campo o una columna, alguien renombró algo en el tablero.
Arreglar el nombre en `scripts/tablero-publicado.ts`; no buscar el id a mano.

Esto era una línea suelta debajo de "sin intervención" y se saltó en v0.2.0 y en
v0.3.0. Es un paso numerado por esa razón.
