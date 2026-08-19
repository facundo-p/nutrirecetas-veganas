# Brief para Claude Code — Planificación de PWA "Recetario vegano nutricional"

> **Cómo usar este documento:** copiá los archivos del dataset a la carpeta del proyecto y pasale este brief a Claude Code como primer prompt. Está escrito para que lo lea él, no para que lo parafrasees.

---

## 0. Instrucción de arranque

Sos el arquitecto técnico de este proyecto. **En esta primera fase NO escribas código de la aplicación.** Tu entregable es un **plan**.

Antes de proponer nada:

1. **Leé `README-dataset.md` completo.** Contiene el inventario, los esquemas verificados, los invariantes de diseño y —especialmente— la sección §5 "Problemas conocidos del dataset". Esa sección te va a ahorrar días.
2. **Inspeccioná los JSON reales**, no confíes solo en la documentación. Escribí scripts de exploración si te sirven. Verificá integridad referencial, valores atípicos y todo lo que la sección §5 declara como problemático. Si encontrás problemas que no están documentados, **decilo**: la documentación fue hecha por otra instancia de Claude y puede tener puntos ciegos.
3. **Recién entonces** proponé arquitectura y funcionalidades.

Trabajá y respondé **en español rioplatense**.

---

## 1. Contexto

Es una **app personal** (un solo usuario: Facu, vegano, Buenos Aires), no un producto comercial. No hay que optimizar para escala, multi-tenancy ni monetización. Sí hay que optimizar para: **uso real y cotidiano en la cocina, y honestidad de los datos.**

Ya existe una capa de datos completa y curada: **84 recetas, 158 ingredientes, 20 nutrientes con RDA y ventanas de evaluación, 25 reglas programables**, más equivalencias de medidas, glosario culinario, utensilios, estacionalidad y conservación. Todo en JSON. **Esa capa es el activo del proyecto: la app existe para explotarla.**

Un detalle que importa para el diseño: **45 de las 84 recetas son del usuario, ya probadas y aprobadas** (IC 8, la confianza más alta del sistema). Las otras vienen de fuentes externas con IC 5-8. La app debería reflejar esta jerarquía, no aplanarla.

---

## 2. Restricciones técnicas

- **PWA instalable**, uso real en **celular** (en la cocina, con las manos ocupadas) y en **escritorio** (para planificar y cargar recetas). Ambos importan por igual.
- **Sin backend.** Los JSON son la base de datos semilla. Todo lo que el usuario genere se guarda localmente.
- **Offline-first, de verdad.** Tiene que funcionar completa sin conexión: la cocina puede no tener señal.
- **Separación estricta entre datos semilla (read-only) y datos de usuario.** Los JSON del dataset se versionan y actualizan; lo que el usuario carga (recetas propias, registros de cocción, anotaciones, perfil) nunca debe perderse al actualizar la semilla. Definí esta arquitectura explícitamente.
- **Sin backend implica que no hay respaldo automático.** Resolvé exportación/importación de los datos del usuario desde el día uno; perder dos años de anotaciones por limpiar el navegador sería fatal.
- Stack a tu criterio, justificado. Priorizá simplicidad de mantenimiento por sobre sofisticación: esto lo va a mantener una persona en su tiempo libre.

---

## 3. Funcionalidades pedidas por el usuario

Estas son las que pidió textualmente. **Tratalas como punto de partida, no como especificación cerrada** (ver §5).

1. **Consultar el valor nutricional** de cualquier ingrediente o receta.
2. **Cargar recetas nuevas** (el usuario sigue cocinando y sumando).
3. **Marcar un conjunto de recetas para cocinar y obtener la lista de compras consolidada**, con todos los ingredientes sumados.
4. **Registrar las recetas ya hechas**, con las variaciones que les hizo y anotaciones libres.
5. **Elegir la cantidad de porciones** al seleccionar una receta, con escalado de cantidades.
6. **Personalizar la receta al momento de cocinarla:** desmarcar ingredientes que no va a usar, sustituir uno por otro, o agregar alguno nuevo.

Un apunte sobre la 6, porque tiene más profundidad de la que aparenta: cada línea de ingrediente ya trae `funcion` ("proteína del plato", "acidez que corta la grasa") e `imprescindible: true|false`. Eso permite que la app no solo acepte la sustitución sino que **opine con criterio**: advertir cuando se está por sacar algo estructural, sugerir sustitutos que cumplan la misma función, y **recalcular la nutrición en vivo** a medida que se modifica.

---

## 4. Lo que hace distinta a esta app (respetar sí o sí)

Los invariantes están en `README-dataset.md` §2. Los que más impactan en el diseño de la interfaz:

