# CLAUDE.md — Nutrirecetas Veganas

PWA personal de recetas veganas. Un usuario por dispositivo, sin backend, offline-first, mantenida por una persona en su tiempo libre: **simplicidad de mantenimiento por sobre sofisticación, siempre**.

**Es un recetario.** La nutrición es un agregado que se consulta, no un régimen que se lleva: la app no registra lo que comés ni evalúa cómo venís. Queda para tres cosas —buscar recetas por nutriente, buscar ingredientes por nutriente, y ver cuánto aporta una porción de la dosis diaria— y el criterio que resuelve cualquier duda de diseño es que **a quien no le interese el dato no le tiene que estorbar**. Ante empate de espacio, gana lo que ayuda a cocinar.

Idioma: código en inglés, UI y docs en **español rioplatense**.

## Git y flujo de trabajo (duras)

- **La planificación vive en Issues**, no en markdown: una épica por fase, sub-issues por entregable.
- **Una rama por issue**: `gh issue develop N --checkout --base staging`. Sin `--base` corta de `main`, que es el default del repo y va varios releases atrás. Nunca commitear directo a `staging`; el hook `.claude/hooks/guard-main.sh` lo bloquea.
- **El trabajo entra a `staging` por PR** con `Closes #N`, CI en verde y squash merge.
- **`main` solo recibe releases**: el PR que abre `/release`, mergeado a mano por Facu con merge commit. Nunca commitear ni pushear a `main`.
- `.artifacts/` es **read-only**. Toda corrección de datos va a `scripts/build-seed/curated-tables.ts`.

## Versionado

`MAJOR.MINOR.PATCH` redefinido para una app sin API pública:

- **MAJOR** — **si antes de actualizar hay que hacer algo** (backup, rehacer el onboarding), es major. También cerrar una etapa completa de roadmap.
- **MINOR** — funcionalidad nueva y visible que no obliga a nada.
- **PATCH** — todo lo demás.

Desempates: (1) gana el más alto; (2) corregir datos de la semilla es patch, salvo que cambie un id o borre un ingrediente o receta → major; (3) tema nuevo es minor, ajustar tokens es patch; (4) antes de 1.0.0 no hay major derivado — una ruptura sube el minor, y el salto a 1.0.0 se pide a mano con `/release 1.0.0`; (5) las dependencias solas no justifican un release.

`/release` propone el número, escribe `CHANGELOG.md` y abre el PR a `main`. No mergea.

## Invariantes del dominio (no negociables, vienen del dataset)

1. **El gramo es la unidad canónica**: `g_aprox` es la única fuente de verdad para cálculo; `unidad` (295 valores de texto libre) es solo display.
2. La nutrición **se calcula desde los ingredientes**; `perfil_nutricional_porcion_aprox` no se usa (45 % de desvíos >30 %).
3. **La nutrición se informa por porción contra una dosis diaria, y nunca se evalúa.** El objetivo es una referencia, no una cuenta que haya que cerrar. La `ventana` del nutriente (`dia` | `semana`) sobrevive como nota —"no hace falta llegar todos los días"—, no como criterio. Sin perfil se usa la referencia adulta genérica, **dicho con todas las letras**: un porcentaje que no aclara contra qué se mide es un número sin significado.
4. **El perfil nunca es un portón.** Ninguna pantalla puede exigirlo, bloquear ni pedirlo antes de dejar ver una receta. Su único trabajo es que el porcentaje diga "de tu dosis".
5. **La incertidumbre se muestra**: rangos {min,max} como bandas con punto medio, IC 1-10 visible, cobertura reportada. Nulos jamás son cero en silencio, y eso incluye los rankings: sin dato reportable no hay puesto, porque el último se lee como "casi no tiene".
6. **Alerta B12 obligatoria**: si una receta usa levadura nutricional como fuente de B12, advertir que muchas marcas argentinas NO están fortificadas. Y la ficha de un nutriente abre con su `ajuste_vegano.descripcion` antes que cualquier número — sin eso, un "40 % de la dosis" de B12 alimentaria se lee tranquilizador. Es seguridad, no cosmética.
7. **Un UL que solo aplica a suplementos no se alerta nunca** (`ul_nota`, caso magnesio): la app no sabe qué tomás aparte, así que solo lo informa en la ficha del nutriente.
8. **La app informa, no diagnostica.** Fuera de alcance: embarazo, lactancia, menores, condiciones médicas.

