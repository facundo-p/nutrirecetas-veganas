# 03 — Funcionalidades

> **Actualizado en la Fase 3 (2026-08-27).** El giro a recetario cambió el peso
> de casi todo lo de abajo. Lo que se descartó quedó escrito con su motivo en vez
> de borrado: el argumento de por qué algo entró sigue valiendo aunque haya
> salido.

## 0. El reenfoque de la Fase 3

La app dejó de llevar la cuenta de lo que se come. **Se eliminaron** el semáforo
por ventanas, el registro de porciones comidas, las sobras, los suplementos
declarados y los objetivos manuales. Lo nutricional quedó para tres cosas:

1. **Buscar recetas por nutriente** — el filtro "rica en…" del recetario y el
   ranking de la ficha de nutriente.
2. **Buscar ingredientes por nutriente** — el filtro "fuentes de…" y el mismo
   ranking.
3. **Ver cuánto aporta una porción** — cantidades con banda, y el porcentaje de
   la dosis diaria, al final de la ficha y colapsado.

El criterio que resuelve las dudas de diseño: **a quien no le interese el dato,
no le tiene que estorbar**.

## 1. Las 6 pedidas por Facu (todas entran)

1. **Consulta nutricional** de cualquier ingrediente o receta: por 100 g y por porción, con bandas de incertidumbre (≈ + rango), índice de confianza visible y cobertura del cálculo ("calculado sobre el 94 % del peso"). Nunca se usa el perfil precargado del dataset (auditoría §2.4).
2. **Carga de recetas nuevas**: formulario completo con líneas de ingrediente (cantidad, `funcion`, `imprescindible`, sustitutos), pasos, guarda. Las recetas propias conviven con la semilla con linaje claro. (Fase 4.)
3. **Lista de compras consolidada**: multi-selección de recetas (o la semana del planificador) → ingredientes sumados en gramos. **El peso es la medida principal** (Facu compra por peso y tiene balanza); las unidades ("≈ 3 cebollas medianas") acompañan como referencia donde hay dato (21/38 frescos). Latas: dato secundario (Facu no compra enlatados; útil para otros). Agrupada por góndola, con estacionalidad.
4. **Registro de cocciones**: qué se cocinó, con qué variaciones (desmarcados, sustituciones, agregados), anotaciones libres, porciones obtenidas, fecha. Snapshot completo: el historial no depende de futuras versiones de la semilla.
5. **Escalado de porciones**: todo escala lineal con avisos por tipo (decisión de Facu): sal/especias/levaduras → "ajustar a gusto, no escalar lineal"; tiempos de cocción no se escalan → "revisar tiempo"; recetas horneadas → advertencia fuerte sugiriendo tandas o múltiplos del molde.
6. **Personalización al cocinar**: desmarcar (advertencia si `imprescindible: true`, con la `funcion` como argumento: "estás sacando la proteína del plato"), sustituir (los 66 sustitutos resolubles recalculan nutrición en vivo; los 100 de texto libre se muestran como sugerencia), agregar cualquier ingrediente de la base. Recálculo nutricional en vivo durante toda la edición.

## 2. Propuestas propias (marcadas como tales, con justificación)

- ~~**Semáforo por ventanas + planificador semanal**~~ — **descartado en la Fase 3.** Se construyó, se usó y Facu decidió que la app no debía llevar esa cuenta. La lección no es que estuviera mal hecho: era la funcionalidad que más explotaba el activo nutricional del dataset, y ese fue exactamente el problema — se optimizó el activo en vez del uso. El planificador (#15) murió con él.
- **Consulta por nutriente** *(lo que sobrevivió del activo nutricional)*: pantalla propia con la dosis diaria, las notas curadas del dataset, y las recetas e ingredientes que más aportan. Es el mismo activo, en modo consulta en vez de modo régimen.
- **Estacionalidad en compras y recetas** *(prioridad elegida por Facu)*: badges "en pico" / "fuera de temporada" (AMBA) en lista de compras, detalle de receta y filtro del recetario. Barato de construir (40/41 match directo), alto valor en la verdulería.
- **Alerta B12 de levadura nutricional** *(invariante de seguridad del BRIEF)*: 14 recetas la usan; el rango del dato arranca en 0 → advertencia siempre visible: "muchas levaduras argentinas NO están fortificadas; leé la etiqueta".
- **Agrupación de variantes**: las 12 variantes se muestran bajo su receta madre (3 brownies de porotos = 1 entrada expandible). La "madre" es el destino de `variante_de` (siempre resoluble según auditoría).
- **Preparados navegables**: enlaces receta↔preparado en ambos sentidos, con la nutrición real encadenada (modelo migrado).
- ~~**Overlay de confianza**~~ — **descartado (2026-09-06, #144).** Al registrar una cocción, la app ofrecía subirle el IC. El problema no era el overlay sino el número: `recipe.ic` mide cuánta confianza tiene la fuente en **su adaptación vegana**, no si la receta es buena, y en la tarjeta se leía como una nota. El IC se fue de las recetas; lo que el usuario gana al cocinar es el estado **probada** (#145). El IC sigue donde mide algo verificable: ingredientes, nutrientes, glosario y la tabla nutricional.
- **Glosario doble**: sección con pestaña de **íconos** (pedido explícito de Facu: cada ícono explicado) y pestaña de **términos culinarios** (los 37 del dataset con implicancia nutricional).
- **Filtros por ingrediente y por nutriente** *(pedido de Facu en revisión)*: "recetas con garbanzos", "ricas en hierro" — este último aprovecha el cálculo en vivo, no valores precargados. **Subió a funcionalidad principal en la Fase 3**: es una de las tres cosas que la app conserva de lo nutricional.

## 3. Postergadas o descartadas, con argumento

| Qué | Decisión | Argumento |
|---|---|---|
| Modo cocina manos libres completo (timers por paso, navegación por gestos) | Backlog | La pantalla de cocción de Fase 2 ya trae tipografía grande + wake lock + avance simple. El modo completo se diseña con la experiencia de uso real acumulada. |
| Despensa / freezer | Backlog | Valioso (conecta conservación + porciones congeladas + compras) pero requiere disciplina de registro que conviene validar primero con el diario de cocciones. |
| Promoción automática de variaciones repetidas a receta propia | Backlog (la promoción manual desde una cocción SÍ entra en Fase 4) | La detección automática ("hiciste esta variación 3 veces") necesita historial acumulado para no ser ruido. |
| Reglas de utensilios U1–U10 como avisos contextuales | Backlog | Aporte marginal frente al costo de normalizar las referencias mezcladas; las recomendaciones por receta se muestran como texto. |
| Auditoría USDA de ingredientes más usados | Tarea de datos, no de app | Sube el IC de la base; no cambia el código. |
| Sincronización automática entre dispositivos | Backlog (evaluar sync vía archivo en nube del usuario) | Sin backend no hay sync real; el export/import cubre la transferencia manual. |
| Usar `perfil_nutricional_porcion_aprox` | **Descartada** | 45 % de desvíos >30 % contra el cálculo desde ingredientes. Mantenerlo sería mentir con precisión. |
