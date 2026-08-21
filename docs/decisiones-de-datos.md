# Gate de datos

Todas las decisiones de datos tomadas a mano viven en `scripts/build-seed/curated-tables.ts`. Facu revisa cada fila; **sus respuestas quedan en la columna "¿OK?"** y se aplican a la semilla (`npm run seed`). Este documento es el registro de por qué cada dato es como es.

Las secciones 1 a 5 son de la **Fase 1** (revisadas por Facu el 2026-08-19); la 6 es de la **Fase 2** (revisada el 2026-08-21). Todas ✅ resueltas.

## 0. Qué cambió al aplicar la revisión

| cambio | antes → después |
|---|---|
| Porciones de p17, p21, p28, p36, p38 | 5→**3**, 7→**4**, 4→**2**, 10→**12**, 12→**6** |
| Rendimiento de p16 (relleno de soja texturizada) | 550 g → **650 g** |
| Margarina en p31 y p39 | la línea usa la manteca vegana p03 y ahora **ofrece margarina como sustituto** al mismo peso |
| Agua (`agua`, `agua_helada`) | pasa a contar como **aporte cero real**: suma cobertura en vez de restarla. El caldo sigue como "sin datos" |
| Ceros con cobertura baja | dejan de mostrarse como "0 mg": si no hay cobertura para afirmarlo, la app dice **"sin datos"** |

Las porciones y rendimientos que Facu confirmó sin cambios dejaron de estar marcados como estimación: ya son dato del recetario.

## 1. Porciones parseadas (34 recetas con `porciones` string)

Las que traen número explícito entre paréntesis las tomé tal cual (no las listo: p19=6, p22=6, p31=10, p32/33/42=12, p37=9, p39=8, p44=5, p23=9 del rango "8-10"). **Estas son propuestas mías:**

| id | receta | dato original | porciones propuestas | criterio | ¿OK? |
|---|---|---|---|---|---|
| p10 | Milanesas de soja (de okara) | "~8 unidades" | **4** | 2 milanesas por porción | OK|
| p11 | (untable) | "libre" | **sin porciones** → nutrición por 100 g | | OK|
| p17 | (nuggets, familia hamburguesas) | "~15 unidades" | **3** | 5 por porción | ✅ corregido (era 5) |
| p18 | Rolls de nori | "3 rolls" | **3** | 1 roll por porción |OK |
| p21 | Medallones | "6-8 medallones" | **4** | ~7 medallones, 2 por porción | ✅ corregido (era 7) |
| p28 | Panqueques de avena y banana | "4 panqueques" | **2** | 2 por porción | ✅ corregido (era 4) |
| p29/p30/p41/p43 | budineras (banana, carrot, etc.) | "1 budinera" | **8** | 16 rodajas por budinera |OK |
| p34 | Brownies chocoporotos | "1 molde chico" | **8** | 8 brownies | OK|
| p36 | Torta (molde 24 cm) | "molde 24 cm" | **12** | | ✅ corregido (era 10) |
| p38 | Bocaditos helados | "~12 bocaditos" | **6** | 2 por porción | ✅ corregido (era 12) |
| p45 | (frasco: ¿granola?) | "1 frasco grande" | **sin porciones** → por 100 g | | OK|

## 2. Rendimiento en gramos de los 11 preparados

Necesario para encadenar nutrición (p. ej. 250 g de queso de maní dentro del pastel de papas). Los marcados ⚠ son **estimaciones mías** y son los que más afectan el cálculo:

| id | preparado | rendimiento_g | base | ¿OK? |
|---|---|---|---|---|
| p01 | Leche de soja | 1800 | "~1.8 L" |OK |
| p02 | Leche de coco | 500 | "~500 ml" | OK|
| p03 | Manteca vegana | 200 | "~200 g" |OK |
| p04 | Queso de maní | 500 | "~500 g" |OK |
| p05 | Quesofu | 350 | "~350 g" |OK |
| p06 | Queso de papa | **480** ⚠ | 530 g de insumos − merma de horno | OK|
| p07 | Masa integral para tartas | **370** ⚠ | suma de insumos (masa cruda) |OK |
| p08 | Bifecitos de seitán | **750** ⚠ | 375 g de masa + absorción de caldo al hervir | OK|
| p16 | Relleno de soja texturizada | **650** | 322 g de insumos + hidratación de la texturizada | ✅ corregido (era 550) |
| p26 | Crema chocoporotos | 700 | "~700 g" | OK|
| p27 | Crema de vainilegumbres | 500 | "~500 g" | OK|

