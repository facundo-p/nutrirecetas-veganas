---
name: cierre-fase
description: Checklist de cierre de fase del roadmap (tests, build, renders, lessons.md, gate de datos, revisión de Facu). Usar cuando una fase está funcionalmente completa y hay que cerrarla.
---

# /cierre-fase — checklist de cierre

Ejecutar EN ORDEN; si un paso falla, arreglar antes de seguir:

1. **Verificación técnica**: `npm test` verde y `npm run build` verde (el build regenera y valida la semilla: si el diff de ids falla, algo se rompió).
2. **Sub-issues cerrados**: `gh issue list --state open --label fase-N`. Deberían cerrarse solos al mergear su PR (`cerrar-issues.yml` lee el `Closes #N`); si alguno quedó abierto, el PR no lo declaró y hay que revisar por qué.
3. **Renders**: correr la skill `/renders` para la fase y publicar el Artifact. **Mirarlos de verdad** antes de publicar.
4. **Lo que los renders encuentren se arregla antes de seguir.** Cada hallazgo es un issue nuevo con su label. Si toca un invariante del dominio, **no se cierra la fase con eso abierto**: se arregla y se regeneran los renders, porque los de antes quedaron viejos. En la Fase 3 apareció así una recomendación que era tranquilizadora con la B12 — con los 401 tests en verde.
5. **Gate de datos** (si la fase lo tiene): actualizar `docs/decisiones-de-datos.md` con toda decisión de datos tomada a mano, con columna "¿OK?" para que Facu marque.
6. **Invariantes**: si la fase cambió lo que la app promete, `CLAUDE.md` es el primer archivo a tocar, no el último. Detrás van `README.md`, `docs/funcionalidades.md` y `docs/arquitectura.md`. Lo que se descarta se tacha **con su motivo**, no se borra: el argumento de por qué entró sigue valiendo aunque haya salido.
7. **lessons.md**: la entrada de la fase — qué funcionó, qué se rompió, qué decisión cambió y por qué. Es la memoria del proyecto entre sesiones. Vale más lo que salió mal y cómo se detectó que la lista de lo entregado.
8. **Tablero**: mover la épica a "En revisión de Facu".
9. **Reporte a Facu**: resumen corto con (a) qué quedó funcionando, (b) link al Artifact de renders, (c) preguntas abiertas del gate, (d) lo que quedó abierto a propósito. **La fase NO se cierra hasta su OK explícito.** El pase a la fase siguiente se decide con él.
10. **Release**: con el OK dado, correr `/release`.

## Recordatorios duros

- Todo entra por PR desde la rama de su issue: `gh issue develop N --checkout --base staging`. Sin `--base`, corta de `main` y nace varios releases atrás.
- `main` solo recibe el PR de release que abre `/release`, mergeado a mano por Facu.
- `.artifacts/` jamás se toca; las correcciones de datos van a `scripts/build-seed/curated-tables.ts` y al gate.
- **El orden de los entregables se decide leyendo los imports, no la planificación.** Si un issue deja un estado intermedio que no compila, el orden está mal — no el código.
- Si la fase **borra datos de usuario**, avisarlo en la app (ver `ULTIMA_VERSION_CON_PERDIDA` en `App.tsx`) y en la primera línea del CHANGELOG.
