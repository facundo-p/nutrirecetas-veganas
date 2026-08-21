---
name: cierre-fase
description: Checklist de cierre de fase del roadmap (tests, build, renders, lessons.md, gate de datos, revisión de Facu). Usar cuando una fase está funcionalmente completa y hay que cerrarla.
---

# /cierre-fase — checklist de cierre

Ejecutar EN ORDEN; si un paso falla, arreglar antes de seguir:

1. **Verificación técnica**: `npm test` verde y `npm run build` verde (el build regenera y valida la semilla: si el diff de ids falla, algo se rompió).
2. **Renders**: correr la skill `/renders` para la fase actual y publicar el Artifact.
3. **Gate de datos** (si la fase lo tiene): actualizar `docs/decisiones-de-datos.md` con toda decisión de datos tomada a mano, con columna "¿OK?" para que Facu marque.
4. **lessons.md**: agregar la entrada de la fase: qué funcionó, qué se rompió, qué decisión cambió y por qué. Es la memoria del proyecto entre sesiones.
5. **Issues**: cerrar los sub-issues de la fase y mover su épica a "En revisión de Facu" en el tablero.
6. **Commit** en la rama del issue y PR a `staging` con el CI en verde (jamás commitear directo a `staging`).
7. **Reporte a Facu**: resumen corto con (a) qué quedó funcionando, (b) link al Artifact de renders, (c) preguntas abiertas del gate. **La fase NO se cierra hasta el OK explícito de Facu.** El pase a la fase siguiente se decide con él.
8. **Release**: con el OK dado, correr `/release`.

Recordatorios duros:
- `main` solo recibe el PR de release que abre `/release`, mergeado a mano por Facu.
- `.artifacts/` jamás se toca; correcciones de datos van a `scripts/build-seed/curated-tables.ts` y al gate.