## 3. Líneas migradas a preparados (modelo nuevo)

Mapeos directos que no necesitan revisión (la unidad original los declara): p12 seitán→p08 (100 g) · p19 maní-como-queso→p04 (250 g) · p20 seitán salsa→p08 (200 g) · p34 crema P26→p26 (250 g) · p39 crema P27→p27 (200 g).

**Decisiones que sí quiero que valides:**

| receta | decisión | consecuencia nutricional | ¿OK? |
|---|---|---|---|
| p31 Pastafrola | la línea `margarina 250 g` referencia **la manteca vegana (p03)** | cuenta la nutrición de p03 (base coco) | ✅ + margarina queda como sustituto al mismo peso |
| p39 Crumble | ídem: `margarina 275 g` → p03 | ídem | ✅ ídem p31 |
| p22 Tarta de zapallitos | **agregué una línea**: 1 masa p07 entera (370 g) — el dataset lista solo el relleno | la tarta ahora suma la masa (+~1100 kcal totales) | OK|
| p10 / p30 / p44 | `usa_preparados` queda solo como enlace navegable (okara ≠ leche; la leche de coco ya está desagregada; el queso va sobre la pizza armada) | sin cambio nutricional | OK|

## 4. Preguntas abiertas menores

| tema | situación | propuesta | ¿OK? |
|---|---|---|---|
| Sustitutos texto libre | 100 de 166 no resuelven a un ingrediente ("copos de maíz + harina de almendras") | quedan como sugerencia textual en v1; se mapean a ids después, empezando por las recetas más cocinadas | sin objeción — queda así |
| `uva` | está en estacionalidad pero no tiene ficha de ingrediente | queda fuera de la app hasta que exista la ficha | ✅ anotado en el backlog del roadmap |
| Cobertura con agua/caldo | el agua no lista minerales ⇒ la cobertura bajaba por el peso del líquido | **agua = cero real** (suma cobertura), **caldo = sin datos** (varía según con qué se hizo) | ✅ aplicado. Efecto colateral que trajo: un cero con cobertura baja ya no se muestra como "0 mg" sino como "sin datos" |
| Vitamina K | ningún ingrediente trae `vitk_ug` ⇒ siempre "sin datos" | mostrar "sin datos" es honesto; cargar vitk de hojas verdes queda como tarea de datos | OK |
| Sinónimos | el README prometía "chickpeas" en garbanzos; los datos no lo traen (86/158 sí tienen sinónimos) | la app busca por los sinónimos que el dataset sí trae; el nombre canónico es el porteño (garbanzos) | ✅ |
| Peso por unidad | 17 frescos usados en recetas no tienen `peso_por_unidad` | afecta la lista de compras (Fase 3): mostrará solo gramos para esos | ✅ anotado en el backlog del roadmap |

## 5. Correcciones a la documentación del dataset detectadas en la ingesta

Ninguna requiere acción tuya; quedan registradas: `grupo` de nutrientes es `critico|importante` (no A/B) · `notas` de nutrientes es una lista estructurada con confianza · `guarda.freezer` a veces es texto ("solo el pesto") → se canonizó a `freezer: true` + nota · `envases_locales_ar` trae rangos `[min,max]` · 1 kcal explícitamente `null` (se trata como sin dato).

## 6. Fase 2 — factores veganos que el dataset declara en prosa ✅ resuelto (revisado por Facu el 2026-08-21)

