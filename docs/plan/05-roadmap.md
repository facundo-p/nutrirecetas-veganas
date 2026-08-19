# 05 — Roadmap por fases

Desarrollo incremental. **Cada fase cierra con renders** (Render 0: mockups; fases 1-4: screenshots reales mobile 390 px + desktop 1280 px publicados como Artifact), una entrada en `lessons.md`, y revisión de Facu antes de seguir. Todo el trabajo en la rama `staging`; a `main` solo por PR aprobado (v1 = cierre de Fase 4).

## Fase 0 — Plan y dirección visual ✦ en curso

1. ✅ Rama `staging`; commit raíz en `main` solo con `.gitignore` (base del futuro PR).
2. ✅ Plan en `docs/plan/` + `README.md`.
3. ✅ `CLAUDE.md`, `lessons.md`, hook `guard-main` (bloquea commits/push a `main`).
4. **Render 0**: mockups HTML de 5 vistas con estética botánica editorial + primer set de íconos → Artifact.
5. **Checkpoint**: pulir estética/íconos con Facu antes de escribir código de app.

**Criterio de cierre**: Facu aprueba (o ajustamos) la dirección visual.

## Fase 1 — Reorganización del dataset + cimientos + explorar el recetario

- Scaffolding (Vite + React + TS + PWA base offline + Vitest) y estructura de carpetas.
- **Pipeline `build-seed`**: reorganización de los JSON crudos a una semilla canónica, coherente y consistente (los `.artifacts/` quedan intactos). Todas las transformaciones de la auditoría + migración de preparados (incluye p08) + validaciones. Con tests.
- **Gate de datos**: si quedan inconsistencias del dataset sin resolver, se reportan en detalle a Facu **antes de pasar a Fase 2** (probable: `rendimiento_g` faltante de algunos preparados, confirmación de la tabla de porciones parseadas).
- Motor nutricional puro (`src/domain/`) con golden tests: intervalos, cobertura, RDA canónicas, recursión de preparados.
- UI: navegación general, Recetario (búsqueda + filtros, incluye por ingrediente y por nutriente; variantes agrupadas), Detalle de receta (nutrición en vivo con bandas/IC/cobertura, alerta B12, preparados navegables), Ingredientes (búsqueda por nombre/sinónimo, filtros), Glosario (íconos + culinario).
- Skills de proyecto: `/renders` (Playwright) y `/cierre-fase`.

**Criterio de cierre**: la app navega el recetario completo offline con nutrición honesta; renders revisados; gate de datos resuelto o evaluado con Facu.

## Fase 2 — Perfil, cocinar y registrar

- Onboarding de perfil real (datos + suplementos; placeholders fuera) → RDA personalizadas y semáforo por porción.
- Escalado con avisos (política acordada) en Detalle.
- Flujo **Cocinar ahora**: personalización (desmarcar/sustituir/agregar con recálculo y advertencias por `imprescindible`/`funcion`) → pasos con tipografía grande + wake lock → registro de cocción (variaciones, notas, porciones).
- Overlays: subir IC al probar y aprobar; notas y favoritas.
- **Export/import + recordatorio de backup** (el primer dato de usuario estrena la red de seguridad).

**Criterio de cierre**: ciclo completo cocinar→registrar→semáforo del día funcionando; backup round-trip testeado; renders revisados.

## Fase 3 — Compras y semana

- Multi-selección de recetas → lista de compras consolidada (gramos primero, unidades de referencia, estacionalidad, por góndola) + modo verdulería offline.
- Planificador semanal con semáforo proyectado en vivo (día / semana móvil) combinando plan + cocciones registradas.
- Inicio/Hoy completo (semáforo + plan del día + accesos).

**Criterio de cierre**: planificar una semana real y hacer una compra real con la app; renders revisados.

## Fase 4 — Recetas propias y robustez (v1)

- Carga/edición completa de recetas propias (líneas con `funcion` e `imprescindible`, pasos, guarda).
- "Convertir en receta propia" desde una cocción con variaciones (linaje `deriva_de`).
- Actualización de semilla end-to-end (simulacro de semilla v2: deprecaciones, overlays huérfanos).
- Pulido PWA final: onboarding de instalación iOS, migraciones con fixtures, auto-export pre-migración, Lighthouse offline/instalable.

**Criterio de cierre**: v1 completa → **PR `staging → main`** para aprobación explícita de Facu. Retro de backlog para decidir la siguiente etapa.

## Backlog (post-v1, no descartado)

Modo cocina manos libres completo · despensa/freezer · detección automática de variaciones repetidas · reglas de utensilios como avisos · sync opcional vía archivo en nube del usuario · ampliación de `equivalencias.json` (17 frescos sin peso por unidad) · auditoría USDA de los ~20 ingredientes más usados · ficha para `uva`.
