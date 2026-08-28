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

## 8. T9 — pasos reescritos (las 84, estilo aprobado)

Las instrucciones del dataset son notas de cocinero, no una receta. Medido sobre las 84: **3,95 pasos y ~202 caracteres de instrucciones por receta entera**, un tuit corto. El 34 % de los pasos tiene menos de 40 caracteres, 7 recetas tienen menos de 3 pasos, y la mayoría de los ingredientes no aparece nunca.

Buena parte del arreglo es **recuperación, no invención**: los `.md` de `.artifacts/` traen detalle que el `.json` perdió, y cada línea de ingrediente declara su `funcion` y a veces su `unidad` posicional (`picado_en_tadka`).

### De dónde sale cada cosa

| nivel | fuente | ¿es invención? |
|---|---|---|
| 1 | prosa de `.artifacts/recetas-*.md` | no: estaba escrito y se perdió al normalizar |
| 2 | `funcion`, `unidad` y `nota` de cada línea | no: es dato estructurado del propio dataset |
| 3 | `secretos_chef`, `utensilios.json`, `glosario.json`, reglas R | no |
| 4 | técnica de cocina estándar: fuego, recipiente, señal visual | **sí** → `flag_gate: true` |

Las ocho entradas del piloto llevan `flag_gate: true`: todas suman algo del nivel 4. El campo `base` de cada una dice exactamente qué salió de dónde.

### El estilo (aprobado por Facu el 2026-08-27, con dos salvedades)

- Oración completa en rioplatense. Nada de `;` y `+` como pegamento.
- Cada paso dice qué entra, dónde, a qué fuego y **cuál es la señal** para pasar al siguiente ("hasta que se deshacen solas"), no solo el minutaje.
- Todo ingrediente `imprescindible` aparece en algún paso. Hay un test que lo verifica.
- El acompañamiento tiene su propio paso.
- Los `secretos_chef` no se absorben: siguen aparte.
- 4 a 8 pasos. Antes que apilar tres acciones en uno, se parte.
- Se conserva el énfasis útil del original (`A MANO`, `EN CALIENTE`, `TENEDOR`).
- **Sin códigos del dataset en los pasos** (salvedad 1): ni reglas (R8) ni ids de recetas (P04). El porqué se dice con palabras; otra receta, por su nombre.
- **Las correcciones de contenido no llegan a la app** (salvedad 2): viven en `nota`, que junto con `base` queda del lado del build — `transform.ts` solo toma `pasos`.

### El piloto

| id | receta | antes | ahora | por qué está en el piloto | ¿OK? |
|---|---|---|---|---|---|
| `r18` | Dal de lentejas turcas con tadka | 4 | 8 | el ejemplo de Facu; jengibre, pimienta y arroz no aparecían nunca | |
| `p24` | Ensalada de hojas, rabanito y manzana | 1 | 6 | 8 ingredientes, un solo paso | |
| `r28` | Ensalada de cuscús | 4 | 8 | la peor del dataset: 22 líneas de ingrediente; el aliño se nombraba sin decir qué lleva | |
| `p27` | Crema de vainilegumbres | 1 | 6 | la receta entera era "Licuar todo; contenerse" | |
| `p08` | Bifecitos de seitán | 4 | 8 | técnica pesada; "20 min por lado" vs. 40 de cocción declarados | |
| `p36` | Torta de mandioca y coco | 5 | 8 | horneado: es donde la imprecisión arruina el plato | |
| `r13` | Rolls de nori | 4 | 8 | técnica de manos; el armado entero era un paso | |
| `p11` | Picada vegana | 2 | 7 | combo: el "paso 2" era una lista de referencias, no un paso | |

### Las 76 restantes (2026-08-28)

Escritas con el mismo criterio, todas con `flag_gate: true`: cada una suma técnica estándar (fuego, recipiente, señal) que Facu valida cocinando. La columna "corrección" resume la `nota` de la entrada cuando los pasos viejos tenían un problema de contenido, no solo de redacción.