## Código y comentarios (duras)

1. **El código se explica solo**: nombres descriptivos en variables, tipos, constantes y funciones. Un buen nombre ahorra el comentario.
2. **Comentar el porqué, no el qué.** Si el comentario repite lo que la línea ya dice, sobra — o el nombre está mal.
3. **Mínima expresión**: la menor cantidad de palabras que exprese la idea, en comentarios, docs, mensajes de commit y este archivo. Sin preámbulos ni relleno.

## Estilos (duras al escribir código nuevo)

1. **Cero estilo en los `.tsx`**: ni `style={{ }}`, ni objetos de estilo, ni `<style>`, ni CSS-in-JS, ni CSS Modules. El TSX pone `className` y atributos; el CSS decide color, tamaño y forma.
2. **Una hoja por carpeta de `src/ui/`**, en `src/styles/pantallas/`: `cook/`→`cocina.css`, `diary/`→`diario.css`, `recipes/`→`recetario.css`, `recipe-detail/`→`receta.css`, `nutrients/`→`nutrientes.css`, `profile/`→`perfil.css`, `settings/`→`ajustes.css`, `ingredients/`→`ingredientes.css`, `glossary/`→`glosario.css`. Lo compartido va en `componentes.css` (ahí viven la nutrición y las bandas, que usan tres pantallas); el chrome (estructura, nav, banners) en `layout.css`. **Que una hoja de pantalla la lea otra pantalla es la señal de que la regla se rompió**: pasó con la nutrición entre la Fase 1 y la 3.
3. **Pantalla nueva = hoja nueva + su `@import` en `src/styles/index.css`**, el único que importa `main.tsx` y donde se lee el orden de la cascada. El test avisa si quedó sin importar.
4. **Nada de valores mágicos**: espaciado `--sp-*`, tipografía `--fs-*` y `--font-*`, radios y bordes `--radio*` / `--borde*`. Medida nueva → `tokens.css`, que no puede tener colores.
5. **El estado se comunica con atributos**, no con estilos calculados: `data-*` propios (`data-cat`, `data-paso`) o ARIA real (`aria-current`, `aria-pressed`, `aria-selected`), y el CSS los lee. Nunca `style={{ width: pct }}` ni una custom property seteada desde React.
6. **Clases en castellano, kebab-case, BEM liviano**: bloque (`semaforo`, `tarjeta-receta`), elemento `bloque-elemento` (`semaforo-icono`, `banda-rango`), variante `bloque-variante` (`chip-mini`), estado como clase suelta adicional (`sin-datos`, `no-aplica`, `inactiva`). Cero utilitarias.
7. **Prohibido el reborde lateral de acento en tarjetas y el emoji como ícono** (anti-look-IA, pedido explícito de Facu). Lo prohibido es el filete decorativo de 3-4 px que no dice nada; la banda de 42 px de la tarjeta de receta no es eso, porque es la columna que contiene el ícono de tipo. Los íconos son SVG con `currentColor` en `src/ui/icons/icons.tsx`; su color se declara en una clase `.icono-*`.
8. **Al terminar**: `npm test`. Si tocaste algo visual, renders; si el cambio *no* debía verse, baseline antes y `cmp` después.

## Temas visuales

Dos temas intercambiables: **E "Mercado"** (default, papel claro) y **F "Pizarra"** (oscuro). Se eligen en Ajustes o con `?tema=e|f`, quedan en `localStorage` y se aplican antes de pintar (script inline de `index.html`).

**La estructura es una sola y es la de Pizarra**; el tema solo decide el color. Lo que cambia entre los dos son tokens: el fondo del encabezado (espinaca en Mercado, plano en Pizarra), el filete del ítem activo de la nav, y si el título de la receta va en tinta (`--titulo-receta-fijo` en Mercado) o en el color de su categoría (Pizarra).

```
1. FORMA   src/styles/tokens.css   escala tipográfica, espaciado, bordes.
                                   PROHIBIDO un color acá.
2. TEMAS   src/styles/temas/       única capa que escribe colores, y la que
                                   elige las familias (--font-display/-data).
             tema-X.css            paleta cruda (--p-*, privada) + contrato de roles.
             categorias.css        puente [data-cat] → --cat-actual.
3. APP     el resto de styles/     solo tokens de rol; ninguna regla nombra
                                   un color ni un tema.
```

