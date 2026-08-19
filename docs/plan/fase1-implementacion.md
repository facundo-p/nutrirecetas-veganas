# Fase 1 — Plan de implementación

> **Para trabajadores agénticos:** SUB-SKILL REQUERIDA: usar superpowers:executing-plans (o subagent-driven-development) para implementar tarea por tarea. Los pasos usan checkboxes (`- [ ]`).

**Objetivo:** app PWA que navega el recetario completo offline con nutrición honesta calculada desde ingredientes: scaffolding, pipeline `build-seed`, motor nutricional puro, pantallas Recetario / Detalle / Ingredientes / Glosario, skills `/renders` y `/cierre-fase`, y gate de datos para Facu.

**Arquitectura:** los JSON crudos de `.artifacts/` (read-only) se normalizan en build-time a un `seed.json` canónico commiteado (`scripts/build-seed/`); la app lo importa estático. El motor nutricional vive en `src/domain/` (funciones puras, sin React/DOM). UI React 19 con router hash, CSS propio con tokens de la Propuesta C.

**Stack:** TypeScript + React 19 + Vite + vite-plugin-pwa + Zod + Vitest. **Dexie y Zustand se difieren a Fase 2** (no hay datos de usuario ni sesión de cocina en Fase 1 — YAGNI). Playwright como dev-dep solo para renders e íconos PWA.

**Spec:** `docs/plan/01-auditoria.md` (transformaciones), `02-arquitectura.md` (§2.1 pipeline, §5 motor), `03-funcionalidades.md`, `04-interaccion-y-estetica.md` (Propuesta C + íconos), `05-roadmap.md` (alcance Fase 1), CLAUDE.md (invariantes).

## Restricciones globales

- Todo en rama `staging`; jamás tocar `main`. `.artifacts/` jamás se edita.
- `g_aprox` única fuente de cálculo; `unidad` display puro. Nulos jamás son cero en silencio (cobertura por nutriente).
- `perfil_nutricional_porcion_aprox` NO entra a la semilla.
- Forma desconocida en la ingesta = falla el build, nunca el runtime. Ids inmutables (diff contra semilla anterior).
- Alerta B12 siempre que una receta (directa o vía preparados) use levadura nutricional.
- **Código en inglés** (identificadores, archivos, funciones — CLAUDE.md); los **campos de datos** de la semilla conservan los nombres del dataset (`g_aprox`, `porciones_num`: son datos, no código). UI y docs en castellano rioplatense.
- Mobile-first: toda pantalla usable a 390 px. Sin reborde lateral de acento en tarjetas. Semáforo nunca comunica solo con color (Fase 1 no tiene semáforo aún, pero bandas/IC ya siguen la regla: ícono + texto).
- Tipografías self-hosted: Fraunces (display) + Schibsted Grotesk (datos), vía @fontsource. Nada de Inter/Roboto.
- 5 deps de runtime máximo en v1; en Fase 1: react, react-dom, zod (dexie/zustand/workbox llegan después).

## Estructura de archivos

```
package.json / vite.config.ts / tsconfig.json / index.html / .gitignore (ampliar)
scripts/
  build-seed/
    index.ts            # CLI (tsx)
    load.ts             # lee .artifacts/*, valida forma cruda mínima
    curated-tables.ts   # TODAS las decisiones de datos (revisables por Facu)
    transform.ts        # unificación recetas + porciones + preparados + referencias
    rules-ast.ts        # compila condicion R1-R15 a AST tipado
    rda.ts              # canoniza claves RDA
    validate.ts         # integridad referencial + Zod + diff semilla anterior
    *.test.ts           # colocados
  renders.mjs           # Playwright: screenshots 390/1280
  gen-pwa-icons.mjs     # Playwright: SVG → PNG 192/512 maskable (one-off)
src/
  seed/
    schema.ts           # Zod: única fuente de tipos de la semilla
    seed.json           # GENERADO por build-seed, commiteado
    index.ts            # carga tipada + índices por id (Maps)
  domain/
    interval.ts         # aritmética {min,max}
    nutrition.ts        # cálculo receta (cobertura, IC, recursión, B12)
    rda.ts              # resolución RDA canónicas + referencia genérica
    *.test.ts
  app/
    App.tsx / router.ts # router hash propio (~40 líneas, sin dep)
    Nav.tsx
  ui/
    icons/              # ~26 SVG como componentes React
    recipes/ recipe-detail/ ingredients/ glossary/ common/
  styles/
    tokens.css base.css # Propuesta C completa
public/ (manifest vía plugin, íconos PWA, fondo optimizado)
.claude/skills/renders/SKILL.md
.claude/skills/cierre-fase/SKILL.md
docs/plan/fase1-gate-datos.md   # entregable del gate
```

