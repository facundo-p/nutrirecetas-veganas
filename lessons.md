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
