# lessons.md — Bitácora de lecciones

Al cierre de cada fase se anota: qué funcionó, qué se rompió, qué decisión cambió y por qué. Cualquier sesión futura de Claude arranca leyendo esto.

---

## Fase 0 — Plan y dirección visual (2026-08-18)

- **La documentación del dataset tiene puntos ciegos reales**: la auditoría con scripts encontró que las condiciones de las reglas R1–R15 SÍ son objetos estructurados (el README las declara "prosa no ejecutable"), que los perfiles nutricionales precargados no tienen kcal y desvían >30 % en el 45 % de los chequeos, y que `ajuste_vegano` es un objeto y no un número. Lección: **nunca confiar en la doc del dataset sin verificar contra el JSON real** — vale para toda fase futura.
- `p08` (bifecitos de seitán) es un preparado de facto (p12 y p20 lo consumen) aunque no está tipado como tal: la migración de preparados debe incluirlo.
- Decisiones de producto tomadas con Facu: migrar modelo de preparados en ingesta · escalado lineal con avisos · estética "botánica editorial" · prioridad a planificador semanal + estacionalidad · gramos como medida principal de compras (compra por peso, tiene balanza, no compra enlatados) · mobile-first absoluto (no hay sync entre dispositivos sin backend; export/import como transferencia manual).
- La app debe quedar compartible con amigos: nada hardcodeado a Facu, perfil vacío al primer uso.

### Iteración 2 del Render 0 (feedback de Facu sobre estética)