---

## Tablas curadas (van en `scripts/build-seed/curated-tables.ts`; Facu las revisa en el gate)

### T1 — Porciones string → `{porciones_num, porciones_display}` (34 recetas, set P)

Regla: número explícito entre paréntesis = confiable; el resto es **propuesta** (`estimada: true`, listada en el gate). Preparados: `porciones_num: null` (su nutrición va por 100 g vía `rendimiento_g`).

| id | string | porciones_num | estimada |
|---|---|---|---|
| p01–p07, p16, p26, p27 | (preparados) | null | — |
| p10 | "~8 unidades" | 4 (2 milanesas c/u) | ✔ |
| p11 | "libre" | null (nutrición por 100 g) | ✔ |
| p17 | "~15 unidades" | 5 (3 c/u) | ✔ |
| p18 | "3 rolls" | 3 | ✔ |
| p19 | "bandeja 28x22 (6 porciones)" | 6 | — |
| p21 | "6-8 medallones" | 7 | ✔ |
| p22 | "1 tarta mediana (6 porciones)" | 6 | — |
| p23 | "8-10 porciones fiesta" | 9 | — |
| p28 | "4 panqueques" | 4 | ✔ |
| p29 / p30 / p41 / p43 | "1 budinera" | 8 | ✔ |
| p31 | "molde 22-25 cm (10 porciones)" | 10 | — |
| p32 / p33 / p42 | "1 placa (12)" | 12 | — |
| p34 | "1 molde chico" | 8 | ✔ |
| p36 | "molde 24 cm" | 10 | ✔ |
| p37 | "fuente chica (9)" | 9 | — |
| p38 | "~12 bocaditos" | 12 | ✔ |
| p39 | "molde 28 cm (8)" | 8 | — |
| p44 | "5 bollos" | 5 | — |
| p45 | "1 frasco grande" | null (por 100 g) | ✔ |

### T2 — Preparados: `rendimiento_g` (11 = p01-p08 + p16 + p26 + p27; p08 es preparado de facto)

| id | dato en `porciones` | rendimiento_g | base de la estimación | estimada |
|---|---|---|---|---|
| p01 | "~1.8 L" | 1800 | densidad ≈ leche | — |
| p02 | "~500 ml" | 500 | ídem | — |
| p03 | "~200 g" | 200 | explícito | — |
| p04 | "~500 g" | 500 | explícito | — |
| p05 | "~350 g" | 350 | explícito | — |
| p06 | "1 pizza grande" | 480 | 530 g insumos − merma horno | ✔ |
| p07 | "1 tarta" | 370 | suma insumos (masa cruda) | ✔ |
| p08 | 6 porciones | 750 | 375 g masa seitán + absorción de caldo | ✔ |
| p16 | "~4 porciones de relleno" | 550 | 322 g insumos + hidratación texturizada | ✔ |
| p26 | "~700 g" | 700 | explícito | — |
| p27 | "~500 g" | 500 | explícito | — |

p08 además: `es_preparado: true` aunque `tipo: "salada"` se mantiene (p12 y p20 lo consumen). En la semilla `es_preparado = (tipo === 'preparado') || id === 'p08'`.

### T3 — Migración de líneas fantasma → `ref_receta_id`

Una línea canónica referencia `{tipo:'ingrediente'|'receta', id}`. Mapeos (clave: `receta_id + ingrediente_id + unidad` de la línea original):

