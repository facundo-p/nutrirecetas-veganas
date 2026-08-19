# 05 — Roadmap por fases

Desarrollo incremental. **Cada fase cierra con renders** (Render 0: mockups; fases 1-4: screenshots reales mobile 390 px + desktop 1280 px publicados como Artifact), una entrada en `lessons.md`, y revisión de Facu antes de seguir. Todo el trabajo en la rama `staging`; a `main` solo por PR aprobado (v1 = cierre de Fase 4).

## Fase 0 — Plan y dirección visual ✅ cerrada (2026-08-19)

1. ✅ Rama `staging`; commit raíz en `main` solo con `.gitignore` (base del futuro PR).
2. ✅ Plan en `docs/plan/` + `README.md`.
3. ✅ `CLAUDE.md`, `lessons.md`, hook `guard-main` (bloquea commits/push a `main`).
4. ✅ **Render 0**: mockups HTML de 5 vistas con estética botánica editorial + primer set de íconos → [Artifact publicado](https://claude.ai/code/artifact/b25c5547-deb5-430c-b227-b2f1791b6525).
5. ✅ **Checkpoint**: estética aprobada por Facu tras 5 iteraciones → Propuesta C "Carta de estación" con su fondo de verduras.

## Fase 1 — Reorganización del dataset + cimientos + explorar el recetario ✦ en curso

- ✅ Scaffolding (Vite + React 19 + TS + vite-plugin-pwa + Vitest) y estructura de carpetas. Plan detallado en `fase1-implementacion.md`.
- ✅ **Pipeline `build-seed`**: semilla canónica commiteada (`src/seed/seed.json`, 308 KB) con todas las transformaciones de la auditoría, migración de preparados (incluye p08 y la masa faltante de p22), AST de reglas, RDA canónicas, diff de ids inmutables. Tablas curadas en `scripts/build-seed/curated-tables.ts`. Con tests.
- ✅ **Gate de datos**: `fase1-gate-datos.md` con todas las decisiones para revisión de Facu.
- ✅ Motor nutricional puro (`src/domain/`) con golden tests: intervalos, cobertura, IC ponderado, RDA canónicas, recursión de preparados, alerta B12.
- ✅ UI: navegación general, Recetario (búsqueda por nombre/ingrediente/sinónimo, filtros, rica-en, variantes agrupadas), Detalle (nutrición en vivo con bandas/IC/cobertura, alerta B12, preparados navegables, tips de reglas), Ingredientes (fichas completas, fuentes-de), Glosario (íconos + términos).
- ✅ Skills de proyecto: `/renders` (Playwright, `docs/renders/fase-1/`) y `/cierre-fase`.
- **Checkpoint**: renders publicados + gate de datos revisado por Facu. ← **acá estamos**

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
