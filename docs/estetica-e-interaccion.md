# 04 — Interacción y estética

## 1. Principio de interacción

Tres contextos de uso real mandan sobre todo lo demás:

1. **Cocinar con el celular en la mesada** (manos ocupadas, quizá sin señal): targets grandes, tipografía grande, pantalla siempre encendida, cero pasos innecesarios.
2. **Comprar en la verdulería** (una mano, apuro): checklist de lectura instantánea, gramos primero.
3. **Planificar sentado** (Mac o celular): densidad de información cómoda, el semáforo como protagonista.

**Toda pantalla es mobile-first y 100 % usable desde el celular** — sin backend no hay sync entre dispositivos, así que ninguna función puede quedar "solo desktop". En desktop las mismas vistas aprovechan el espacio (columnas laterales, grillas más anchas).

## 2. Mapa de pantallas

1. **Inicio / Hoy** — semáforo del día y la semana móvil (cada nutriente en SU ventana), qué toca cocinar según el plan, accesos rápidos (última cocción, lista de compras activa). Responde "¿cómo vengo y qué cocino?".
2. **Recetario** — búsqueda y filtros: tipo, dificultad, tiempo total, familia, en temporada, tu estado (sin probar / probada / pendiente / favorita), **por ingrediente** y **por nutriente** ("ricas en hierro", calculado en vivo). Variantes agrupadas bajo su madre (expandibles); preparados con badge. Tarjetas que resumen con íconos: tipo, tiempo, dificultad, freezer, estado.
3. **Detalle de receta** — selector de porciones con escalado y avisos; ingredientes con función/imprescindible/sustitutos; nutrición por porción en vivo (bandas ≈, IC, cobertura, alerta B12); reglas R como tips; enlaces a preparados y variantes; guarda y estacionalidad. Acciones: **Cocinar ahora · Al plan · A compras**.
4. **Cocinar (sesión)** — 1º personalizar: desmarcar (advertencia si imprescindible), sustituir (resolubles recalculan), agregar; la nutrición se mueve en vivo. 2º pasos con tipografía enorme, wake lock, secretos del chef en contexto. 3º registrar: qué cambió, notas, porciones que quedaron.
5. **Planificador semanal** — grilla de la semana; asignar recetas y ver el semáforo proyectado moverse por nutriente/ventana. Genera la lista de compras de la semana. En mobile: semana como lista vertical + semáforo colapsable siempre a un tap.
6. **Lista de compras** — consolidada por góndola; **gramos como medida principal**, unidades como referencia ("≈ 3 medianas"), latas como dato secundario; badges de estacionalidad. **Modo verdulería**: checklist offline de targets grandes.
7. **Diario** — historial de cocciones con variaciones y anotaciones; evolución del semáforo; desde una cocción: "convertir en receta propia".
8. **Ingredientes** — ficha de los 158: nutrición /100 g con bandas e IC, sinónimos, estacionalidad, conservación, equivalencias. Búsqueda por nombre/sinónimo ("chickpeas" encuentra garbanzos), filtros por categoría y por nutriente ("fuentes de calcio" ordenadas por aporte).
9. **Mi perfil** — datos para RDA (sin placeholders), suplementos declarados (apagan exigencia), objetivos derivados visibles.
10. **Glosario** — pestañas: **íconos** (cada uno con su significado) y **términos culinarios** (37 del dataset).
11. **Ajustes y datos** — export/import, recordatorio de backup, selector de tema, versión de semilla, actualización de la app. Se abre con el **engranaje del encabezado**, presente en las cuatro pantallas de sección; también desde Diario y con `#/ajustes`.

La carga/edición de recetas propias vive dentro del Recetario (Fase 4).

## 3. Estética: temas intercambiables

**Estado actual: dos temas vivos, E "Mercado" (default) y F "Pizarra".** Las propuestas A, C y D fueron los temas de las fases 1 a 3 y se borraron en #128 y #129; la B nunca se implementó. Las cuatro quedan registradas acá abajo: se fueron de la app, no del registro. Ver el detalle del sistema en `CLAUDE.md` § Temas visuales.