| receta | línea original | → ref | g_aprox | nota |
|---|---|---|---|---|
| p12 | `gluten_trigo` 100 "g_seitan_en_cubos" | receta p08 | 100 | seitán ya cocido |
| p19 | `mani` 250 "g_como_queso_P04" | receta p04 | 250 | — |
| p20 | `gluten_trigo` 200 "g_seitan_SALSA" | receta p08 | 200 | — |
| p31 | `margarina` 250 "g" | receta p03 | 250 | Facu usa su manteca vegana (flag gate) |
| p34 | `porotos_negros` 250 "taza_de_crema_P26_sin_aceite_coco" | receta p26 | 250 | — |
| p39 | `porotos_alubia` 200 "g_como_crema_P27" | receta p27 | 200 | — |
| p39 | `margarina` 275 "g_masa + 150 crumble" | receta p03 | 275 | flag gate |
| p22 | **línea faltante** (la tarta no lista su masa) | **agregar** receta p07 | 370 | 1 masa entera; flag gate |

Enlaces solo navegacionales (sin tocar líneas): p10→p01 (consume el okara, no la leche), p30→p02 (la leche de coco ya está desagregada en agua+coco), p44→p06 (el queso va sobre la pizza, no en la masa). `usa_preparados` se conserva en la semilla como campo navegacional.

### T4 — Canonización RDA (claves reales encontradas)

`hombre`→`{sexo:'masculino',19,50}` · `mujer`/`mujer_19_50`→`{sexo:'femenino',19,50}` · `mujer_posmenopausia`/`mujer_mayor_50`→`{sexo:'femenino',51,999}` · `adultos`/`adultos_19_50`→`{19,50}` · `mayores_70`→`{70,999}` · `hombre_ala_g`→`{sexo:'masculino',19,999}` · `mujer_ala_g`→`{sexo:'femenino',19,999}` · `adultos_g_kg`→`{19,999,por_kg:true}`. Clave desconocida = build falla. Resolución (domain): match por sexo+edad, más específico primero; sin match exacto → entrada de edad más cercana con `aproximada: true`.

### T5 — Referencias de reglas/utensilios

