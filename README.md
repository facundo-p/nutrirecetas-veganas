# Nutrirecetas Veganas

PWA personal de recetas veganas con base nutricional honesta. Sin backend, offline-first, instalable en celular y escritorio.

El activo del proyecto es su capa de datos curada: **84 recetas, 158 ingredientes, 20 nutrientes con RDA y ventanas de evaluación, 25 reglas programables**, más equivalencias de medidas, glosario culinario, utensilios, estacionalidad y conservación. La app existe para explotarla.

## Principios

- **La incertidumbre se muestra, no se esconde**: todo dato lleva índice de confianza y los rangos se muestran como bandas.
- **El semáforo nutricional evalúa cada nutriente en SU ventana temporal** (día o semana), nunca por comida.
- **Separación estricta** entre datos semilla (read-only, versionados) y datos del usuario (locales, nunca se pierden al actualizar la semilla).
- **La app informa, no diagnostica.**

## Documentación

La referencia estable vive en [docs/](docs/):

1. [Auditoría del dataset](docs/auditoria-dataset.md)
2. [Arquitectura](docs/arquitectura.md)
3. [Funcionalidades](docs/funcionalidades.md)
4. [Interacción y estética](docs/estetica-e-interaccion.md)
5. [Decisiones de datos](docs/decisiones-de-datos.md)
6. [Riesgos](docs/riesgos.md)

Lo que falta y lo que está en curso **no vive en markdown**: vive en el tablero de Issues.

Los datos fuente están en `.artifacts/` (read-only; ver `README-dataset.md` ahí dentro).

## Flujo de trabajo

Una rama por issue → PR a **`staging`** con el CI en verde. `main` solo recibe el PR de release que abre `/release`, mergeado a mano. Ver `CLAUDE.md` para las reglas, `CHANGELOG.md` para qué cambió en cada versión y `lessons.md` para la bitácora por fase.
