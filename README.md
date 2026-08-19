# Nutrirecetas Veganas

PWA personal de recetas veganas con base nutricional honesta. Sin backend, offline-first, instalable en celular y escritorio.

El activo del proyecto es su capa de datos curada: **84 recetas, 158 ingredientes, 20 nutrientes con RDA y ventanas de evaluación, 25 reglas programables**, más equivalencias de medidas, glosario culinario, utensilios, estacionalidad y conservación. La app existe para explotarla.

## Principios

- **La incertidumbre se muestra, no se esconde**: todo dato lleva índice de confianza y los rangos se muestran como bandas.
- **El semáforo nutricional evalúa cada nutriente en SU ventana temporal** (día o semana), nunca por comida.
- **Separación estricta** entre datos semilla (read-only, versionados) y datos del usuario (locales, nunca se pierden al actualizar la semilla).
- **La app informa, no diagnostica.**

## Documentación

El plan completo vive en [docs/plan/](docs/plan/):

1. [Auditoría del dataset](docs/plan/01-auditoria.md)
2. [Arquitectura](docs/plan/02-arquitectura.md)
3. [Funcionalidades](docs/plan/03-funcionalidades.md)
4. [Interacción y estética](docs/plan/04-interaccion-y-estetica.md)
5. [Roadmap por fases](docs/plan/05-roadmap.md)
6. [Riesgos y preguntas abiertas](docs/plan/06-riesgos-y-preguntas.md)

Los datos fuente están en `.artifacts/` (no versionados; ver `README-dataset.md` ahí dentro).

## Flujo de trabajo

Todo el desarrollo ocurre en la rama **`staging`**. `main` solo recibe versiones completas vía PR aprobado explícitamente. Ver `CLAUDE.md` para las reglas del proyecto y `lessons.md` para la bitácora de lecciones por fase.
