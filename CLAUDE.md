# CLAUDE.md — Nutrirecetas Veganas

PWA personal de recetas veganas con base nutricional. Un solo usuario por dispositivo (Facu; potencialmente amigos con su propia instalación). Sin backend, offline-first real, mantenida por una persona en su tiempo libre: **simplicidad de mantenimiento por sobre sofisticación, siempre**.

Idioma del proyecto: **español rioplatense** (código en inglés, UI y docs en castellano).

## Reglas de git (duras)

- **Todo el trabajo ocurre en la rama `staging`.** Nunca commitear, mergear ni pushear a `main` directamente.
- `main` solo recibe versiones completas vía **PR desde `staging` aprobado explícitamente por Facu**.
- El hook `.claude/hooks/guard-main.sh` bloquea operaciones sobre `main`; si bloquea algo, no es un bug: cambiá a `staging`.
- Los archivos de `.artifacts/` son **read-only**: jamás editarlos. Cualquier corrección de datos se hace en la capa de ingesta (`scripts/build-seed`) o se reporta a Facu.

## Invariantes del dominio (no negociables, vienen del dataset)

1. **El gramo es la unidad canónica**: `g_aprox` es la ÚNICA fuente de verdad para cálculo. El campo `unidad` (295 valores de texto libre) es solo display.
2. La nutrición de una receta **se calcula desde los ingredientes**, nunca se usa `perfil_nutricional_porcion_aprox` (la auditoría mostró 45 % de desvíos >30 %; es solo referencia histórica).
3. **El semáforo evalúa cada nutriente en SU ventana** (`dia` | `semana`, semana = móvil de 7 días). Nunca por comida individual.
4. **Un suplemento declarado apaga la exigencia alimentaria** de ese nutriente (estado `cubierto_por_suplemento`).
5. **La incertidumbre se muestra**: rangos {min,max} como bandas (punto medio + banda visible), índice de confianza (IC 1-10) visible, cobertura de cálculo reportada. Nulos jamás son cero en silencio.
6. **Alerta B12 obligatoria**: si una receta usa levadura nutricional como fuente de B12, advertir que muchas marcas argentinas NO están fortificadas. Es un invariante de seguridad, no cosmético.
7. El UL de magnesio aplica solo a suplementos: el semáforo no alerta exceso de Mg alimentario.
8. **La app informa, no diagnostica.** Fuera de alcance: embarazo, lactancia, menores, condiciones médicas.

## Temas visuales (intercambiables)

La app tiene **tres temas**: **D "el color dice de qué se trata"** (default, el que usa Facu), **C "carta de estación"** y **A "botánica editorial"**. Se eligen desde Ajustes o con `?tema=a|c|d`; la elección queda en `localStorage` y se aplica antes de pintar (script inline de `index.html`).

### Las tres capas

```
1. FORMA   src/styles/tokens.css     tipografía, escala, espaciado, bordes.
                                     PROHIBIDO un color acá.
2. TEMAS   src/styles/temas/         la única capa que escribe colores.
             tema-{a,c,d}.css        un tema = un archivo: su paleta cruda
                                     (--p-*, privada) + el contrato de roles.
             categorias.css          el puente [data-cat] → --cat-actual.
3. APP     todo el resto de styles/  solo tokens de rol. Ninguna regla de acá
                                     nombra un color ni un tema.
```

**La regla del sistema: ninguna regla de la app nombra un color.** Los selectores usan **tokens de rol** (`--titulo-seccion`, `--accion`, `--cifra`, `--navegar`, `--aviso`, `--dato-suave`, `--marca`, `--link`, `--cat-*`…) y cada tema decide qué color cumple cada uno.

**Esa regla la hace cumplir un test, no la disciplina**: `src/styles/contrato-de-temas.test.ts` falla si aparece un hex en la capa de la app, si alguien usa la paleta cruda de un tema (`--p-*`) fuera de su archivo, si un CSS de la app menciona un tema, o si un tema no declara el contrato completo. Antes de este test, la regla se había degradado a 141 violaciones sin que nadie lo notara.

### Agregar un tema

1. Crear `src/styles/temas/tema-X.css` con la paleta `--p-*` y **todos** los roles del contrato (copiar la cabecera de otro tema).
2. Importarlo en `src/styles/index.css`.
3. Sumar la letra a `TEMAS` y una entrada a `INFO_DE_TEMA` en `src/app/tema.ts`, y al array `var TEMAS` del script inline de `index.html`.
4. `npm test` — si falta un rol o alguna lista quedó desincronizada, el test lo dice con el token exacto.

No se toca ni un componente. El tema A se agregó así: un archivo nuevo y tres líneas.

### Al tocar color

Cambiar el token de rol en el archivo del tema, nunca un hex suelto en un componente. Si hace falta un rol nuevo, se declara en **todos** los temas (el test lo exige). Los colores de ícono van en clases (`.icono-*` en `componentes.css`), nunca inline en el TSX.

**Cuidado con las custom properties anidadas**: una property que contiene `var()` se resuelve **en el elemento donde se declara**, no donde se usa. Por eso `--titulo-receta` se declara sobre `[data-cat]` y no en `:root`. Ese mismo mecanismo es el que permite que un tema elija entre título fijo o color de categoría sin nombrarse: `var(--titulo-receta-fijo, var(--cat-actual))`.

### Colores nuevos, medidos

Contra la vara real que cumple el tema D sobre sus propios valores: **ΔE ≥ 26 entre categorías**, **ΔE ≥ 13 contra los roles funcionales vecinos**, **contraste ≥ 4.5:1 como texto** sobre el papel (3:1 si es relleno). Medir antes de escribir el CSS, no después. Si el tono base no llega, se agrega una variante `-honda`, como `--p-zanahoria-honda`.

Renders: `npm run renders -- fase-N --tema=a|c|d`; salen a `docs/renders/fase-N-tema-{a,c,d}/`. Al refactorizar estilos, generar un baseline antes y comparar los PNG con `cmp`: es lo único que detecta un cambio visual no intencional.

## Arquitectura (resumen; detalle en docs/plan/02-arquitectura.md)

- Stack: TypeScript + React 19 + Vite (SPA estática) + vite-plugin-pwa + Dexie.js + Zod + Zustand + Vitest.
- **La semilla nunca entra a IndexedDB; los datos de usuario nunca salen de IndexedDB.**
- `scripts/build-seed.ts` normaliza `.artifacts/` → `seed.json` canónico en build-time. Forma desconocida = falla el build, nunca el runtime.
- Motor nutricional en `src/domain/`: funciones puras, sin imports de React/DOM/Dexie. Es lo único con cobertura de tests exhaustiva.
- Toda pantalla es **mobile-first y 100 % usable desde el celular**.

## Flujo de fases

Desarrollo incremental por fases (docs/plan/05-roadmap.md). Cada fase cierra con **renders** (screenshots reales vía `/renders` desde Fase 1) publicados para revisión de Facu, y una entrada en `lessons.md`. No pasar a la fase siguiente sin ese cierre.

## Punteros

- Plan completo: `docs/plan/`
- Bitácora de lecciones: `lessons.md` (actualizar al cierre de cada fase)
- Dataset y su documentación: `.artifacts/README-dataset.md` (ojo: la auditoría en `docs/plan/01-auditoria.md` corrige varios puntos de esa doc)