- **El reborde lateral izquierdo en tarjetas es un "tell" de UI hecha con IA** — Facu lo detectó al instante y pidió eliminarlo. Regla permanente del proyecto: prohibido en toda tarjeta, en cualquier propuesta.
- **La paleta crema/oliva desaturada es un default de Claude Code**: su app de huerta terminó con casi la misma paleta. Lección: cuando el usuario pide "personalidad", el punto de partida no puede ser el cream+serif+terracota de siempre.
- Resolución: la propuesta original quedó **registrada como Propuesta A (Botánica editorial)** — Facu la valora como viable — y se generó la **Propuesta B (Tinta fresca)**: saturación real (clorofila #2C9C43, remolacha #C21E56, limón #F6E74A), contornos de tinta con sombra dura, Bricolage Grotesque + Archivo. Ambas viven en el Render 0 y en `docs/plan/04`; la decisión (A, B o híbrida C) cierra la Fase 0.
- Confirmado por Facu y no volver a tocar: densidad de tarjetas del recetario y tamaño tipográfico de la pantalla de cocción.

### Iteración 3 del Render 0 (Propuesta C "Carta de estación")

- El norte estético que Facu articuló y que rige todo lo visual: **"la app tan hermosa como un plato vegano colorido y saludable, sin sobresaturar"**, con carácter **sofisticado/elegante/gourmet** (no rústico, no print-brutalista).
- De B rechazó: contornos negros gruesos y las tipografías nuevas. De B sobrevivió: los colores salen de las verduras. Confirmó: tipografías de A (Fraunces + Schibsted) y fondo ocre desaturado.
- Solución de la C para color sin saturación visual: **cada verdura tiene un rol semántico** (zanahoria=acción, rabanito=alerta, repollo colorado=suplemento, garbanzo=parcial, chía=sin datos, espinaca=identidad, soja=preparados, lechuga=tags). El color aparece solo donde significa algo; domina el ocre+tinta.
- Pidió fondo con dibujos de verduras (solo siluetas, muy desaturado) → patrón SVG de línea apenas más oscuro que el papel.
- Detalles gourmet agregados: puntos de guía tipo carta en ingredientes, filetes dobles de menú, cifras clave en itálica serif.

### Iteración 4 del Render 0 (fondo real + saturación +1)

- Facu aprobó el rediseño C y la tipografía, y aportó **su propia ilustración de fondo** (verduras en línea sobre crema, generada con Gemini). Asset maestro: `docs/assets/fondo-verduras.png`; en pantallas va con velo de papel al 38 %. Lección: cuando Facu pide algo visual concreto, puede aparecer con el asset ya generado — buscarlo en ~/Downloads por dimensiones antes de recrear nada a mano.
- Pidió "un poquito más" de saturación y variedad: todos los colores-verdura subieron un punto (espinaca #427A3A, zanahoria #D06A24, rabanito #CF3D4D, etc.) y el color se extendió con rol a etiquetas de sección, píldoras del semáforo teñidas y numerales del calendario. El norte sigue siendo "vibrante sin sobresaturar".

### Iteración 5 del Render 0 (fondo suavizado + berenjena y remolacha)

- A Facu le gustó la iteración 4 ("Me gusta!"). Pidió: (1) que los trazos del fondo apenas se distingan del crema → se horneó el fundido 62 % en la imagen misma (`docs/assets/fondo-verduras-suave.png`, procesada con Pillow; el original queda como master) y se eliminó el velo CSS; (2) sumar **berenjena** y **remolacha** a la paleta base.
- Roles asignados (mantener el sistema "cada color un rol"): berenjena #5C3A63 = títulos display; remolacha #A82D52 = lo dulce e indulgente. Efecto colateral bueno: el rabanito queda solo como alerta — ya no se confunde postre con problema.

---

## Fase 1 — Dataset + cimientos + recetario (2026-08-19, pendiente de OK de Facu)

- **El validador de la semilla pagó el primer día**: forma desconocida = build roto encontró de una que `grupo` de nutrientes es `critico|importante` (el README decía A/B), que `notas` de nutrientes es una lista estructurada, que `guarda.freezer` a veces es texto ("solo el pesto"), que los envases traen rangos `[min,max]` y que hay un kcal `null` explícito. Lección reforzada de Fase 0: la doc del dataset siempre pierde contra el JSON real.
- **La migración de preparados fue más profunda que las 5 líneas fantasma detectadas**: la unidad original (`g_como_queso_P04`) delató los mapeos directos, pero p22 (tarta) directamente **no lista su masa** — hubo que agregar una línea entera (p07, 370 g). Y p31/p39 usan `margarina` donde Facu usa su manteca vegana p03: decisión flageada en el gate.
- **La cobertura honesta puede verse "alarmista"**: en sopas, el agua/caldo no lista minerales, así que el hierro de r01 reporta cobertura ~17 % aunque el cálculo es bueno (el agua aporta ~0). Quedó como pregunta del gate: ¿"sin dato" o "cero real" para el agua?
- **La unidad del catálogo de nutrientes NO sirve para cantidades**: proteína es "g/kg" (unidad de RDA). Un render lo mostró como "8 g/kg por porción" — la unidad de cantidades ahora se deriva de la clave del ingrediente (`prot_g` → g).
- Los renders con Playwright + revisión visual propia antes de publicar funcionan como control de calidad real: el bug de unidades y la nav flotando en el screenshot salieron de mirar los PNG, no de los tests.
- Dexie y Zustand quedaron fuera a propósito (YAGNI hasta Fase 2): la Fase 1 no tiene datos de usuario. Deps de runtime: react, react-dom, zod.
- `garbanzos` no tiene el sinónimo "chickpeas" que promete el README (86/158 ingredientes sí traen sinónimos): los tests que asumen ejemplos de la doc deben verificarse contra la semilla real.

### Iteración 6 del sistema de color — Propuesta D (2026-08-19)

- **El exceso de un color casi nunca es una decisión estética: es una regla global.** Facu vio "mucho berenjena y espinaca" en los renders de Fase 1; la causa eran dos reglas de `base.css` (`h1,h2,h3` → berenjena, `a` → espinaca) que repartían color sin criterio. Antes de repintar, buscar la regla que reparte.
- **Montar la escala de tipos sobre tokens con otro rol genera colisiones.** En la C, `--garbanzo` pintaba el tipo `pan`, la estrella de clásica y los tips de precaución. La D introduce `--cat-*`, una escala propia: **la escala de categorías se mantiene desacoplada de la escala de roles**.
- **Elegir colores de categoría se hace midiendo ΔE, no mirando.** La primera escala (lenteja para principales, como pidió Facu) quedaba a ΔE 13 del encabezado de abajo: indistinguible. Regla para el futuro: contra los colores funcionales vecinos y entre sí, ΔE ≥ 26; y verificar contraste WCAG antes de escribir el CSS, no después.
- **Refactor neutro primero, cambio visual después.** Mover los 15 colores inline de los TSX a clases CSS (paso sin ningún cambio visual, verificado comparando PNG pixel a pixel) hizo que el tema entero fuera 100 % CSS. La única diferencia esperada fue el ícono de la Picada vegana, por la fusión combo→principal.
- Los temas conviven con `?tema=d` y `tema-d.css`. **Ambos son temporales**: al decidir, la ganadora se muda a `tokens.css` y el switch se borra. Si esto sigue acá en Fase 3, es deuda.
- El dataset no tiene ninguna conserva ni fermento (busqué kimchi, escabeche, pickle, chucrut, encurtido en las 84 recetas). La categoría quedó declarada igual, con color e ícono, para las recetas propias de Fase 4.

### Los temas quedan como sistema permanente (2026-08-19)

- Facu eligió la **D para seguir el desarrollo** y pidió conservar la C como tema intercambiable. Los temas dejaron de ser un andamio temporal: pasaron a ser parte de la arquitectura visual.
- El refactor que lo hizo sano: **tokens de rol** (`--titulo-seccion`, `--cifra`, `--aviso`, `--navegar`…) declarados por tema en `temas.css`, en vez de overrides por selector bajo `[data-tema=d]`. Ninguna regla de la app nombra una verdura; agregar un tema (un dark mode, por ejemplo) es agregar un bloque.
- **Bug aprendido, vale para cualquier sistema de temas**: una custom property cuyo valor contiene `var()` se resuelve **en el elemento donde se declara**, no donde se usa. `--titulo-receta: var(--cat-actual)` declarado en `:root` caía siempre al fallback porque `--cat-actual` recién existe sobre `[data-cat]`. Se declara sobre `[data-cat]` y listo. Lo detecté comparando renders pixel a pixel antes y después del refactor: sin esa comparación pasaba desapercibido.
- El default sin atributo es la D; la C se marca con `data-tema="c"`. Un script inline en `index.html` lo aplica antes de pintar para que elegir la C no produzca un salto de color.
- Renders por tema en `docs/renders/fase-N-tema-{c,d}/`; `npm run renders` usa el tema activo y `--tema=c` el otro.
