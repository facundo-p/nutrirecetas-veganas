# Fase 1 — Gate de datos (para revisión de Facu)

Todas las decisiones de datos tomadas a mano durante la ingesta viven en `scripts/build-seed/curated-tables.ts` y se listan acá para tu revisión. **Marcá la columna "¿OK?"** (o corregí el valor y lo ajusto en la tabla curada — jamás en `.artifacts/`). Nada de esto bloquea el uso de la app; sí afecta la precisión de la nutrición por porción.

## 1. Porciones parseadas (34 recetas con `porciones` string)

Las que traen número explícito entre paréntesis las tomé tal cual (no las listo: p19=6, p22=6, p31=10, p32/33/42=12, p37=9, p39=8, p44=5, p23=9 del rango "8-10"). **Estas son propuestas mías:**

| id | receta | dato original | porciones propuestas | criterio | ¿OK? |
|---|---|---|---|---|---|
| p10 | Milanesas de soja (de okara) | "~8 unidades" | **4** | 2 milanesas por porción | |
| p11 | (untable) | "libre" | **sin porciones** → nutrición por 100 g | | |
| p17 | (nuggets, familia hamburguesas) | "~15 unidades" | **5** | 3 por porción | |
| p18 | Rolls de nori | "3 rolls" | **3** | 1 roll por porción | |
| p21 | Medallones | "6-8 medallones" | **7** | punto medio, 1 por porción | |
| p28 | Panqueques de avena y banana | "4 panqueques" | **4** | 1 por porción | |
| p29/p30/p41/p43 | budineras (banana, carrot, etc.) | "1 budinera" | **8** | 8 rodajas por budinera | |
| p34 | Brownies chocoporotos | "1 molde chico" | **8** | 8 brownies | |
| p36 | Torta (molde 24 cm) | "molde 24 cm" | **10** | | |
| p38 | Bocaditos helados | "~12 bocaditos" | **12** | 1 por porción | |
| p45 | (frasco: ¿granola?) | "1 frasco grande" | **sin porciones** → por 100 g | | |

## 2. Rendimiento en gramos de los 11 preparados

Necesario para encadenar nutrición (p. ej. 250 g de queso de maní dentro del pastel de papas). Los marcados ⚠ son **estimaciones mías** y son los que más afectan el cálculo:

| id | preparado | rendimiento_g | base | ¿OK? |
|---|---|---|---|---|
| p01 | Leche de soja | 1800 | "~1.8 L" | |
| p02 | Leche de coco | 500 | "~500 ml" | |
| p03 | Manteca vegana | 200 | "~200 g" | |
| p04 | Queso de maní | 500 | "~500 g" | |
| p05 | Quesofu | 350 | "~350 g" | |
| p06 | Queso de papa | **480** ⚠ | 530 g de insumos − merma de horno | |
| p07 | Masa integral para tartas | **370** ⚠ | suma de insumos (masa cruda) | |
| p08 | Bifecitos de seitán | **750** ⚠ | 375 g de masa + absorción de caldo al hervir | |
| p16 | Relleno de soja texturizada | **550** ⚠ | 322 g de insumos + hidratación de la texturizada | |
| p26 | Crema chocoporotos | 700 | "~700 g" | |
| p27 | Crema de vainilegumbres | 500 | "~500 g" | |

## 3. Líneas migradas a preparados (modelo nuevo)

Mapeos directos que no necesitan revisión (la unidad original los declara): p12 seitán→p08 (100 g) · p19 maní-como-queso→p04 (250 g) · p20 seitán salsa→p08 (200 g) · p34 crema P26→p26 (250 g) · p39 crema P27→p27 (200 g).

**Decisiones que sí quiero que valides:**

| receta | decisión | consecuencia nutricional | ¿OK? |
|---|---|---|---|
| p31 Pastafrola | la línea `margarina 250 g` ahora referencia **tu manteca vegana (p03)** | cuenta la nutrición de p03 (base coco), no margarina comprada | |
| p39 Crumble | ídem: `margarina 275 g` → p03 | ídem | |
| p22 Tarta de zapallitos | **agregué una línea**: 1 masa p07 entera (370 g) — el dataset lista solo el relleno | la tarta ahora suma la masa (+~1100 kcal totales) | |
| p10 / p30 / p44 | `usa_preparados` queda solo como enlace navegable (okara ≠ leche; la leche de coco ya está desagregada; el queso va sobre la pizza armada) | sin cambio nutricional | |

## 4. Preguntas abiertas menores

| tema | situación | propuesta | ¿OK? |
|---|---|---|---|
| Sustitutos texto libre | 100 de 166 no resuelven a un ingrediente ("copos de maíz + harina de almendras") | quedan como sugerencia textual en v1; se mapean a ids después, empezando por las recetas más cocinadas | |
| `uva` | está en estacionalidad pero no tiene ficha de ingrediente | queda fuera de la app hasta que exista la ficha (¿la agregamos como tarea de datos?) | |
| Cobertura con agua/caldo | el agua no lista minerales ⇒ en sopas la cobertura de hierro da ~17 % aunque el dato real es bueno (el agua aporta ~0) | la app muestra la cobertura honesta tal cual; alternativa: tratar agua/caldo como "cero real" en vez de "sin dato" (subiría la cobertura reportada) — decidilo vos | |
| Vitamina K | ningún ingrediente trae `vitk_ug` ⇒ siempre "sin datos" | mostrar "sin datos" es honesto; cargar vitk de hojas verdes queda como tarea de datos | |
| Sinónimos | el README prometía "chickpeas" en garbanzos; los datos no lo traen (86/158 sí tienen sinónimos) | nada que hacer en la app; anotado como imprecisión de la doc | |
| Peso por unidad | 17 frescos usados en recetas no tienen `peso_por_unidad` | afecta la lista de compras (Fase 3): mostrará solo gramos para esos | |

## 5. Correcciones a la documentación del dataset detectadas en la ingesta

Ninguna requiere acción tuya; quedan registradas: `grupo` de nutrientes es `critico|importante` (no A/B) · `notas` de nutrientes es una lista estructurada con confianza · `guarda.freezer` a veces es texto ("solo el pesto") → se canonizó a `freezer: true` + nota · `envases_locales_ar` trae rangos `[min,max]` · 1 kcal explícitamente `null` (se trata como sin dato).
