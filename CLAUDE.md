# CLAUDE.md — Nutrirecetas Veganas

PWA personal de recetas veganas con base nutricional. Un solo usuario por dispositivo (Facu; potencialmente amigos con su propia instalación). Sin backend, offline-first real, mantenida por una persona en su tiempo libre: **simplicidad de mantenimiento por sobre sofisticación, siempre**.

Idioma del proyecto: **español rioplatense** (código en inglés, UI y docs en castellano).

## Reglas de git (duras)

- **Todo el trabajo ocurre en la rama `staging`.** Nunca commitear, mergear ni pushear a `main` directamente.
- `main` solo recibe versiones completas vía **PR desde `staging` aprobado explícitamente por Facu**.
- El hook `.claude/hooks/guard-main.sh` bloquea operaciones sobre `main`; si bloquea algo, no es un bug: cambiá a `staging`.
- Los archivos de `.artifacts/` son **read-only**: jamás editarlos. Cualquier corrección de datos se hace en la capa de ingesta (`scripts/build-seed`) o se reporta a Facu.

## Invariantes del dominio (no negociables, vienen del dataset)

1. **El gramo es la unidad canónica**: `g_aprox` es la ÚNICA fuente de verdad para cálculo. El campo `unidad` (295 valores de texto libre) es solo display.
2. La nutrición de una receta **se calcula desde los ingredientes**, nunca se usa `perfil_nutricional_porcion_aprox` (la auditoría mostró 45 % de desvíos >30 %; es solo referencia histórica).
3. **El semáforo evalúa cada nutriente en SU ventana** (`dia` | `semana`, semana = móvil de 7 días). Nunca por comida individual.
4. **Un suplemento declarado apaga la exigencia alimentaria** de ese nutriente (estado `cubierto_por_suplemento`).
5. **La incertidumbre se muestra**: rangos {min,max} como bandas (punto medio + banda visible), índice de confianza (IC 1-10) visible, cobertura de cálculo reportada. Nulos jamás son cero en silencio.
6. **Alerta B12 obligatoria**: si una receta usa levadura nutricional como fuente de B12, advertir que muchas marcas argentinas NO están fortificadas. Es un invariante de seguridad, no cosmético.
7. El UL de magnesio aplica solo a suplementos: el semáforo no alerta exceso de Mg alimentario.
8. **La app informa, no diagnostica.** Fuera de alcance: embarazo, lactancia, menores, condiciones médicas.

## Arquitectura (resumen; detalle en docs/plan/02-arquitectura.md)

- Stack: TypeScript + React 19 + Vite (SPA estática) + vite-plugin-pwa + Dexie.js + Zod + Zustand + Vitest.
- **La semilla nunca entra a IndexedDB; los datos de usuario nunca salen de IndexedDB.**
- `scripts/build-seed.ts` normaliza `.artifacts/` → `seed.json` canónico en build-time. Forma desconocida = falla el build, nunca el runtime.
- Motor nutricional en `src/domain/`: funciones puras, sin imports de React/DOM/Dexie. Es lo único con cobertura de tests exhaustiva.
- Toda pantalla es **mobile-first y 100 % usable desde el celular**.

## Flujo de fases

Desarrollo incremental por fases (docs/plan/05-roadmap.md). Cada fase cierra con **renders** (screenshots reales vía `/renders` desde Fase 1) publicados para revisión de Facu, y una entrada en `lessons.md`. No pasar a la fase siguiente sin ese cierre.

## Punteros

- Plan completo: `docs/plan/`
- Bitácora de lecciones: `lessons.md` (actualizar al cierre de cada fase)
- Dataset y su documentación: `.artifacts/README-dataset.md` (ojo: la auditoría en `docs/plan/01-auditoria.md` corrige varios puntos de esa doc)
