---
name: renders
description: Genera los screenshots reales de la app (390 px y 1280 px) para revisión de Facu y los publica como Artifact. Usar al cierre de cada fase o cuando Facu pida ver la app.
---

# /renders — screenshots reales para revisión

1. Asegurate de que el build esté al día: `npm run build` (regenera la semilla y falla si algo está roto — no seguir si falla).
2. Correr `npm run renders -- fase-N` (N = fase actual; default `fase-1`). Deja los PNG en `docs/renders/fase-N/`, un archivo por ruta y viewport (`{ruta}--mobile-390.png`, `{ruta}--desktop-1280.png`).
3. Revisar los PNG generados (abrirlos, no asumir): ¿se ve el fondo de verduras? ¿tipografías Fraunces/Schibsted? ¿nada desbordado a 390 px?
4. Publicar un Artifact HTML con TODAS las capturas embebidas (data URI o subidas como assets), agrupadas por pantalla, mobile y desktop lado a lado, con una nota corta de qué cambió en esta iteración. Título estable por fase (ej. "Renders Fase 1").
5. Pasarle el link a Facu y pedir revisión explícita. Los renders son el checkpoint de cierre: sin OK de Facu no se cierra la fase.

Reglas:
- Los renders se commitean en `docs/renders/` (son parte de la historia del proyecto).
- Si una pantalla se ve mal, arreglar primero y regenerar: jamás publicar renders rotos "para mostrar avance".
