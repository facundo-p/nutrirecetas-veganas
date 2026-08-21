# 01 — Auditoría del dataset

Auditoría ejecutada con scripts Node sobre los JSON reales de `.artifacts/` (2026-08-17), tal como exige el BRIEF §0.2. Método: carga de los 12 archivos vigentes, verificación de integridad referencial, conteos independientes de cada afirmación del `README-dataset.md` §5, y chequeos propios (sanidad de perfiles precargados, claves de nutrientes, referencias de reglas/utensilios, cobertura de equivalencias).

## 1. Lo que la documentación afirma y los datos confirman

- 158 ingredientes sin ids duplicados; 84 recetas (10+20+9+45) sin colisiones de id entre sets.
- **0 FK huérfanas** en las 803 líneas de ingrediente de los 4 sets.
- `g_aprox` presente en el **100 %** de las líneas (ningún rango, ningún null): es viable como única fuente de cálculo.
- 42 ingredientes sin bloque `nutrientes` (especias, condimentos); 19 además sin `kcal`. El cálculo debe tolerar nulos y reportar cobertura.
- Deriva de campos entre sets tal como se documenta: sets 1-3 usan `estado_sugerido` + `confianza_adaptacion`; set P usa `estado` + `confianza`; set 1 no tiene `tipo` (10 recetas sin tipar).
- `ingredientes_nuevos_para_base` de sets 1 y 2 (17 + 16) **ya están fusionados** en v1.3 → ignorar al importar, como advierte el README.
- Estacionalidad: 40/41 match directo por `ingrediente_id` (solo `uva` no tiene ficha de ingrediente).
- Conservación: 13/41 match directo; el resto son categorías (`legumbres_cocidas`, `hierbas_frescas`) → matching flexible, como advierte §5.9.
- `perfil.json` contiene placeholders (fecha 1990-01-01, peso 75) → onboarding con datos reales.
- `guarda` está presente y uniforme (`heladera_dias`, `freezer`) en las 84 recetas. Tiempos de prep/cocción completos en todas.

## 2. Lo que contradice o agrega a la documentación

La doc fue escrita por otra instancia de Claude y tiene puntos ciegos. Ninguno es bloqueante; todos cambian decisiones de implementación.

