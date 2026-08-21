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

## Preguntas abiertas

Las 1 y 2 (`rendimiento_g` de los preparados, tabla de porciones) se resolvieron
en el gate de Fase 1 → `docs/decisiones-de-datos.md`.

Las que siguen abiertas viven como issues en el tablero: sustitutos de texto
libre, hosting, y la ficha de `uva`.

## Decisiones ya tomadas (registro)

Migrar modelo de preparados en ingesta · escalado lineal con avisos · estética botánica editorial · prioridades: planificador semanal + estacionalidad · gramos como medida principal de compras · mobile-first absoluto (sin sync automática entre dispositivos; export/import como transferencia) · app compartible sin nada hardcodeado · descartar `perfil_nutricional_porcion_aprox` del runtime · una rama por issue con PR a `staging`; a `main` solo por el PR de release aprobado (ver `CLAUDE.md`).