- `reglas_disparadas`: `R11_no_aplica_es_nori`→`{id:'R11', calificador:'no_aplica_es_nori'}`; `R9_no_lino_pero_analogo`→`{id:'R9', calificador:'no_lino_pero_analogo'}`; `U2_si_sarten` se **mueve** a utensilios como `{tipo:'regla_utensilio', id:'U2', calificador:'si_sarten'}`. Patrón general: `/^([RU]\d+)(?:_(.+))?$/`.
- `utensilio_recomendado`: `U*` (+`_critico`) → `{tipo:'regla_utensilio', id, calificador?}`; el resto (`budinera_muffinera`, `frascos`, `minipimer`, `placa_horno`) → `{tipo:'equipo', id}` si existe en `utensilios.json#equipos`, sino `{tipo:'equipo_libre', nombre}` (dato menor, auditoría #14).

### T6 — Conceptos de reglas (targets de R que no son ids reales)

`hojas_verdes`→categoría `verdura_hoja` · `cereal_integral`→ids con base integral (avena, arroz_integral, harina_integral, cebada, quinoa…) · `tomate_cocido`→`tomate` (calificador cocido) · `zanahoria_cocida`→`zanahoria` (ídem) · `castana_para`→id real castaña de Pará · `lino_entero`→id real del lino. La tabla final se completa contra los ids reales de `ingredientes-v1.3.json`; **el validador exige que todo target resuelva** o falla el build.

### T7 — Conservación: grupos → criterio de aplicación

28 de 41 items son grupos. Cada uno se resuelve a `{tipo:'categoria', categorias:[…]}` o `{tipo:'ids', ids:[…]}` (ej.: `legumbres_secas`→categoría legumbre · `especias_molidas`→categoría especia · `frutos_secos`→categoría fruto_seco · `algas`→alga · `hojas_verdes_frescas`→verdura_hoja · `tofu_abierto`→ids de tofu · `palta_madura`→palta · estados post-cocción como `legumbres_cocidas`, `guisos_sopas`, `caldo_casero`, `hamburguesas_crudas`, `panificados`, `aquafaba` → `{tipo:'estado'}`: se muestran en el Glosario/ficha como tabla general de conservación, no atados a un ingrediente). Validador: toda categoría/id referenciado debe existir.

### Otras decisiones de ingesta

- Set 1 sin `tipo` → los 10 son `salada` (set fundacional salado).
- `dificultad`: enum ordenado de 5: `trivial < muy fácil < fácil < media < difícil`.
- `estado_sugerido`/`confianza_adaptacion` (sets 1-3) y `estado`/`confianza` (set P) → `estado` (`probada`|`por-probar`) + `ic` (1-10).
- Valores nutricionales: número | `{min,max,tipico?,nota?}` → intervalo canónico `{min,max}` + `nota?` (el `tipico` se descarta del cálculo; punto medio = (min+max)/2).
- Se descartan: `perfil_nutricional_porcion_aprox`, `ingredientes_nuevos_para_base`, `campos_sugeridos_app`, archivos supersedidos.
- Semilla versionada: `{ seed_schema_version: '1.0.0', dataset_version: '1.0', content_hash: sha256 }`. Diff contra `src/seed/seed.json` previo si existe: id de receta/ingrediente/nutriente que desaparece o cambia = build falla.

---

## Decisiones de motor y UI (Fase 1)

- **Cobertura por nutriente** = % de la masa total (g) de la receta cuyos ingredientes tienen dato de ese nutriente. Ingrediente sin la clave = masa sin dato (jamás cero silencioso).
- **IC de un valor calculado** = promedio de `confianza` de los ingredientes que aportan, ponderado por masa, redondeado hacia abajo. Se muestra con brotes (1-3: IC ≤4 / 5-7 / ≥8).
- **Recursión de preparados**: `ref_receta_id` → nutrición del preparado /100 g (= total ÷ `rendimiento_g` × 100) × g de la línea. Set de visitados + profundidad máx 3; ciclo o exceso = error (no puede pasar: la semilla se valida en build).
- **Por porción** = total ÷ `porciones_num`; si es null → se muestra "por 100 g" (÷ masa total × 100).
- **Alerta B12**: la receta o cualquier preparado que resuelva usa `levadura_nutricional` → advertencia fija (el dato min=0 la justifica siempre).
- **"Rica en X"** (filtro Recetario): punto medio por porción ≥ 20 % de la **RDA de referencia genérica** = máx entre entradas adultas canónicas × factor vegano si existe (hierro ×1.8, zinc ×1.5); proteína usa 70 kg de referencia. Es un filtro de exploración, no el semáforo (Fase 2 lo personaliza). Se documenta en la UI ("referencia adulto genérico").
- **"De estación"** (filtro y badges): ingrediente en pico si el mes actual ∈ `meses_pico`; receta "de estación" si ≥1 ingrediente fresco está en pico. Badge por ingrediente en Detalle y ficha.
- **Reglas R como tips**: Fase 1 muestra el `mensaje` de las reglas en `reglas_disparadas` de la receta (con calificador visible si `no_aplica`). El evaluador vivo del AST queda para Fase 2 (sesión de cocina). El AST **sí** se compila y valida en build desde ya.
- **Íconos**: los ~26 del glosario de `04-interaccion-y-estetica.md` §4, SVG 24px stroke 1.75 `currentColor`, componentes React. El Glosario los lista con su significado.
- **Fase 1 explícitamente NO incluye**: perfil/semáforo personalizado, escalado, cocinar/registrar, plan semanal, compras, Dexie, Zustand, export/import.

---

### Tarea 1: Scaffolding

**Files:** package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx, src/app/App.tsx, src/styles/{tokens,base}.css, .gitignore

**Produce:** proyecto que levanta con `npm run dev`, `npm test` (Vitest) y `npm run build` verdes.

- [ ] package.json a mano (sin `npm create`): deps `react@^19 react-dom@^19 zod@^4`; devDeps `vite @vitejs/plugin-react typescript vite-plugin-pwa vitest @testing-library/react jsdom @fontsource-variable/fraunces @fontsource/schibsted-grotesk playwright tsx`. Scripts: `dev`, `build` (= `npm run seed && tsc -b && vite build`), `preview`, `test` (= `vitest run`), `seed` (= `tsx scripts/build-seed/index.ts`), `renders`.
- [ ] tsconfig estricto (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`).
- [ ] `src/styles/tokens.css`: los 14 tokens de la Propuesta C (04 §3, iteración 4) + tipografía + espaciado. `base.css`: reset mínimo, fondo `fondo-verduras-suave` optimizado (convertir a WebP ≤200 KB con Pillow a `public/fondo.webp`, `background-size: cover`), tarjetas `--tofu` borde fino, filetes dobles.
- [ ] App mínima que muestra el nombre de la app con Fraunces sobre papel ocre. Verificar: dev server, build y un test trivial de Vitest pasan.
- [ ] Commit: `feat(f1): scaffolding Vite+React+TS con tokens Carta de estación`

### Tarea 2: Esquema de la semilla (Zod)

**Files:** src/seed/schema.ts (+ test)

**Produce (tipos que consumen todas las tareas siguientes; nombres de tipo en inglés, campos = datos en castellano):**

```ts
export type Interval = { min: number; max: number };             // puntual ⇒ min===max
export type NutrientValue = { intervalo: Interval; nota?: string };
export type Ingredient = { id; nombre; sinonimos: string[]; categoria; base?;
  kcal?: NutrientValue; nutrientes: Record<string, NutrientValue>; // claves = 21 conocidas, otra ⇒ error
  destacados?: string[]; ic: number; fuentes: string[]; notas?; origen? };
export type RdaEntry = { sexo?: 'masculino'|'femenino'; edad_min: number; edad_max: number; valor: number; por_kg?: true };
export type Nutrient = { id; nombre; grupo: 'A'|'B'; unidad; rda: RdaEntry[];
  ajuste_vegano?: { factor?: number; descripcion: string }; ul?: number|null; ul_nota?;
  ventana: 'dia'|'semana'; ventana_nota?; ic: number; notas? };
export type Predicate = /* unión discriminada de los 12 tipos de T6/rules-ast */;
export type Rule = { id; tipo: 'potenciador'|'inhibidor'|'sugerencia'|'tecnica'|'correccion'|'precaucion'|'dato';
  predicados: Predicate[]; condicion_original: unknown; mensaje; ic: number };
export type LineRef = { tipo: 'ingrediente'; id: string } | { tipo: 'receta'; id: string };
export type Line = { ref: LineRef; cantidad: number; unidad_display: string; g_aprox: number;
  funcion?; imprescindible?: boolean; sustitutos: Array<{tipo:'id'|'texto'; valor:string}>; nota? };
export type Recipe = { id; nombre; tipo: 'salada'|'dulce'|'preparado'|'combo'|'pan';
  es_preparado: boolean; rendimiento_g?: number; porciones_num: number|null; porciones_display: string;
  estado: 'probada'|'por-probar'; ic: number; fuente?; set_origen: 1|2|3|'P';
  familia?; variante_de?; usa_preparados: string[]; indulgente?: boolean; candidata_clasica?: boolean;
  dificultad: 'trivial'|'muy fácil'|'fácil'|'media'|'difícil'; tiempo_prep_min; tiempo_coccion_min;
  lineas: Line[]; pasos: string[]; secretos_chef: string[]; guarda?: { heladera_dias?: number; freezer?: boolean };
  reglas: Array<{id:string; calificador?:string}>; utensilios: Array<{tipo:'regla_utensilio'|'equipo'|'equipo_libre'; id?:string; nombre?:string; calificador?:string}>;
  objetivo?: string; nota? };
export type Seed = { seed_schema_version; dataset_version; content_hash;
  ingredientes: Ingredient[]; nutrientes: Nutrient[]; reglas: Rule[]; recetas: Recipe[];
  equivalencias; estacionalidad; conservacion; glosario; utensilios };
```

- [ ] Escribir esquema Zod completo + test que valida/rechaza fixtures mínimos. Commit `feat(f1): esquema Zod de la semilla canónica`.

### Tarea 3: build-seed — carga y unificación de recetas

**Files:** scripts/build-seed/{load,transform,curated-tables}.ts + tests

- [ ] `load.ts`: lee los 12 JSON vigentes de `.artifacts/` (ruta relativa al repo). Test: carga real devuelve 84 recetas, 158 ingredientes, 20 nutrientes, 15 reglas.
- [ ] `curated-tables.ts`: T1, T2, T3, T5, T6, T7 tal cual arriba, exportadas con tipos.
- [ ] `transform.ts` (TDD, un test por transformación con líneas reales del dataset):
  - unificar campos (estado/ic, tipo set1='salada', dificultad 5 niveles, set_origen);
  - porciones vía T1 (numéricas pasan directo; string sin entrada en T1 = error);
  - preparados vía T2/T3 (marca `es_preparado`, asigna `rendimiento_g`, reemplaza líneas fantasma por `ref` receta, agrega la línea p22→p07; preparado sin `rendimiento_g` = error);
  - sustitutos: id resoluble → `{tipo:'id'}`, resto `{tipo:'texto'}` (test: 66 y 100);
  - referencias vía T5; valores nutricionales a `ValorNutriente`.
- [ ] Commit `feat(f1): build-seed carga+transformaciones con tablas curadas`

### Tarea 4: build-seed — reglas AST, RDA, validación y emisión

**Files:** scripts/build-seed/{rules-ast,rda,validate,index}.ts + tests; src/seed/{seed.json,index.ts}

- [ ] `rules-ast.ts`: compila las 15 `condicion` reales a `Predicate[]` (clave desconocida ⇒ throw). Test: R1 produce `[{tipo:'receta_rica_en',nutrientes:['hierro'],umbral_mg_porcion:3},{tipo:'contiene_nutriente_min',nutriente:'vitc_mg',cantidad:25}]`; una condición inventada `{foo:1}` revienta.
- [ ] `rda.ts`: T4. Test: hierro → 3 entradas canónicas; clave inventada revienta.
- [ ] `validate.ts`: integridad referencial total (líneas→ingredientes/recetas, variante_de, usa_preparados, estacionalidad, conservación T7, conceptos T6, equivalencias→ingredientes), Zod de la semilla completa, y diff contra `src/seed/seed.json` anterior (ids que desaparecen ⇒ error; si no existe archivo, se saltea). `content_hash` = sha256 del contenido canónico sin el propio hash.
- [ ] `index.ts`: orquesta y escribe `src/seed/seed.json` estable (claves ordenadas). Correr `npm run seed` real: **la semilla se genera sin errores** — si un dato real rompe el validador, se corrige la tabla curada (jamás `.artifacts/`) y se anota para el gate.
- [ ] `src/seed/index.ts`: `loadSeed(): Seed` (parse Zod en dev, cast en prod) + Maps por id (`ingredientById`, `recipeById`, `nutrientById`) + `variantsOf(id)`, `consumersOf(id)` (recetas cuyas líneas referencian un preparado).
- [ ] Commit `feat(f1): semilla canónica v1 generada y validada`

### Tarea 5: domain — intervalos

**Files:** src/domain/interval.ts + test

**Produce:** `interval(n)`, `add(a,b)`, `scale(a,k)`, `midpoint(a)`, `sum(xs)`.

- [ ] TDD: puntuales colapsados (min===max), suma de intervalos suma extremos, escalar ×2 duplica ambos extremos (property test con fast-check NO — a mano con casos tabulados, sin dep nueva), punto medio. Commit `feat(f1): aritmética de intervalos`.

### Tarea 6: domain — nutrición de receta

**Files:** src/domain/nutrition.ts + test

**Produce:**

```ts
export type NutrientResult = { intervalo: Interval; cobertura_pct: number; ic: number|null };
export type RecipeNutrition = { masa_total_g: number; kcal: NutrientResult;
  por_nutriente: Record<string, NutrientResult>;       // claves del catálogo de 20 + kcal aparte
  alerta_b12: boolean; porciones_num: number|null; rendimiento_g?: number };
export function computeNutrition(recipeId: string, s: Seed): RecipeNutrition;          // total receta
export function perPortion(n: RecipeNutrition): RecipeNutrition | null;                // null si porciones_num null
export function per100g(n: RecipeNutrition): RecipeNutrition;                          // usa rendimiento_g ?? masa_total_g
```

- [ ] TDD con fixtures sintéticos chicos: suma por 100 g→g_aprox, cobertura con ingrediente sin dato, IC ponderado, rango {min,max}.
- [ ] Recursión: fixture A consume B (rendimiento 200 g) → nutrición esperada a mano; ciclo artificial revienta con mensaje claro.
- [ ] Alerta B12: fixture con levadura directa y vía preparado.
- [ ] **Golden tests contra la semilla real**: r01 (set 1) y p19 (encadena p04+p16) — valores esperados calculados a mano con script independiente en scratchpad, hardcodeados en el test con comentario de procedencia. Property checks tabulados: escalar una receta ×2 duplica el intervalo; el punto medio de la suma = suma de puntos medios.
- [ ] Commit `feat(f1): motor nutricional puro con golden tests`

### Tarea 7: domain — RDA y filtro "rica en"

**Files:** src/domain/rda.ts + test

**Produce:** `resolveRda(n: Nutrient, sexo, edad, peso_kg?): {valor:number, aproximada?:true}` · `genericReferenceRda(n: Nutrient): number` (máx adulto × factor vegano; proteína 70 kg) · `isRichIn(nut: RecipeNutrition, nutrientId, s): boolean` (≥20 % por porción, o por 100 g si no hay porciones).

- [ ] TDD: hierro mujer 30 → 18×1.8; hombre 60 con calcio (sin entrada exacta) → aproximada; proteína por_kg. Commit `feat(f1): RDA canónicas y filtro rica-en`.

### Tarea 8: shell de la app + PWA

**Files:** src/app/*, vite.config.ts (pwa), public/, scripts/gen-pwa-icons.mjs

Antes de esta tarea y hasta la 12: **invocar la skill frontend-design** (calidad visual) y respetar 04 §3 Propuesta C.

- [ ] Router hash propio: `useRuta(): {pantalla, id?}` sobre `hashchange` (`#/recetario`, `#/receta/:id`, `#/ingredientes`, `#/ingrediente/:id`, `#/glosario`). Default `#/recetario`.
- [ ] Nav inferior mobile (3 secciones: Recetario, Ingredientes, Glosario) con íconos propios; en ≥900 px pasa a header con filetes dobles de carta.
- [ ] Ícono de app: hoja de espinaca en línea sobre papel (SVG propio) → `gen-pwa-icons.mjs` lo rasteriza a 192/512 + maskable con Playwright. Commitear PNGs.
- [ ] vite-plugin-pwa: `registerType:'prompt'`, manifest standalone castellano, precache total (shell+seed+fuentes+fondo+íconos). Toast "Hay una versión nueva" sin auto-reload. `navigator.storage.persist()` al arrancar.
- [ ] Commit `feat(f1): shell navegable + PWA instalable`

### Tarea 9: set de íconos

**Files:** src/ui/icons/*.tsx (uno por concepto), src/ui/icons/catalog.ts

- [ ] Los 26 del spec 04 §4 (semáforo-hoja ×5, ventanas ×2, datos ×3, tipos de receta ×6, prácticos ×8, alerta B12, estrella brotada) + cuchara colmada para `indulgente`. 24 px, stroke 1.75, `currentColor`, `aria-hidden` + texto siempre al lado (regla 6). `catalog.ts` exporta `{id, Componente, significado, grupo}` — lo consume el Glosario.
- [ ] Commit `feat(f1): set de íconos botánicos propio`

### Tarea 10: Recetario

**Files:** src/ui/recipes/{RecipeList,RecipeCard,RecipeFilters}.tsx (+ test de agrupación/búsqueda con Testing Library)

- [ ] Lista de 84 con variantes agrupadas: madre con badge "N variantes" expandible (12 variantes bajo 8 madres); preparados con badge frasco.
- [ ] Búsqueda por nombre + por ingrediente (resuelve sinónimos vía índice). Filtros: tipo, dificultad, tiempo total máx, familia, de estación, estado, rico-en nutriente (usa `isRichIn`). Chips estilo carta, colores-verdura con rol (lechuga para tags).
- [ ] Tarjeta: ícono de tipo coloreado, tiempo, dificultad (llamas), freezer, brotes IC. Sin reborde lateral. Densidad confirmada por Facu (lessons: no volver a tocar).
- [ ] Test: agrupación (d01 muestra 3 variantes anidadas), búsqueda "chickpeas" encuentra recetas con garbanzos.
- [ ] Commit `feat(f1): recetario con búsqueda, filtros y variantes agrupadas`

### Tarea 11: Detalle de receta

**Files:** src/ui/recipe-detail/{RecipeDetail,NutritionTable,IntervalBand,B12Alert,RuleTips}.tsx

- [ ] Header: nombre (Fraunces berenjena), íconos tipo/tiempo/dificultad/porciones/freezer/IC, familia y variantes/madre enlazadas, estado.
- [ ] Ingredientes estilo carta (puntos de guía entre nombre y cantidad): `unidad_display` + gramos, asterisco botánico si imprescindible, `funcion`, sustitutos (id → enlace; texto → sugerencia), badge estación por ingrediente. Líneas `ref` receta → enlace al preparado; sección inversa "Se usa en" (`consumersOf`).
- [ ] Nutrición por porción (o por 100 g si `porciones_num` null): por nutriente banda ≈ con punto medio + rango, brotes IC, cobertura ("calculado sobre el 91 % del peso"); cifras clave en itálica serif zanahoria. Alerta B12 (escudo) cuando corresponde — texto exacto del invariante.
- [ ] Tips de reglas (`mensaje` de reglas_disparadas; calificador `no_aplica` en gris con nota). Guarda + pasos + secretos del chef.
- [ ] Commit `feat(f1): detalle con nutrición honesta en vivo`

### Tarea 12: Ingredientes y Glosario

**Files:** src/ui/ingredients/{IngredientList,IngredientDetail}.tsx, src/ui/glossary/Glossary.tsx

- [ ] Lista 158: búsqueda nombre/sinónimo, filtro categoría, filtro "fuentes de X" (ordena por aporte /100 g del nutriente elegido). Ficha: nutrición /100 g con bandas+IC (base declarada visible, ej. "cocidos"), sinónimos, estacionalidad (meses pico), conservación aplicable (T7), peso por unidad si existe, recetas que lo usan.
- [ ] Glosario: pestaña Íconos (catálogo completo con significado, agrupado) + pestaña Términos (37, agrupados por categoría, con sinónimos).
- [ ] Commit `feat(f1): ingredientes y glosario`

### Tarea 13: verificación offline + skills de proyecto

**Files:** scripts/renders.mjs, .claude/skills/renders/SKILL.md, .claude/skills/cierre-fase/SKILL.md

- [ ] `npm run build` + `vite preview`: verificar en el manifest de Workbox que seed/fuentes/fondo están precacheados; Lighthouse manual queda para Fase 4.
- [ ] `renders.mjs`: levanta preview, screenshots de `#/recetario`, `#/receta/p19`, `#/receta/r01`, `#/ingredientes`, `#/ingrediente/garbanzos`, `#/glosario` a 390×844 y 1280×800 → `docs/renders/fase-1/`. Skill `/renders`: correr script y publicar Artifact con las capturas.
- [ ] Skill `/cierre-fase`: checklist (tests verdes, `npm run build` verde, renders publicados, entrada en lessons.md, gate de datos al día, pedir revisión a Facu; jamás mergear a main).
- [ ] Commit `feat(f1): renders reproducibles y skills de cierre`

### Tarea 14: gate de datos + cierre

**Files:** docs/plan/fase1-gate-datos.md, lessons.md

- [ ] Gate: tabla completa T1 (34 porciones con flag estimada), T2 (rendimientos, 4 estimados), decisiones T3 (2 flags margarina→p03 + línea p22), sustitutos texto libre (propuesta: quedan textuales en v1), `uva` sin ficha, huecos de peso_por_unidad (17 frescos), y cualquier corrección que el validador haya forzado. Formato: tablas con columna "¿OK?" para que Facu marque.
- [ ] Correr `/renders`, publicar Artifact, entrada en lessons.md (qué funcionó/rompió/cambió), commit y reporte final a Facu con el gate.

## Autochequeo (hecho al escribir el plan)

- Cobertura del spec Fase 1 (roadmap §Fase 1): scaffolding T1 ✓ pipeline T3-T4 ✓ gate T14 ✓ motor T5-T7 ✓ UI T8-T12 ✓ skills T13 ✓.
- Tipos consistentes entre tareas (esquema.ts es la fuente; domain consume `Semilla`).
- Sin placeholders: las tablas curadas están completas con datos reales extraídos el 2026-08-19.