Desde el 20/8/2026 el sistema son **tres capas** (forma / temas / app) y un test que las hace cumplir: la capa de la app no puede escribir un color ni nombrar un tema, y cada tema debe declarar el contrato de roles completo. Agregar un tema es crear un archivo y sumarlo a tres listas.

Historial de iteraciones ([Render 0](https://claude.ai/code/artifact/b25c5547-deb5-430c-b227-b2f1791b6525) para las de Fase 0, [comparativa C vs D](https://claude.ai/code/artifact/08290d5b-0d10-4098-b225-dc422ba0696d) para la última):

- **Iteración 1** → Propuesta A (Botánica editorial). Facu la valoró como viable pero pidió más personalidad y notó que la paleta desaturada coincidía con otra app suya de huerta. **Volvió como tema vivo en la iteración 7**, ya no como default sino como una opción más.
- **Iteración 2** → Propuesta B (Tinta fresca): saturación plena + estructura de imprenta. Veredicto de Facu: carácter sí, dirección no — quería algo **sofisticado/elegante/gourmet**; rechazó los contornos negros gruesos y prefirió las tipografías de A. De la B sobrevive la idea central: **los colores de la app son los colores de las verduras**.
- **Iteraciones 3 a 5** → **Propuesta C (Carta de estación)**: brief de Facu "tan hermosa como un plato vegano colorido y saludable, sin sobresaturar". Suma su ilustración de fondo, saturación +1, berenjena y remolacha. Con ella se construyó la Fase 1.
- **Iteración 6** → **Propuesta D**, a partir de los renders reales: la categoría de cada receta se lee en el color de su título, espinaca y zanahoria pasan al frente. **Es el tema default desde el 19/8/2026.**
- **Iteración 7** (20/8/2026) → el sistema de temas se vuelve de verdad extensible: tres capas, contrato de 39 roles y un test que lo hace cumplir. Con eso entra la **A** como tercer tema y aparece el selector en Ajustes.
- **Iteración 8** (2/9/2026) → rediseño con dos direcciones nuevas, **E "Mercado"** y **F "Pizarra"** (el primer tema oscuro), y la decisión de Facu de quedarse solo con esas dos. El color deja de vivir únicamente en la tipografía y pasa a la superficie: encabezados plenos, banda de categoría en la tarjeta. Épica #127.

Que tres temas se borren sin tocar un solo componente es la prueba de que la iteración 7 hizo lo que decía: el contrato es la única interfaz, y el archivo del tema es todo lo que un tema es.

### Reglas comunes a cualquier propuesta (anti-look-IA, pedido explícito de Facu)

1. **Prohibido el reborde lateral de acento en tarjetas** — es el "tell" clásico de UI generada. El tipo de receta lo comunica el ícono.
2. **Comprometerse con un mundo de color propio**, no repartir colores "de buen gusto" en partes iguales.
3. **Firmas de dominio propias**: semáforo-hoja, bandas de incertidumbre, brotes de IC — elementos que ningún template trae.
4. **Tipografía con opinión**: nada de Inter/Roboto/Space Grotesk como default.
5. **Cero emoji como íconos, cero gradientes decorativos**; jerarquía derivada del uso real.
6. El semáforo **nunca comunica solo con color**: siempre ícono + texto.
7. Tipografías self-hosted (offline). Modo cocina: contraste reforzado y cuerpo tipográfico +2 escalas.

### Propuesta A — "Botánica editorial" (tema vivo del 20/8/2026 al 3/9/2026; registrada)

Cálida y seria; los datos respiran porque el fondo es calmo. Fraunces (serif display) + Schibsted Grotesk (datos).

Volvió como tema alternativo a pedido de Facu, con el mismo fondo ilustrado y la misma estructura de pantallas que los otros dos.

**Tipografía propia: Vollkorn** para el display, en vez de la Fraunces que usan la C y la D. La Fraunces tiene mucho contraste y serifas en cuña: se lee display y un poco severa. La Vollkorn baja el contraste y redondea los terminales sin salirse del registro editorial — que es donde la A quería estar desde "cálida y seria". Se compararon tres candidatas variables y self-hosted (Vollkorn, Petrona, Alegreya) renderizando el Tema A con cada una; Petrona quedó más neutra y Alegreya más caligráfica, casi de etiqueta de vino. El dato de la app (`--font-data`) sigue siendo Schibsted Grotesk en los tres temas. Implementada en `src/styles/temas/tema-a.css`.

| Token | Valor | Uso |
|---|---|---|
| `--papel` | `#F6F1E5` | fondo (crema papel) |
| `--tinta` | `#2C2A22` | texto principal |
| `--oliva` | `#6B7A45` | acento primario |
| `--salvia` | `#9BAA88` | bordes suaves, tags |
| `--terracota` | `#BE5B35` | acción |
| `--verde-profundo` | `#37502F` | headers |
| Semáforo | `#4C7C4A` / `#C98F2E` / `#B0492F` | cubierto / parcial / insuficiente |
| Suplemento / sin datos | `#5B7A9E` / `#8F8A7E` | estados especiales |

Estructura: tarjetas crema con borde fino, sombra apenas presente, radios generosos. Ilustración botánica de línea fina como ornamento.

**Lo que hubo que agregar para cubrir los 39 roles** (la paleta A trae 10 colores). Contrastes medidos sobre el papel `#F6F1E5`, fórmula WCAG con sRGB linearizado:

| Agregado | Valor | Por qué | Contraste |
|---|---|---|---|
| `--p-crema-claro` | `#FCFAF2` | A describe "tarjetas crema" en prosa, sin dar el hex de la superficie | — |
| `--p-tinta-suave` | `#5C5A4E` | A no trae texto secundario | 6.15 |
| `--p-oliva-honda` | `#57663A` | la oliva base da 4.15: no llega a 4.5:1 como texto | 5.53 |
| `--p-terracota-honda` | `#A24824` | la terracota base da 3.93; queda como relleno de acción | 5.34 |
| `--p-piedra-honda` | `#7C776B` | la piedra base da 3.05; la vara es la chía actual (3.85) | 3.96 |
| `--p-ciruela` | `#7D3F55` | **la única invención cromática** — ver abajo | 6.86 |

**Por qué la ciruela.** La paleta A no tiene ninguna familia berry, que es el lugar del que la D saca la berenjena para las cifras y la remolacha para los avisos. Sin ella, cifras, avisos, acción y título de las recetas principales caían todos en la banda cálida: **cuatro significados distintos a ΔE menor que 6**. Es exactamente la colisión de roles que causó el rediseño de la D. Una invención bien puesta resolvió lo que cinco derivaciones forzadas no.

**Escala de categorías**, derivada porque la paleta A es anterior a la idea de categoría-por-color:

| Token | Valor | Materia | Contraste | ΔE vs. encabezado |
|---|---|---|---|---|
| `--cat-principal` | `#2B5A16` | laurel | 7.23 | 20.8 |
| `--cat-dulce` | `#543113` | tierra tostada | 10.21 | 27.9 |
| `--cat-preparado` | `#3F4D62` | pizarra honda | 7.61 | 25.1 |
| `--cat-pan` | `#876725` | trigo | 4.66 | 36.0 |
| `--cat-conserva` | `#1B7969` | verde petróleo | 4.67 | 25.0 |

Elegidas con una búsqueda sobre grilla HSL, contra **la vara real que cumple el tema D medida sobre sus propios valores**: ΔE mínimo 26.3 entre categorías, 13.1 contra los roles funcionales vecinos y 4.61:1 de contraste. El caso difícil fue conserva: en la A los encabezados son verde profundo, así que un verde de categoría se pisaba con ellos (los primeros intentos daban ΔE 15-21); se resolvió corriendo el petróleo hacia el turquesa.

**`--cat-principal` pasó de ladrillo a laurel** a pedido de Facu ("más oscuro, incluso otro tono"). El ladrillo era el contraste más flojo de las cinco (4.64); el laurel da 7.23 y sube la separación mínima entre categorías de 27.4 a 33.7. Lo que se paga es la distancia a los roles: baja de 20.1 a 17.5 (el vecino más cercano pasa de ser otra categoría a ser el musgo del semáforo), y la A queda con verde en su identidad *y* en una categoría. Sigue sobrada del piso 13, y en el glosario las cinco categorías se leen distintas.

**Ojo con la fórmula**: todos estos ΔE son **CIE76**. Con CIEDE2000 los números son bastante más chicos y ninguna de las cinco categorías llegaría a 26 — ni las de la A ni las de la D. La vara del proyecto está calibrada sobre CIE76 porque así se midió la escala original; medir un color nuevo con CIEDE2000 y compararlo contra el 26 sería compararlo contra otra cosa.

**Sobre el semáforo**: los cuatro colores de estado de la A dan 4.34 / 2.50 / 4.85 / 3.95, por debajo de AA — igual que los de la D hoy (3.43 / 2.29 / 4.12 / 5.70) y por el mismo motivo: **el semáforo nunca comunica solo con color**, siempre ícono + palabra (invariante 6). Son tinte de píldora y color de ícono, no texto.

### Propuesta D — "El color dice de qué se trata" (tema default del 19/8/2026 al 3/9/2026; registrada)

Sobre la base de la C (mismo papel, mismas tipografías, mismo fondo), reordena **quién dice qué**. Nace de un diagnóstico de Facu sobre los renders reales de Fase 1: la interfaz se veía dominada por berenjena y espinaca. La causa era estructural, no de gusto — dos reglas globales pintaban todos los encabezados de violeta (`base.css` `h1,h2,h3`) y todos los links de verde (`base.css` `a`) — más tres colisiones de rol (`--garbanzo` servía a la vez para el tipo `pan`, la estrella de clásica y los tips de precaución).

**Escala de categorías** (`--cat-*`, desacoplada de los roles funcionales para que el tipo de receta no pise colores con otro significado). Se aplica al título de la receta y a su ícono de tipo:

| Token | Verdura | Valor | Recetas |
|---|---|---|---|
| `--cat-principal` | Tomate | `#9A3A2C` | 46 (saladas + combo) |
| `--cat-dulce` | Cacao amargo | `#5E4126` | 25 |
| `--cat-preparado` | Chía | `#5A5F72` | 11 |
| `--cat-pan` | Trigo tostado | `#8A6520` | 3 |
| `--cat-conserva` | Kombu | `#1F6B5E` | 0 — declarada para las recetas propias |

Elegidas **midiendo**: ningún par baja de ΔE 26 entre sí, y todas cumplen AA sobre el papel. La primera versión de la escala se descartó porque la lenteja propuesta para los principales quedaba a ΔE 13 del encabezado que va debajo. Por eso el principal es tomate (la lenteja se pisaba con la zanahoria), el cacao es amargo (un chocolate claro se pisaba con el tomate) y el combo comparte color con las saladas (una sola receta; un sexto color empeoraba el conjunto).

**Reasignación de roles:**

| Token | Rol en C | Rol en D |
|---|---|---|
| `--zanahoria` | cifras, nav activa | protagonista: **encabezados de sección**, números de paso, nav activa. Con `--zanahoria-honda` `#B85718` cuando es texto (el tono base no llega a contraste) |
| `--espinaca` | todo link, funciones, tipos, tips | protagonista: marca, kicker, filtros y pestañas activas, potenciadores y consejos del chef |
| `--berenjena` | todos los encabezados | **cifras de nutrientes** y navegación (volver, atrás, cancelar) |
| `--remolacha` | dulces e indulgente | **avisos clave**: alerta B12, precauciones, inhibidores, correcciones |
| `--tinta-suave` | texto secundario | suma la función del ingrediente (era el mayor foco de verde del detalle) |

Los 7 tipos de regla (`RuleTips`) ya emitían clase propia pero solo 2 tenían color: la D cubre los siete. Ícono nuevo `IconFrascoFermento` para la categoría conserva.

**Estado**: Facu la eligió para seguir el desarrollo, y **los temas quedan como sistema permanente**. Implementación en `src/styles/temas/tema-d.css`, que declara su propia paleta cruda (`--p-*`) y el contrato de roles completo. Renders de cada tema en `docs/renders/fase-N-tema-{a,c,d}/`; comparativa C vs D publicada en [este Artifact](https://claude.ai/code/artifact/08290d5b-0d10-4098-b225-dc422ba0696d).

### Propuesta C — "Carta de estación" (tema vivo de la Fase 1 al 3/9/2026; registrada)

Sofisticada como la carta de un restaurante de estación. Base de A (papel ocre, Fraunces + Schibsted Grotesk, bordes finos — **confirmados por Facu**) + sistema de colores-verdura. Regla que ordena el color: **cada verdura tiene un rol, y cada rol tiene su verdura** — en una pantalla cualquiera dominan ocre y tinta, y el color aparece solo donde significa algo.

Tokens vigentes (iteración 4: saturación +1 pedida por Facu, papel calibrado al crema de su imagen de fondo):

| Token | Valor | Verdura / rol |
|---|---|---|
| `--papel` | `#F5EFDC` | fondo ocre (calibrado a la imagen de fondo) |
| `--tofu` | `#FDFAF0` | superficie de tarjetas |
| `--tinta` | `#2C2A22` | texto |
| `--espinaca` | `#427A3A` | identidad, marca, etiquetas de sección |
| `--zanahoria` | `#D06A24` | **acción** (botones, énfasis, nav activa) |
| `--berenjena` | `#5C3A63` | **títulos display** (voz de recetas y pantallas) |
| `--remolacha` | `#A82D52` | **lo dulce e indulgente** (flor de dulces, cuchara) |
| `--zapallito` | `#47903F` | semáforo: cubierto |
| `--garbanzo` | `#D1942C` | semáforo: parcial |
| `--rabanito` | `#CF3D4D` | semáforo: insuficiente (solo alerta; lo dulce pasó a remolacha) |
| `--repollo-colorado` | `#85477F` | cubierto por suplemento (reemplaza el azul genérico) |
| `--chia` | `#75787D` | sin datos |
| `--lechuga` | `#A5C179` | tags y bordes suaves |
| `--soja` | `#AB7442` | preparados |

**Fondo**: ilustración de verduras provista por Facu (línea sobre crema, generada con Gemini). Asset maestro intacto en `docs/assets/fondo-verduras.png` (1536×2752); la versión de uso es `docs/assets/fondo-verduras-suave.png` — **trazos fundidos 62 % hacia el crema del fondo** (pedido de Facu: que apenas se distingan), aplicada directa con `background-size: cover`, sin velo. La app deberá servir versiones optimizadas (WebP/AVIF comprimidas) desde el build.

Elementos distintivos: puntos de guía tipo carta de restaurante entre ingrediente y cantidad; filetes dobles de menú impreso; cifras clave en itálica serif zanahoria; íconos de tipo de receta coloreados por verdura; píldoras del semáforo teñidas con su propio color (`color-mix`). Sin contornos gruesos, sin sombras duras (rechazados de B).

### Propuesta B — "Tinta fresca" (registrada, dirección descartada por Facu)

Colores de verdulería real a plena saturación sobre blanco verdoso; estructura de imprenta. Bricolage Grotesque (display) + Archivo (datos; fundición porteña Omnibus-Type).

| Token | Valor | Uso |
|---|---|---|
| `--fondo` | `#F3F7EA` | fondo (blanco verdoso) |
| `--tinta` | `#16231B` | texto y contornos (verde-negra) |
| `--clorofila` | `#2C9C43` | acento primario |
| `--verde-profundo` | `#17572A` | navegación activa, timers |
| `--remolacha` | `#C21E56` | acción |
| `--limon` | `#F6E74A` | resaltador de números clave, tags activos |
| Semáforo | `#23913B` / `#E9A00F` / `#D64524` | cubierto / parcial / insuficiente |
| Suplemento / sin datos | `#3B6FD1` / `#7E8878` | estados especiales |

Estructura: tarjetas blancas con **contorno de tinta 1.5 px + sombra dura desplazada** (etiqueta impresa), esquinas contenidas (8–10 px), chips como sellos en mayúsculas, **resaltador limón** sobre los números que importan (kcal, punto clave del paso). Íconos con trazo 2 px (vs 1.7 en A).

## 4. Iconografía propia

Set SVG custom, trazo uniforme (~1.75 px en 24 px de caja), estilo línea botánica coherente con la estética. **Regla: ver el ícono debe alcanzar para entender el concepto.** Cada ícono se valida en el Render 0 y el set completo entra en Fase 1 junto con su glosario en la app.

### Glosario de íconos (spec inicial, ~26)

| Grupo | Ícono (concepto visual) | Significado |
|---|---|---|
| Semáforo | Hoja entera | Nutriente cubierto en su ventana (≥90 %) |
| Semáforo | Hoja a medio llenar | Parcial (60-90 %) |
| Semáforo | Hoja caída/marchita | Insuficiente (<60 %) |
| Semáforo | Cápsula | Cubierto por suplemento declarado |
| Semáforo | Hoja punteada | Sin datos suficientes en la ventana |
| Ventana | Sol | Se evalúa por día |
| Ventana | Siete puntos en arco | Se evalúa por semana (móvil, 7 días) |
| Datos | Símbolo ≈ sobre línea | Valor con banda de incertidumbre (rango) |
| Datos | Brotes 1-2-3 | Índice de confianza del dato (bajo/medio/alto) |
| Datos | Círculo semirrelleno | Cobertura parcial del cálculo |
| Receta | Mortero | Salada |
| Receta | Flor | Dulce |
| Receta | Espiga | Pan / masa |
| Receta | Frasco | Preparado (componente reutilizable) |
| Receta | Rama que bifurca | Variante de otra receta |
| Receta | Bandeja | Combo |
| Práctico | Reloj | Tiempo total (prep + cocción) |
| Práctico | Llama ascendente ×1/2/3 | Dificultad |
| Práctico | Plato con ×N | Porciones / escalado |
| Práctico | Asterisco botánico | Ingrediente imprescindible |
| Práctico | Flechas circulares | Sustituible / sustitución activa |
| Práctico | Copo de nieve | Va bien al freezer |
| Práctico | Heladera (puerta) | Guarda en heladera (días) |
| Práctico | Sol naciente sobre surco | En temporada (AMBA) |
| Alerta | Escudo con "B12" | Advertencia B12 (levadura no fortificada) |
| Extra | Estrella brotada | Candidata a clásica / probada y aprobada |

(`indulgente` se evalúa en Render 0: posible ícono de cuchara colmada.)

## 5. Flujos principales (resumen)

- **Cocinar**: Recetario → Detalle (elegir porciones) → Cocinar ahora → personalizar → pasos → registrar. Máximo 2 taps entre detalle y primer paso.
- **Comprar**: Planificador (o multi-selección en Recetario) → Lista de compras → modo verdulería → tildar.
- **Planificar**: Planificador → arrastrar/asignar recetas → mirar semáforo proyectado → generar compras.
- **Backup**: Ajustes → Exportar → compartir archivo (AirDrop/Drive). Banner si pasaron >30 días con cambios (o si nunca se hizo uno). Se puede posponer: la X lo calla 7 días, o hasta que se acumulen 20 cambios nuevos. Un backup real lo resetea.

## 6. Renders por fase

- **Render 0** (Fase 0): mockups estáticos HTML de 5 vistas (home/recetario mobile, detalle mobile, cocción mobile, planificador desktop y mobile) con estética e íconos. Throwaway: no es código de la app.
- **Fases 1-4**: screenshots reales de la app corriendo (Playwright, 390 px y 1280 px) generados por `npm run renders` / skill `/renders`, publicados como Artifact para revisión conjunta al cierre de cada fase.