| id | receta | antes | ahora | corrección | ¿OK? |
|---|---|---|---|---|---|
| `d01` | Brownies de porotos negros | 4 | 6 |  | |
| `d02` | Galletitas de banana y avena | 4 | 4 |  | |
| `d03` | Mousse de chocolate y palta | 3 | 6 |  | |
| `d04` | Budín de banana integral | 5 | 7 |  | |
| `d05` | Bolitas de dátiles, cacao y maní | 3 | 5 |  | |
| `d06` | Crumble de manzana y avena | 4 | 4 |  | |
| `d07` | Helado de banana (nice cream) | 2 | 5 |  | |
| `d08` | Arroz con leche vegetal y canela | 4 | 5 |  | |
| `d09` | Budín de chía al cacao | 3 | 5 |  | |
| `d10` | Muffins integrales de zanahoria y nueces | 4 | 6 | La prosa del .md suma jengibre en polvo a las especias, pero no existe como línea de ingrediente en el JSON: no entra a los pasos. La sal sí, como despensa básica. | |
| `p01` | Leche de soja casera | 5 | 7 |  | |
| `p02` | Leche de coco casera | 3 | 4 |  | |
| `p03` | Manteca vegana | 3 | 6 | La línea del aceite de oliva dice "cda_girasol" en la unidad: se nombró oliva, que es lo que dice el ingrediente. | |
| `p04` | Queso de maní (muzza fundente) | 4 | 6 |  | |
| `p05` | Quesofu (untable de tofu) | 3 | 6 |  | |
| `p06` | Queso de papa (paparella) | 4 | 5 |  | |
| `p07` | Masa integral para tartas | 4 | 6 |  | |
| `p09` | Guiso de lentejas liviano (base licuada) | 4 | 6 |  | |
| `p10` | Milanesas de soja (de okara) | 4 | 5 | La línea del pimentón trae "+ sal, curry, ajo en polvo" como parte del condimento: se nombran como opcionales aunque no tengan línea propia. | |
| `p12` | Curry de garbanzos y seitán con durazno | 4 | 6 | El seitán no aparecía en ningún paso viejo: entra en cubos junto con los duraznos y los garbanzos. El "ají" de los pasos viejos es la línea de pimentón picante (la unidad dice ají o cayena). | |
| `p13` | Coliflor en adobo filipino | 5 | 7 |  | |
| `p14` | Sopa crema de garbanzo, espinaca y manzana | 3 | 4 |  | |
| `p15` | Ñoquis de calabaza con crema de frutos secos | 5 | 8 | La salsa entera era un solo paso viejo para cinco ingredientes. El remojo de 4 h de los frutos secos es previo y pasivo: se declara de entrada y no entra en los 40 min de preparación declarados. | |
| `p16` | Relleno de soja texturizada y hongos | 4 | 5 |  | |
| `p17` | Hamburguesas de texturizada y remolacha | 5 | 7 | La cocción declarada es 0 porque el batch termina congelado en placa: la cocción real es al momento de comerlas, siempre desde el freezer. | |
| `p18` | Sushi — técnica maestra de arroz | 5 | 8 |  | |
| `p19` | Pastel de papas | 5 | 7 |  | |
| `p20` | Locro vegano | 5 | 8 |  | |
| `p21` | Burgers de aduki | 5 | 7 | Los 10 minutos de cocción del encabezado son los de la sartén: la alternativa al horno tarda 20-25 y queda como opción. | |
| `p22` | Tarta de zapallitos, zanahoria y tofu | 4 | 6 | El paso viejo tiraba "semillas por encima" que no existen como línea de la receta: se sacan. | |
| `p23` | Vitel toné vegano de seitán | 6 | 8 |  | |
| `p25` | Ensalada de banana y remolacha | 1 | 4 | El paso viejo arrancaba con la remolacha ya hervida y el encabezado declara 20 minutos de cocción: el hervor ahora es un paso. | |
| `p26` | Crema chocoporotos | 1 | 5 |  | |
| `p28` | Panqueques de avena y banana | 3 | 4 |  | |
| `p29` | Budín de banana clásico | 4 | 6 | La cucharada de esencia de vainilla, imprescindible en la lista, no aparecía en ningún paso. | |
| `p30` | Carrot cake liviana | 2 | 6 | Dos pasos para diez ingredientes: el azúcar, la vainilla, el polvo de hornear y las nueces no aparecían en ninguno. | |
| `p31` | Pastafrola | 5 | 6 |  | |
| `p32` | Brownies de aduki y avena | 3 | 6 | La línea de aceite dice oliva en el id pero "taza_girasol" en la unidad: se escribió "de girasol o de oliva" para no contradecir ninguna de las dos. | |
| `p33` | Brownies de poroto y girasol | 3 | 6 |  | |
| `p34` | Brownies chocoporotos sin harina | 4 | 6 | Los pasos viejos daban 190° 20-40 min "según molde" y el encabezado declara 25: se dejó 25 como referencia para el molde chico de la receta, el rango como aviso y la señal del palillo mandando. | |
| `p35` | Arroz con leche de coco | 4 | 5 |  | |
| `p37` | Lemonies | 3 | 6 |  | |
| `p38` | Bocaditos helados de banana y chocolate | 3 | 5 |  | |
| `p39` | Crumble de manzana con crema de vainiporotos | 5 | 7 | El paso viejo de la masa ("manteca pomada + impalpable + vainilla + harina") omitía los 50 g de fécula que la lista asigna a la masa: se incorporaron ahí. | |
| `p40` | Pudding de chía y chocolate | 3 | 4 |  | |
| `p41` | Torta/budín de coco | 3 | 6 |  | |
| `p42` | Cuadrados de limón (agar) | 4 | 7 |  | |
| `p43` | Pan proteico de calabaza | 5 | 6 | El levado de 1 hora y los 15 minutos de activación del original no entran ni en prep (20) ni en cocción (25): se mantienen con su señal, porque sin ellos no hay pan. | |
| `p44` | Masa de pizza de masa madre (sin amasado) | 3 | 5 |  | |
| `p45` | Crackers de masa madre | 4 | 6 |  | |
| `r01` | Sopa de lentejas rojas al estilo turco | 5 | 6 |  | |
| `r02` | Curry de garbanzos y espinaca | 6 | 7 |  | |
| `r03` | Hummus cremoso técnica Zahav | 5 | 5 |  | |
| `r04` | Boloñesa de lentejas y nueces | 5 | 7 | Los pasos viejos pedían 600 ml de caldo que no existe como línea de la receta: queda como agua —o caldo, si hay—, con el agua de despensa. | |
| `r05` | Tofu revuelto (scramble) | 5 | 5 |  | |
| `r06` | Hamburguesas de porotos negros | 5 | 7 |  | |
| `r07` | Bowl de quinoa con garbanzos crocantes y salsa de tahini | 4 | 6 |  | |
| `r08` | Sopa crema de calabaza asada | 5 | 6 | Los pasos viejos rectificaban con "gotas de limón", que no existe como línea de ingrediente: se saca. | |
| `r09` | Guiso de lentejas argentino (veganizado) | 6 | 7 | Los pasos viejos cocinaban con "caldo", que no existe como línea de ingrediente: se usa agua hirviendo — la salsa de soja ya pone el fondo de sabor. | |
| `r10` | Budín de chía y avena nocturno | 4 | 5 |  | |
| `r11` | Salteado de tofu y brócoli al sésamo con arroz integral | 4 | 7 | El arroz integral tarda más que los 20 minutos de cocción declarados: se pone a cocinar primero y el salteado se hace mientras — el encabezado cuenta solo el wok. | |
| `r12` | Ensalada de kale masajeado, garbanzos y naranja | 3 | 5 | La receta entera eran tres pasos telegráficos: se despliega el armado. | |
| `r14` | Fideos al pesto de albahaca y nueces con tomates asados | 4 | 6 |  | |
| `r15` | Chili sin carne con cacao | 4 | 6 | Los pasos viejos servían "con palta", que no existe como línea de ingrediente: se saca. | |
| `r16` | Omelette de harina de garbanzo con verduras | 4 | 6 |  | |
| `r17` | Guiso toscano de alubias y kale | 5 | 6 |  | |
| `r19` | Tabule de quinoa con menta | 4 | 6 |  | |
| `r20` | Arroz integral salteado con edamame, champiñones y maní | 5 | 6 |  | |
| `r21` | Milanesas de tofu al horno | 6 | 6 |  | |
| `r22` | Tacos de lentejas con palta y crema de limón | 5 | 7 | La receta lista los 2 dientes de ajo "para el sofrito", pero la crema también pide ajo: se reparte un diente para cada lado. | |
| `r23` | Burritos de porotos negros con arroz al limón | 4 | 7 |  | |
| `r24` | Ensalada mediterránea con tofu marinado al horno | 4 | 7 |  | |
| `r25` | Ensalada tibia de quinoa, garbanzos y verduras asadas | 4 | 6 | Los pasos viejos nunca ubicaban los garbanzos; la prosa pide placa amplia para "garbanzos y verduras CON espacio", así que se asan juntos. El comino figuraba a la vez en el asado y en el aliño: se reparte, con una pizca reservada para el aliño. | |
| `r26` | Guiso de quinoa con verduras y garbanzos | 4 | 8 |  | |
| `r27` | Ensalada de arroz integral, lentejas y aliño cítrico | 4 | 6 |  | |
| `r29` | Ensalada de garbanzos, palta y tomate con aliño de comino | 4 | 5 |  | |