| # | Hallazgo | Doc dice | Los datos dicen | Consecuencia |
|---|---|---|---|---|
| 1 | Condiciones de reglas R1–R15 | "prosa en lenguaje natural, no ejecutable" (§3.3) | **Objetos semi-estructurados**: predicados ad-hoc (`receta_rica_en`, `contiene_ingrediente`, `sin_nutriente`, `umbral_mg_porcion`, `suplementos_simultaneos`…) | No hace falta "traducir prosa": hace falta un **intérprete chico sobre un AST canónico**. Mucho más barato de lo previsto. |
| 2 | Valores rango {min,max} | 36 | **45** (algunos con `nota` embebida dentro del objeto valor) | La aritmética de intervalos debe aceptar `{min, max, nota?}`. |
| 3 | Sustitutos texto libre | 84 de 166 | **100 de 166** (66 resolubles a id) | Menos sustituciones con recálculo de las esperadas; mapeo progresivo a ids como tarea de datos. |
| 4 | Perfiles precargados | 39/84, "usar como sanity check (>30 % = error de datos)" | **43/84** (set P tiene 4), **ninguno tiene kcal**, solo nutrientes selectos por receta. Chequeo hecho: **45 de 101 comparaciones desvían >30 %** (ambas direcciones; ej. r08 vitamina A: calculado 1375 µg vs precargado 700 µg) | Los precargados **no sirven ni como sanity check**: se descartan del runtime. Quedan como referencia histórica en la fuente. |
| 5 | `ajuste_vegano` | número multiplicador (ej. 1.8) | **Objeto** con `descripcion`, `confianza`, `fuentes` y solo a veces `factor` numérico (hierro ×1.8, zinc ×1.5) | Aplicar factor solo donde existe; el resto se muestra como guía textual. **No inventar factores.** |
| 6 | Claves RDA | uniformes (`hombre_19_50`…) | Heterogéneas: `hombre`, `mujer_19_50`, `mujer_posmenopausia`, `adultos`, `adultos_19_50`, `mayores_70`, `hombre_ala_g`, `adultos_g_kg` (proteína es **g/kg de peso**) | Canonizar a `{sexo?, edad_min, edad_max, valor, por_kg?}` en la ingesta. |
| 7 | `unidad` texto libre | 191 valores (set P) | **295 en total** (set1 34, set2 73, set3 57, setP 191) | Confirma: `unidad` es display puro; jamás parsearlo. |
| 8 | `porciones` | "a veces string" | **34/84 son string**, todas del set P (`"molde 22-25 cm (10 porciones)"`, `"~1.8 L"`, `"libre"`) | Tabla de parseo curada a mano en la ingesta: `{porciones_num, porciones_display}`. Sin `porciones_num` no hay nutrición por porción. |
| 9 | Ids de reglas/utensilios en recetas | limpios | Ids libres: `R11_no_aplica_es_nori`, `R9_no_lino_pero_analogo`, `U2_si_sarten`, `U1_critico`, `U7_critico`, y mezcla de ids de regla (U*) con ids de equipo (`budinera_muffinera`, `frascos`, `minipimer`, `placa_horno`) en `utensilio_recomendado` | Normalizar en ingesta: separar referencia limpia + calificador (`critico`, `no_aplica`…). |
| 10 | Preparados | 10 tipados (p01-p07, p16, p26, p27) | **p08 (bifecitos de seitán) es preparado de facto**: p12 y p20 lo consumen vía `usa_preparados` sin que p08 tenga `tipo: "preparado"` | La migración de preparados incluye p08 → 11 preparados efectivos. |
| 11 | Claves de nutriente en ingredientes | 21 documentadas | Existe además **`vitd_ug`** en 2 ingredientes (rangos con nota), y `vitd` ES uno de los 20 nutrientes del catálogo (crítico, ventana semana) | El semáforo de vitamina D dependerá casi exclusivamente del suplemento declarado. No es un bug: es la realidad vegana. |
| 12 | `dificultad` | enum de 4 (trivial/fácil/media/difícil) | 5 valores: aparece **"muy fácil"** (4 recetas) | Normalizar o aceptar 5 niveles. |
| 13 | UL de magnesio | — | UL 350 < RDA hombre 410, con `ul_nota`: **"el UL aplica solo a suplementos"** | El semáforo NO debe alertar exceso de Mg alimentario. Generalizable: respetar `ul_nota`. |
| 14 | Utensilios | — | El kit mínimo menciona sartén antiadherente y bifera de hierro que **no existen como `equipos`**; `recomendaciones_por_receta` cubre solo 20 recetas | Dato menor; se muestra tal cual o se completa como tarea de datos. |
| 15 | `base` de ingredientes | crudo/cocido/seco | **38 valores distintos** (`"tal cual, SOLO EN FRÍO"`, `"cruda (consumir MOLIDA)"`…) | Display puro. No parsear. Las mayúsculas embebidas son advertencias de uso reales. |

## 3. Datos de seguridad verificados

- `levadura_nutricional.b12_ug = {min: 0, max: 100}` con nota "SOLO si fortificada; en Argentina muchas NO lo están". **14 recetas** usan levadura nutricional. Con min = 0, el motor debe tratar el aporte de B12 como no garantizado y disparar la advertencia siempre. Invariante de seguridad del BRIEF §4.

## 4. Huecos de datos (no bloquean; se informan como tareas)

1. **`rendimiento_g` de preparados**: para calcular nutrición /100 g de un preparado consumido por otra receta hace falta su rendimiento total en gramos. `porciones` string tipo `"~500 g"` lo trae para varios (p02, p04, p05, p26, p27); otros necesitan un dato de Facu (lista concreta al cierre de Fase 1).
2. **Peso por unidad**: 17 de 38 frescos usados en recetas no tienen `peso_por_unidad` (apio, coliflor, puerro, repollo…). La lista de compras muestra gramos (medida principal para Facu) y unidades solo donde hay dato.
3. **Envases locales**: solo 3 entradas. Suficiente dado que Facu no compra enlatados; queda como dato secundario.
4. `uva` aparece en estacionalidad sin ficha de ingrediente.
5. **Auditoría USDA pendiente** (§5.11 del README): verificar los ~20 ingredientes más usados contra FoodData Central. Tarea de datos, backlog.

## 5. Transformaciones que la ingesta debe hacer (resumen ejecutable)

Unificar esquema de recetas (deriva de campos) · parsear `porciones` con tabla curada · canonizar RDA · compilar reglas R a AST (forma desconocida = build falla) · migrar preparados a `ref_receta_id` en líneas (tabla curada; incluye p08) · normalizar referencias de reglas/utensilios · resolver conservación a referencias explícitas · descartar `perfil_nutricional_porcion_aprox` y `ingredientes_nuevos_para_base` · validar integridad + diff contra semilla anterior (ids inmutables).
