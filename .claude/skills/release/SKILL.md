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