### Correcciones de contenido, no solo de redacción

- **`r18`**: los pasos nombraban un **"ají" que no existe como línea de ingrediente**. Se saca.
- **`r18`**: el jengibre, la pimienta negra (que está por la regla R8, curcumina + pimienta) y el arroz de acompañamiento no aparecían en ningún paso.
- **`r28`**: el aliño se mencionaba como bloque sin decir qué lleva; sus 7 componentes estaban solo en la lista de ingredientes.
- **`p08`**: "20 min por lado" contra los 40 minutos de cocción del encabezado. Se explicita que son 20 y 20.
- **`p11`**: el segundo "paso" era una lista de referencias a otras recetas.

### Lo que garantizan los tests, no la buena intención

`scripts/build-seed/transform.test.ts`, `describe('pasos (T9)')`:

- **Las 84 recetas tienen entrada en T9**: una receta nueva sin pasos curados rompe el build.
- **Ningún paso nombra un código del dataset** (`/\b[rpud]\d{1,2}\b/i`).
- Ninguna receta curada baja de 3 pasos.
- Ningún paso baja de 40 caracteres.
- **Todo ingrediente `imprescindible` se nombra en los pasos** — el test que caza "22 ingredientes, 4 pasos".
- El matcher de ingredientes tiene sus propios casos: tolera acento y plural, y no da por nombrada la `sal` dentro de "salsa".
- Una entrada de T9 para una receta inexistente **rompe el build**.