- **El semáforo nutricional evalúa cada nutriente en SU ventana temporal** (día o semana según el nutriente), **nunca por comida.** Una app que te pone en rojo porque el almuerzo no tuvo calcio es una app que se desinstala. El B12 se mira en la semana; el hierro, en el día.
- **Un suplemento declarado apaga la exigencia alimentaria** de ese nutriente.
- **La incertidumbre se muestra, no se esconde.** Todo dato tiene índice de confianza 1-10, y 36 valores son rangos. Un "≈450 mg de calcio (dato variable según marca)" es más honesto y más útil que un "450 mg" falsamente preciso.
- **Advertencia crítica de seguridad:** muchas levaduras nutricionales argentinas **no** están fortificadas con B12. Si una receta la cuenta como fuente de B12, la app tiene que advertirlo. No es un detalle cosmético.
- **La app informa, no diagnostica.**

---

## 5. Tu tarea de criterio (esto es lo más importante del brief)

El usuario pide explícitamente que **no te limites a implementar su lista**. Quiere tu análisis. Concretamente:

- **Proponé funcionalidades que él no pidió** pero que el dataset habilita y sería un desperdicio no aprovechar. Hay bastante material desaprovechado: estacionalidad, conservación, utensilios, el glosario, el sistema de variantes y preparados, las reglas de combinación.
- **Cuestioná o descartá lo que pidió** si tenés una razón fundada. Decilo con el argumento, no lo hagas en silencio.
- **Señalá lo que falta en los datos** para que algo funcione bien.
- **Priorizá.** No todo entra en una v1. Proponé un MVP defendible y qué queda para después.

Algunas tensiones de diseño que ya se ven y que tu plan debería resolver explícitamente (no son las únicas, encontrá las tuyas):

- **El escalado de porciones no es lineal.** Duplicar un guiso no duplica la sal, ni el tiempo de cocción, ni el tamaño de la olla. En repostería, escalar mal arruina la receta. ¿Escalás todo por igual y avisás? ¿Marcás qué ingredientes no escalan? ¿Bloqueás el escalado en recetas horneadas?
- **La lista de compras necesita traducir gramos a unidades de compra.** El dataset tiene `equivalencias.json` con envases argentinos (una lata de legumbres rinde ~240 g escurridos) y pesos por unidad ("1 cebolla mediana ≈ 150 g"). Sumar 380 g de cebolla y decir "380 g" es inútil en la verdulería; decir "3 cebollas medianas" es la app que uno quiere.
- **Los preparados rompen el modelo plano.** Diez recetas del set P son componentes reutilizables (leches, quesos, masas) y otras diez los consumen. Peor: el encadenamiento está a nivel receta (`usa_preparados`) pero **no a nivel línea de ingrediente** (§5.8 del README). Nutricionalmente, el pastel de papas hoy cuenta maní crudo en lugar del queso elaborado. ¿Cómo lo resolvés? ¿Migrás el modelo para que una línea pueda referenciar una receta?
- **Las variantes necesitan una interfaz propia.** Hay 12 recetas que son variantes de otras (tres brownies de porotos distintos, dos hamburguesas, dos arroces con leche). Mostrarlas como 84 recetas sueltas pierde la relación; mostrarlas agrupadas requiere decidir cuál es la "madre".
- **El registro de cocción y las variaciones deberían retroalimentar el dataset.** Si el usuario hace una receta con una variación tres veces seguidas, esa variación *es* su receta ahora. ¿La app se lo ofrece? ¿Sube el IC de las recetas IC 5 cuando las prueba y aprueba?
- **`unidad` es texto libre con 191 valores distintos** (§5.2 del README). `g_aprox` es el campo confiable para calcular. Definí la estrategia.

---

## 6. Formato del entregable

Un plan escrito, en archivos markdown dentro del repo. Sugerido (adaptalo si tenés mejor idea):

1. **Auditoría del dataset** — qué encontraste al inspeccionarlo, qué contradice o agrega a lo documentado, qué hay que arreglar o normalizar antes de construir, y qué transformaciones necesita la semilla.
2. **Arquitectura** — stack elegido y por qué; modelo de datos de la app (incluyendo cómo se separa semilla de datos de usuario); estrategia de persistencia, offline y actualización de la semilla; export/import.
3. **Funcionalidades** — las 6 pedidas, desarrolladas; **más las tuyas, marcadas como propias y justificadas**; más las que recomendás sacar o postergar, con el argumento.
4. **Diseño de interacción** — los flujos principales, con foco en el uso real: cocinar con el celular en la mesada, hacer la compra en la verdulería, planificar la semana sentado en la compu.
5. **Roadmap por fases** — qué entra en el MVP y qué justifica esa decisión; qué viene después.
6. **Riesgos y preguntas abiertas** — lo que necesitás que el usuario decida antes de que escribas la primera línea de código.

**Terminá el plan con las preguntas que necesites que Facu responda.** No asumas en silencio: preguntá. Cuando el plan esté aprobado, ahí sí empezamos a construir.