`ajuste_vegano` casi siempre trae un `factor` numérico (hierro ×1.8, zinc ×1.5) y la regla del proyecto es **no inventar factores donde no los hay**. Pero dos nutrientes traen el multiplicador escrito en la descripción en vez de en un campo, y el propio dataset lo confirma numéricamente en `perfil.json → objetivos_derivados_del_ejemplo`.

Estos dos factores **multiplican tus RDA**, así que se ven en el semáforo todos los días. Viven en `VEGAN_FACTORS_FROM_PROSE` (tabla T8).

| nutriente | factor | de dónde sale | qué te da a vos | ¿OK? |
|---|---|---|---|---|
| Proteína | **×1.25** | *"Práctico: ~1.0 g/kg (digestibilidad vegetal algo menor)"* sobre una RDA de 0.8 g/kg. El ejemplo del dataset deriva **75 g para 75 kg** | 1.0 g/kg en vez de 0.8 | ✅ OK |
| Omega-3 (ALA) | **×2** | *"Si no se suplementa EPA/DHA: duplicar ALA"*. El ejemplo del dataset deriva **3.2 g** desde una RDA de 1.6 g | 3.2 g/día en vez de 1.6, salvo que declares un suplemento de EPA/DHA | ✅ OK |

**Por qué esto no viola la regla de no inventar**: transcribir un número que el dataset escribió en una oración y confirmó en su propio ejemplo es leer el dato, no fabricarlo. Lo inventado sería ignorarlo por venir en prosa. Cualquier otro `ajuste_vegano` sin número sigue siendo guía textual, sin multiplicador.

**Si alguno no te cierra**: se saca de la tabla y ese nutriente vuelve a su RDA base sin ajuste.

## 7. Fase 2 — la proteína de quien entrena sale de la evidencia deportiva, no del dataset

El dataset topea la proteína en **1.0-1.2 g/kg** y mete en la misma casilla a alguien que entrena fuerza y a alguien de más de 60 sedentario (*"1.0-1.2 en >60 años o entrenamiento de fuerza"*, confianza **6/10**, fuente AND Position Vegetarian Diets 2016). Es una recomendación de población general vegana: no describe a quien entrena en serio.

Para los dos niveles de entrenamiento manda la literatura deportiva, que es más específica y más fuerte. La escalera vive en `src/domain/actividad.ts`, con la cita al lado de cada número.

| nivel | g/kg | de dónde sale | confianza |
|---|---|---|---|
| Sedentario | 1.0 | dataset (AND 2016) | 6 |
| Activo | 1.1 | dataset | 6 |
| Entrenás fuerza | **1.6** | ISSN Position Stand: 1.4-2.0 g/kg para quien entrena; el punto de rendimientos decrecientes cae cerca de 1.6 | 8 |
| Entrenamiento intenso | **2.0** | ISSN: extremo alto del rango para entrenados de fuerza, y una dieta vegana suma 10-20 % por digestibilidad (DIAAS más bajo) | 8 |
| piso 60+ (automático) | 1.2 | dataset | 6 |

**Por qué el dataset no gana acá**: la regla del proyecto es *no inventar factores*, no *no usar otra fuente*. Estos números tienen cita y confianza declaradas, más altas que la prosa que reemplazan. Lo que sí se mantiene: sin fuente no entra un nivel, y `actividad.test.ts` lo verifica.

**La edad salió del selector**: el "+60" era una opción a mano pudiendo derivarse de `fecha_nacimiento`. Ahora es un piso automático y gana el más alto de los dos, así que 61 años entrenando intenso pide 2.0 y no 1.2. El dataset dice ">60" y se cuenta desde los 60 cumplidos: redondear para el lado de pedir más proteína es el error barato.

**Qué cambia en el día a día**: a 75 kg, el nivel intenso pide 150 g/día contra los 90 g del techo anterior. Es esperable ver amarillo o rojo en proteína bastante seguido — es información correcta, no un problema a maquillar.

**Si no te cierra**: se cambia el factor en `ENTRENAMIENTO` y el test dice qué g/kg quedó. El escape individual sigue siendo un `override` con motivo, que pisa todo.