**Ninguna regla de la app nombra un color**: usan tokens de rol (`--titulo-seccion`, `--accion`, `--cifra`, `--navegar`, `--aviso`, `--dato-suave`, `--marca`, `--link`, `--cat-*`…) y cada tema decide qué color los cumple. Lo hace cumplir `src/styles/contrato-de-temas.test.ts`: falla ante un hex en la capa de la app, un `--p-*` fuera de su tema, un CSS de la app que menciona un tema, o un tema con el contrato incompleto. Sin ese test la regla se degrada sola — llegó a 141 violaciones sin que nadie lo notara.

**Agregar un tema**: (1) `src/styles/temas/tema-X.css` con su paleta y **todos** los roles, copiando la cabecera de otro tema; (2) `@import` en `index.css`; (3) sumar la letra a `TEMAS` e `INFO_DE_TEMA` en `src/app/tema.ts` y al `var TEMAS` del script inline de `index.html`; (4) `npm test`, que dice el token exacto si falta alguno. No se toca ningún componente.

**Al tocar color**: cambiar el token de rol en el archivo del tema, nunca un hex suelto en un componente. Un rol nuevo se declara en **todos** los temas.

**Custom properties anidadas**: una property que contiene `var()` se resuelve **donde se declara**, no donde se usa. Por eso `--titulo-receta` se declara sobre `[data-cat]` y no en `:root` — y es lo que permite que un tema elija entre título fijo o color de categoría sin nombrarse: `var(--titulo-receta-fijo, var(--cat-actual))`.

**Colores nuevos, medidos** contra la vara que cumplen los dos temas: **ΔE ≥ 26 entre categorías**, **ΔE ≥ 13 contra los roles funcionales vecinos**, **contraste ≥ 4.5:1 como texto** sobre el papel (3:1 si es relleno). Medir antes de escribir el CSS. Si el tono base no llega, variante `-honda` (`--p-zanahoria-honda`).

**Renders**: `npm run renders -- fase-N --tema=X` → `docs/renders/fase-N-tema-X/`. Al refactorizar estilos, baseline antes y `cmp` después: es lo único que detecta un cambio visual no intencional.

## Arquitectura

- TypeScript + React 19 + Vite (SPA estática) + vite-plugin-pwa + Dexie.js + Zod + Zustand + Vitest.
- **La semilla nunca entra a IndexedDB; los datos de usuario nunca salen de IndexedDB.**
- `scripts/build-seed/` normaliza `.artifacts/` → `seed.json` canónico en build-time. Forma desconocida = falla el build, nunca el runtime.
- Motor nutricional en `src/domain/`: funciones puras, sin imports de React, DOM ni Dexie. Es lo único con cobertura exhaustiva.
- Toda pantalla es **mobile-first y 100 % usable desde el celular**.
- Detalle en `docs/arquitectura.md`.

## Entornos

Las dos versiones se publican juntas en GitHub Pages con cada push:

- **`/nutrirecetas-veganas/app/`** — `main`, la que usa Facu. Base `nutrirecetas_user`.
- **`/nutrirecetas-veganas/staging/`** — `staging`, para probar. Base `nutrirecetas_user_staging`, nombre propio en el manifest y banda de aviso.

**IndexedDB es por origen, no por ruta**: sin esa separación, probar en staging escribiría sobre el historial real. La hace cumplir `pages.yml`, que verifica el bundle antes de publicarlo. Rutas hermanas y no anidadas para que los service workers no se pisen. `localStorage` sí se comparte: la preferencia de tema es común a las dos.

## Cierre de fase

Cada fase cierra con **renders** publicados para revisión de Facu, una entrada en `lessons.md` y su OK explícito: la skill `/cierre-fase`. No se pasa a la fase siguiente sin ese cierre. Aprobada la fase, `/release`.

## Punteros

- `lessons.md` — bitácora entre sesiones. Toda sesión arranca leyéndola.
- `CHANGELOG.md` — qué cambió en cada versión.
- El tablero de Issues — qué falta y qué está en curso: https://github.com/users/facundo-p/projects/3
- `docs/arquitectura.md` · `docs/auditoria-dataset.md` · `docs/estetica-e-interaccion.md` · `docs/funcionalidades.md` · `docs/decisiones-de-datos.md` · `docs/riesgos.md`
- `.artifacts/README-dataset.md` — doc del dataset; ojo, la auditoría corrige varios de sus puntos.
