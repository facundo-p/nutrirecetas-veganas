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
- Resolución: la propuesta original quedó **registrada como Propuesta A (Botánica editorial)** — Facu la valora como viable — y se generó la **Propuesta B (Tinta fresca)**: saturación real (clorofila #2C9C43, remolacha #C21E56, limón #F6E74A), contornos de tinta con sombra dura, Bricolage Grotesque + Archivo. Ambas viven en el Render 0 y en `docs/estetica-e-interaccion.md`; la decisión (A, B o híbrida C) cierra la Fase 0.
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

## Fase 1 — Dataset + cimientos + recetario (2026-08-19, ✅ cerrada)

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
- ~~Los temas conviven con `?tema=d` y `tema-d.css`. **Ambos son temporales**~~ — quedó desactualizado el mismo día: Facu pidió conservar los dos temas y el sistema pasó a ser permanente (ver la entrada siguiente). `tema-d.css` ya no existe; su contenido vive en `src/styles/temas/`.
- El dataset no tiene ninguna conserva ni fermento (busqué kimchi, escabeche, pickle, chucrut, encurtido en las 84 recetas). La categoría quedó declarada igual, con color e ícono, para las recetas propias de Fase 4.

### Los temas quedan como sistema permanente (2026-08-19)

- Facu eligió la **D para seguir el desarrollo** y pidió conservar la C como tema intercambiable. Los temas dejaron de ser un andamio temporal: pasaron a ser parte de la arquitectura visual.
- El refactor que lo hizo sano: **tokens de rol** (`--titulo-seccion`, `--cifra`, `--aviso`, `--navegar`…) declarados por tema en `temas.css`, en vez de overrides por selector bajo `[data-tema=d]`. Ninguna regla de la app nombra una verdura; agregar un tema (un dark mode, por ejemplo) es agregar un bloque.
- **Bug aprendido, vale para cualquier sistema de temas**: una custom property cuyo valor contiene `var()` se resuelve **en el elemento donde se declara**, no donde se usa. `--titulo-receta: var(--cat-actual)` declarado en `:root` caía siempre al fallback porque `--cat-actual` recién existe sobre `[data-cat]`. Se declara sobre `[data-cat]` y listo. Lo detecté comparando renders pixel a pixel antes y después del refactor: sin esa comparación pasaba desapercibido.
- El default sin atributo es la D; la C se marca con `data-tema="c"`. Un script inline en `index.html` lo aplica antes de pintar para que elegir la C no produzca un salto de color.
- Renders por tema en `docs/renders/fase-N-tema-{c,d}/`; `npm run renders` usa el tema activo y `--tema=c` el otro.

### Gate de datos aplicado (2026-08-19)

- Facu revisó el gate fila por fila y **corrigió 5 de las 15 porciones propuestas** (p17, p21, p28, p36, p38) y un rendimiento (p16: 550 → 650 g). Confirmación de la lección de Fase 0 llevada a los datos del recetario: las estimaciones razonables de una IA sobre "cuántas porciones rinde" no reemplazan a quien cocina la receta. Todo lo que Facu confirmó dejó de estar marcado como estimación en `curated-tables.ts`.
- **Cero real vs. sin dato son cosas distintas y el dataset no las distingue.** Facu resolvió el caso de la cobertura baja en sopas: el agua aporta cero de verdad (`aporte_nulo` en la semilla, cuenta como cobertura), el caldo no (depende de con qué se hizo → sigue "sin datos"). La proteína del pastel de papas pasó de 84 % a 92 % de cobertura por el agua del queso de maní.
- **Efecto colateral que valió más que el cambio**: al contar el agua, aparecieron nutrientes con valor 0 y cobertura 7 % que la UI mostraba como "0 mg" — una afirmación falsa ("no tiene") donde correspondía "no sabemos". Se agregó `hasReportableValue()` al dominio: un cero solo se afirma con cobertura ≥90 %; un valor > 0 siempre se informa con su cobertura al lado. Era la regla que el plan pedía ("cobertura baja ⇒ sin_datos") y que la primera implementación se había salteado.
- Cuando una decisión de datos cambia la nutrición (margarina → manteca vegana p03), Facu pidió **no perder la alternativa**: la línea migrada lleva la margarina como sustituto al mismo peso. Los preparados no reemplazan al ingrediente comprado, lo prefieren.

---

## Fase 2 — Perfil, cocinar y registrar (2026-08-19, ✅ cerrada — renders aprobados el 2026-08-21)

- **Las dos decisiones de producto que definieron el modelo de datos las tomó Facu antes de escribir código**: (1) el semáforo cuenta *porciones comidas*, no cocciones — al registrar se declara cuánto se comió y el resto queda como sobras que se registran después; (2) en esta fase el semáforo solo ve cocciones de la app, con aviso explícito de que es parcial. Preguntar primero evitó una migración: la tabla `consumos` no existía en el plan original.
- **El dataset declara dos factores veganos en prosa** (proteína "~1.0 g/kg", omega-3 "duplicar ALA") que su propio ejemplo de objetivos confirma numéricamente (75 g y 3,2 g para 75 kg). Formalizarlos en una tabla curada (T8) no contradice la regla de "no inventar factores": lo inventado sería ignorar el dato porque venía en una oración en vez de en un campo.
- **Un test de UI destapó un bug que hubiera roto el primer arranque de la app**: `useMeta` llamaba a `getMeta()`, que *escribe* el registro inicial si no existe, dentro de un `liveQuery` de Dexie — que es de solo lectura. Regla que queda: los hooks de lectura no crean registros; la inicialización va en las escrituras.
- **Los tests de Testing Library necesitaban un setup con `cleanup`**: sin él cada `render` apila un DOM nuevo y las consultas encuentran duplicados de tests anteriores. Sale como "Found multiple elements" y parece un bug de la app.
- **Sembrar datos de demo para los renders tiene dos trampas**: escribir por IndexedDB crudo no dispara los observables de Dexie, y navegar entre hashes no recarga la página. Sin un `reload` explícito, los renders salían con la app vacía — y la primera tanda se generó así. El script ahora falla si el sembrado no llegó, en vez de producir capturas engañosas.
- El motor nutricional de Fase 1 se reusó entero para la sesión de cocina: `nutricionSesion` arma una receta sintética con las líneas activas y llama a `computeNutrition`. Mantener el dominio puro en Fase 1 pagó acá.

---

## Sistema de temas de tres capas + Tema A (2026-08-20)

- **Una regla que solo vive en un comentario se degrada sola.** `CLAUDE.md` y `temas.css` decían "ninguna regla de la app nombra una verdura" desde el día que se escribieron los temas. Al ir a agregar el tercero aparecieron **141 usos de color crudo** en la capa de la app, acumulados entre Fase 1 y Fase 2 sin que nadie lo notara. La lección no es "hay que tener más cuidado": es que **una invariante de arquitectura sin test es una intención, no una invariante**. El test de contrato (`src/styles/contrato-de-temas.test.ts`) es el entregable más importante de esta tanda, más que el tema nuevo.
- **El contrato se deduce, no se lista.** El test no tiene una lista de tokens que haya que mantener: el contrato es *lo que la app pide sin fallback y ningún archivo fuera de `temas/` provee*. Por eso `--titulo-receta-fijo` queda opcional solo, sin excepciones escritas: se pide como `var(--x, fallback)`. Una lista a mano habría sido la próxima cosa en desincronizarse.
- **La frontera tiene que ser visible para una regex.** La paleta cruda de cada tema lleva prefijo `--p-`: eso convierte "no toques la materia prima de otro tema" en `grep var\(--p- fuera de temas/`. El nombre semántico (`--p-espinaca`, `--p-oliva`) se conserva porque es lo único que hace legible un archivo de tema; el prefijo hace el trabajo de frontera, no el nombre.
- **Un tema no se puede agregar si los colores crudos son compartidos.** El obstáculo real para el tema A no fue el color: era que `--papel`, `--tinta` y las verduras vivían en la capa declarada "igual en todos los temas". La paleta A trae oliva, salvia y terracota — colores propios. Regla: **la capa compartida solo puede tener forma** (tipografía, escala, espaciado). Si tiene color, hay un solo tema posible disfrazado de sistema.
- **La vara se mide sobre lo que ya existe, no se inventa.** Un análisis paralelo concluyó que derivar 5 categorías para el tema A "no era viable" contra ΔE ≥ 22 respecto de los colores funcionales. Pero al medir el tema D real, su propio mínimo es **ΔE 13.1** (preparado vs. chía) y 26.3 entre categorías. Con la vara real la escala de A salió mejor que la D en las tres métricas (27.4 / 20.0 / 4.64:1). **Antes de declarar algo imposible, medir qué cumple lo que ya está en producción.**
- **La banda cálida de una paleta se satura rápido.** El primer intento de tema A puso título de receta principal, acción, aviso y cifra todos en la familia terracota: cuatro significados a ΔE menor que 6. Es la misma colisión que causó el rediseño de la D. Se resolvió inventando **un** color (ciruela) para el hueco berry que la paleta A no tiene — el mismo lugar del que la D saca la berenjena. Una invención bien elegida vale más que cinco derivaciones forzadas.
- **El diff de renders pixel a pixel es lo que permite refactorizar sin miedo.** Los tres commits de refactor (mover 141 tokens, partir seis archivos CSS en quince, sacar el último estilo inline) cerraron con los 48 renders de C y D **idénticos byte por byte** a un baseline tomado antes de empezar. Ningún test unitario podía dar esa garantía. Ojo: hay que generar el baseline en el momento, porque los renders sembrados usan fechas relativas y los textos "hace N días" cambian de un día para el otro.
- **El anti-FOUC era el punto de fricción escondido.** El script inline de `index.html` hardcodeaba `if (t === 'c')`. Corre antes del bundle, así que no puede importar `tema.ts` y la lista se repite sí o sí. La solución no fue eliminar la duplicación sino **hacerla verificable**: el test compara los temas de `tema.ts`, los archivos de `temas/` y el array del script. Cuando no se puede tener una sola fuente de verdad, que la divergencia falle en CI.
- **El default deja de ser un caso especial.** Antes, la D era "ausencia de atributo". Ahora los tres temas son `:root[data-tema='X']` con la misma especificidad, mutuamente excluyentes, así que el orden de los `@import` entre temas es irrelevante — eso es lo que hace barato agregar el tema N+1. El archivo del default suma `:root` como red de seguridad: con un `data-tema` inválido la app renderiza un tema completo en vez de quedarse sin colores.

---

## Issues, PRs, tablero y versionado (2026-08-20)

La planificación se muda de `docs/plan/` a Issues con sub-issues, el trabajo entra por PR con CI, y los releases se arman con `/release`. Lecciones, casi todas de cosas que la API de GitHub no hace y el diseño daba por sentadas:

- **`Closes #N` solo cierra contra la rama por defecto.** Todo el trabajo entra por `staging`, así que la promesa de "el squash merge cierra el issue solo" era falsa y el workflow *Item closed → Hecho* del tablero nunca se iba a disparar. Lo resuelve `.github/workflows/cerrar-issues.yml`. Lección general: **verificar las promesas de automatización de la plataforma antes de construir encima**, sobre todo cuando el proyecto no usa la rama por defecto para trabajar.
- **Los workflows nativos de Projects solo escriben en el campo de estado del proyecto**, nunca en un campo single-select propio. El diseño daba a los PRs sus columnas dedicadas (Borrador · CI corriendo · Listo para mergear · Mergeado); el campo llegó a existir, acumuló **0 items seteados** y se borró. Regla: **un campo que ninguna automatización puede tocar se desactualiza solo, y un tablero que miente es peor que uno impreciso.**
- **La API de Projects deja crear vistas y filtros pero no la agrupación** (`ProjectV2ViewConfigurationInput` solo acepta `visibleFieldIds`), y **acepta cambiarle las opciones al campo `Status` pero descarta el cambio de nombre**. Las dos cosas se descubren probando, no leyendo la doc.
- **El CI encontró un bug latente en su primera hora.** Los 264 tests pasaban pero quedaba una promesa colgada: `registrar` escribía en la base y recién después navegaba; el test esperaba solo la escritura, vitest desmontaba jsdom y `navigate()` corría contra un `window` inexistente. Pasaba en local y falló en el runner, más lento. Lección: **un test que espera un efecto intermedio no espera al handler**; hay que esperar el último efecto observable.
- **El repo nunca se había pusheado**: origin estaba vacío y los 43 commits vivían solo en la máquina de Facu. El push inicial de 198 MB falló con HTTP 400 hasta subir `http.postBuffer`. Vale revisar `git ls-remote` antes de asumir que "está en GitHub".
- **Comprimir `CLAUDE.md` sin perder nada se verifica, no se estima.** El primer intento quedó *más largo* que el original. Un chequeo automático de 45 datos duros (nombres de hoja, umbrales ΔE, tokens) permitió apretar hasta −14 % con la certeza de que ninguna regla se había caído.

---

## Cuatro arreglos salidos de usar la app (2026-08-22)

Los issues #57-#60 no vinieron de la planificación sino de Facu usando la app. La quinta cosa, que no pidió, reordena las otras cuatro.

- **"Es principalmente una app de recetas; la nutrición es de segundo nivel."** Ni el código ni los docs lo decían: `CLAUDE.md` abre con "recetas veganas **con base nutricional**" y ocho de sus invariantes son nutricionales. El peso aparente estaba invertido y se filtró a la UI — 20 filas de nutrientes (12 sin dato) contra 4 renglones telegráficos de instrucciones. **Ante empate de espacio, gana lo que ayuda a cocinar.**
- **Escribí la regla y la violé en el mismo commit.** El estilo de T9 dice "los `secretos_chef` no se absorben"; los copié dentro de los pasos en **8 de 8** recetas. Es la lección de las 141 violaciones de color otra vez, con un matiz peor: la regla tenía minutos de vida y vivía en el archivo que estaba editando. **La cercanía no protege; protege el test.**
- **Un aviso que no se puede callar termina tapando la acción que lo apagaría.** El banner de backup era `sticky` e "insistente a propósito", y su condición (nunca hubo backup + hay cambios) no se apaga sola. En mobile tapaba el único enlace a Ajustes, que es donde está el botón de exportar.
- **Un ícono nuevo colisiona por construcción, no por concepto.** El engranaje que dibujé —círculo + 8 rayos radiales— era literalmente `IconSol`, que ya significa "se evalúa por día". Antes de sumar un ícono, mirar las **primitivas** de los que ya están, no solo sus significados.
- **El `.md` espejo del dataset tiene más que el `.json`.** Para `r18` la prosa dice "en sartencita", "¡segundos!" y un sustituto que la normalización perdió. No asumir que el JSON es superset de su propia documentación.
- **Un assert sobre texto genérico sobrevive al cambio que debía detectar.** `getAllByText(/sin datos/)` habría pasado con la sección entera colapsada: el contador nuevo también dice "sin datos". Un test que no puede fallar no es cobertura.
- **Los pasos del dataset son notas de cocinero, no instrucciones**: 3,95 pasos y ~202 caracteres por receta entera, y la mayoría de los ingredientes no aparece nunca. Los cura T9 en `curated-tables.ts`, el primer override de texto del proyecto — todo lo curado hasta ahora era numérico o referencial.
