# 06 — Riesgos y preguntas abiertas

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Eviction de storage en iOS** (Safari purga datos de sitios no usados en 7 días) | Pérdida total de datos locales — el riesgo #1 del proyecto | Instalar como PWA (queda exenta de la purga), `storage.persist()`, recordatorios de backup insistentes, auto-export antes de cada migración |
| Migración de esquema de usuario que corrompe | Pérdida de historial | Migraciones Dexie versionadas con tests sobre fixtures reales + backup automático pre-migración |
| Ids de semilla que cambian entre versiones | Overlays y cocciones huérfanos | Diff en el pipeline: id que desaparece = build falla. Contrato: se depreca, no se renombra |
| Bug de cálculo nutricional | Erosión de confianza en la app entera | Dominio puro + golden tests contra recetas calculadas a mano + property tests |
| Scope creep (proyecto personal, tiempo libre) | Nunca llegar a v1 | Fases con criterio de cierre explícito; backlog disciplinado; renders como checkpoint |
| Datos incompletos del dataset (ver abajo) | Funciones degradadas | Gate de datos al cierre de Fase 1: se reporta y decide junto a Facu |

## Preguntas abiertas (se resuelven en el gate de Fase 1, no bloquean la Fase 0)

1. **`rendimiento_g` de los 11 preparados**: para encadenar nutrición hace falta el rendimiento total en gramos de cada preparado. Varios lo traen en `porciones` (`"~500 g"`); para el resto voy a llevar una lista concreta con propuesta de estimación para que Facu confirme o corrija.
2. **Tabla de porciones parseadas**: las 34 recetas con `porciones` string van a una tabla curada (`"molde 22-25 cm (10 porciones)"` → 10). Facu revisa la tabla completa en el gate (es su recetario: sabe cuántas porciones rinde cada una mejor que cualquier regex).
3. **Sustitutos de texto libre (100/166)**: ¿mapeo progresivo a ids como tarea de datos compartida, o se quedan como sugerencias textuales? Propuesta: quedan textuales en v1; se mapean los de las recetas más cocinadas después.
4. **Hosting**: para compartir con amigos hace falta un deploy estático público (GitHub Pages / Netlify / Vercel, cualquiera sirve para una SPA estática). Se decide antes del PR a `main`.
5. **`uva`**: agregar ficha mínima de ingrediente o dejarla solo en estacionalidad.

## Decisiones ya tomadas (registro)

Migrar modelo de preparados en ingesta · escalado lineal con avisos · estética botánica editorial · prioridades: planificador semanal + estacionalidad · gramos como medida principal de compras · mobile-first absoluto (sin sync automática entre dispositivos; export/import como transferencia) · app compartible sin nada hardcodeado · descartar `perfil_nutricional_porcion_aprox` del runtime · rama `staging` para todo; `main` solo por PR aprobado.