## 9. T10 — qué es y por qué importa cada nutriente (Fase 3, pendiente de revisión de Facu)

La ficha de un nutriente mostraba dosis, ajuste vegano y fuentes, pero nunca decía qué es ni por qué está en el catálogo: "Proteína (lisina)" pasó dos fases sin explicar. El dataset no trae ese texto — su prosa es la señal vegana, no el rol fisiológico. T10 lo cura: el rol sale de las fichas NIH ODS que el dataset ya cita como fuentes, y la señal vegana de la sección de `nutrientes-veganos.md` que cada `base` indica. **Sin dosis nuevas**: los números siguen viviendo en la RDA y las notas.

El texto completo se lee en la ficha (renders de la fase) o en `NUTRIENT_DESCRIPTIONS` (`curated-tables.ts`). Acá, la afirmación más fuerte de cada texto — que es lo que hay que revisar — y de dónde sale:

| nutriente | la afirmación más fuerte | rol desde | señal vegana | ¿OK? |
|---|---|---|---|---|
| Vitamina B12 | su falta sostenida daña los nervios, a veces sin vuelta atrás; ningún vegetal la aporta de forma confiable | NIH ODS [1] | A1 (IC 8) | |
| Vitamina D | casi ningún alimento vegetal la trae, y en el invierno porteño la síntesis cutánea cae fuerte | NIH ODS [5] | A2 | |
| Hierro | la carencia más común; la vitamina C en la misma comida lo multiplica, mate/té/café lo bloquean | NIH ODS [6] | A3 | |
| Zinc | los fitatos de granos y legumbres frenan su absorción; remojar, fermentar o tostar la mejora | NIH ODS [13] | A4 | |
| Calcio | el de espinaca y acelga casi no cuenta, por sus oxalatos | NIH ODS [11] | A5 | |
| Yodo | la fuente vegana confiable es la sal yodada; las sales marinas y rosadas generalmente no lo están | NIH ODS [17] | A6 | |
| Selenio | las castañas de Pará lo concentran tanto que una o dos por día alcanzan — y conviene no pasarse | NIH ODS [20] · verificado 2026-08 | A7 | |
| Omega-3 | el cuerpo convierte mal el ALA en EPA/DHA; el exceso de girasol o maíz compite con esa conversión | NASEM [22] | A8 | |
| Proteína | se mide proteína total; la lisina es termómetro: cubierta la lisina, el resto del perfil se acomoda solo | clave `prot_g` de la semilla | A9 (AND 2016, IC 7) | |
| Vitamina C | su rol estratégico acá es multiplicar la absorción del hierro; se pierde con el hervor largo | NIH ODS [27] | B1 | |
| Vitamina A | los carotenoides necesitan algo de grasa en la comida para absorberse | NIH ODS [9] | B2 | |
| Folato (B9) | legumbres y hojas verdes lo cubren de sobra; el hervor largo se lo lleva | NIH ODS [28] | B3 | |
| Riboflavina (B2) | la fuente omnívora principal son los lácteos: sin ellos, almendras, hongos y levadura nutricional | NIH ODS [29] · verificado 2026-08 | B4 | |
| Vitamina E | girasol, almendras, palta y oliva la cubren sin esfuerzo | NIH ODS [30] | B5 | |
| Vitamina K | las hojas verdes la cubren de sobra; liposoluble, mejor con algo de grasa | NIH ODS [31] · verificado 2026-08 | B6 | |
| Vitamina B6 | rara vez falta en una dieta variada | NIH ODS [29] | B7 | |
| Magnesio | la dieta vegana suele ser rica: semillas, cacao, almendras, legumbres e integrales | NIH ODS [32] | B8 | |
| Potasio | la dieta vegana tiende a ser alta — y eso juega a favor | NIH ODS / NASEM 2019 [33] | B9 | |
| Fibra | el efecto colateral bueno de comer plantas; una dieta vegana suele superarla sin proponérselo | NASEM [22] | B10 | |
| Colina | la fuente omnívora principal es el huevo; la evidencia de deficiencia real en veganos es limitada | NIH ODS [35] · verificado 2026-08 | B11 (emergente, IC 5) | |

**Si alguno no te cierra**: se corrige el texto en T10 y la ficha lo toma en el próximo build. Un nutriente sin entrada en T10 **rompe el build** (`transform.ts`), y el test exige los 20 con más de 40 caracteres.

## 10. T11 — el nombre del nutriente de proteína (2026-08-28, #123)

El dataset lo llama "Proteína (lisina)", pero la clave que se mide es `prot_g`: proteína total. Ningún ingrediente trae lisina medida, así que el paréntesis afirma una validación que no existe — y en la peor dirección: la masa de pizza `p44`, 100 % trigo (el cereal pobre en lisina), aparecía aportando 28 % de "Proteína (lisina)". `NUTRIENT_NAME_OVERRIDES` (T11) lo renombra a **"Proteína"** en toda la app; la lisina como limitante práctico sigue explicada en su ficha (T10) y en el ajuste vegano del dataset ("~3 porciones/día de legumbres/soja/quinoa").
