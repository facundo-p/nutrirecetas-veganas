# 02 — Arquitectura

## 1. Stack

**TypeScript + React 19 + Vite (SPA estática) + vite-plugin-pwa (Workbox) + Dexie.js sobre IndexedDB + Zod + Zustand + Vitest.** Sin meta-framework, sin framework CSS (CSS propio con design tokens), router liviano en modo hash.

Justificación (criterio dominante: mantenibilidad a años vista por una persona):

- **React + Vite**: React es estable hace una década y tiene el mejor ecosistema de documentación y asistencia. SvelteKit es más elegante pero arrastra maquinaria SSR que sin backend no sirve y tiene churn de API; Next.js está contraindicado (no hay servidor). El dataset entero pesa ~350 KB: no existe problema de bundle que justifique sofisticación.
- **Dexie.js**: migraciones versionadas declarativas + `liveQuery` con hooks de React + 10 años de madurez. `idb` crudo obliga a escribir el sistema de migraciones a mano (justo lo que no queremos); SQLite WASM/OPFS es frágil en iOS y overkill para un usuario.
- **Estado**: la base de datos ES el estado. Datos persistidos vía `useLiveQuery`; estado efímero de la sesión de cocina (checks, sustituciones en curso) en un store Zustand chico. Nada de Redux ni React Query: no hay red que cachear.
- **Zod**: única fuente de esquemas (semilla canónica, datos de usuario, archivo de backup).
- **Vitest** concentrado donde duele: motor de cálculo, intérprete de reglas, pipeline de ingesta, migraciones, round-trip de export/import. Testing Library para 2-3 flujos críticos. Playwright solo para el script de renders.
- Cinco dependencias de runtime (React, Dexie, Zod, Zustand, Workbox), lockfile commiteado. Actualizar una vez al año alcanza.

## 2. Arquitectura de datos

**Principio rector: la semilla nunca entra a IndexedDB; los datos de usuario nunca salen de IndexedDB.**

### 2.1 Ingesta de la semilla: en build-time

`scripts/build-seed.ts` toma los JSON crudos de `.artifacts/` (read-only, jamás se editan) y emite **un `seed.json` canónico** versionado (semver + hash de contenido), que se precachea con la app y se carga a memoria al arrancar. Todas las transformaciones de la auditoría (`01-auditoria.md` §5) ocurren acá, una sola vez y con tests:

- Esquema unificado de recetas (deriva de campos entre sets, `tipo` inferido para set 1, `dificultad` normalizada).
- `porciones` → `{ porciones_num, porciones_display }` con tabla curada para las 34 recetas string.
- RDA canónicas `{ sexo?, edad_min, edad_max, valor, por_kg? }`.
- Reglas R1–R15 → **AST canónico** (unión discriminada de predicados conocidos). Predicado desconocido = **falla el build**, nunca el runtime.
- **Migración de preparados**: tabla curada mapea líneas fantasma (ej. `mani 250 g "como queso P04"` en p19) a `ref_receta_id`. Una línea canónica referencia `ingrediente_id` **o** `receta_id`. Incluye p08 como preparado de facto. Cada preparado lleva `rendimiento_g` (el pipeline lo exige o falla).
- Conservación resuelta a referencias explícitas (id directo o categoría expandida).
- Referencias de reglas/utensilios normalizadas (id limpio + calificador).
- Se descartan: `perfil_nutricional_porcion_aprox` (45 % de desvío >30 %), `ingredientes_nuevos_para_base` (ya fusionados), archivos supersedidos.
- Validación final: integridad referencial, Zod, y **diff contra la semilla anterior** que falla el build si un id desaparece o se renombra. Contrato: **ids inmutables — se depreca, no se renombra.**

### 2.2 Datos de usuario (Dexie, db `nutrirecetas_user`)

| Tabla | Contenido |
|---|---|
| `perfil` | singleton: datos para RDA, suplementos declarados |
| `recetas_propias` | recetas del usuario; si nace de una semilla o cocción: linaje `deriva_de` + `seed_version_base` |
| `overlays` | por `receta_id` semilla: IC ganado al probar, notas, sustituciones favoritas, favorita/oculta. **La semilla jamás se muta.** |
| `cocciones` | registro con **snapshot denormalizado completo** (líneas con gramos reales, porciones, fecha, variaciones, anotaciones): el historial sobrevive a cualquier actualización de semilla |
| `listas_compras` | listas generadas + estado de checklist |
| `plan_semanal` | asignaciones receta→día |
| `meta` | `user_schema_version`, `seed_version` vista, fecha del último backup |

**Actualización de semilla**: llega con la nueva versión de la app (mismo deploy estático). Al arrancar con `seed_version` nueva: chequeo de overlays huérfanos → se marcan "receta retirada", nunca se borran.

### 2.3 Multi-dispositivo y compartir

- **Sin backend no hay sincronización automática**: cada navegador tiene su base local. Toda pantalla es **mobile-first y 100 % usable en el celular**; el export/import es también la transferencia manual entre dispositivos (Web Share → AirDrop). Backlog: sync opcional vía archivo en la nube del usuario, sin servidor propio.
- **Compartible**: deploy como sitio estático público instalable; nada hardcodeado a Facu; perfil vacío al primer uso; cada instalación tiene su base local aislada.

## 3. Offline / PWA

- **Precache total** con Workbox: shell + seed + fuentes self-hosted + íconos. La app es 100 % estática; tras instalar, cache-only: no hay request de red en ningún camino crítico.
- **Actualización**: `registerType: 'prompt'` — toast "Hay una versión nueva" con changelog; **jamás auto-reload** (podés estar cocinando). Se aplica al aceptar o en el próximo arranque.
- **Instalabilidad**: manifest `standalone`, íconos maskable, meta iOS. Onboarding insiste en "Agregar a inicio" en iOS (la web app instalada queda fuera de la purga de 7 días de ITP de Safari).
- `navigator.storage.persist()` al primer arranque. Wake Lock API en la pantalla de cocción.

## 4. Export / Import

- **Formato**: un JSON `nutrirecetas-backup-AAAA-MM-DD.json`: `{ user_schema_version, seed_version, exported_at, data: {todas las tablas de usuario} }`. **Solo datos de usuario** (la semilla es reproducible; exportarla es peso muerto).
- **Import**: validación Zod + dry-run con reporte ("42 cocciones, 12 recetas propias, backup del 3/7") → **reemplazo total, no merge** (el merge es donde viven los bugs que pierden datos). Antes de pisar: auto-export del estado actual.
- **UX**: botón en Ajustes; Web Share API en celular (directo a AirDrop/iCloud/Drive), descarga en desktop.
- **Recordatorios insistentes a propósito**: banner si último backup >30 días y hubo cambios. Es la única red de seguridad sin backend.
- El import aplica migraciones de esquema si el backup es viejo (mismo motor que Dexie al abrir).

## 5. Motor de cálculo nutricional

Módulo `src/domain/` de **funciones puras TypeScript**: cero imports de React, DOM o Dexie. Entrada (semilla, slices de usuario, perfil) → salida (valores). Único módulo con cobertura de tests exhaustiva: golden tests contra recetas calculadas a mano + property tests (escalar ×2 duplica el intervalo; el intervalo de la suma contiene la suma de los puntos medios).

- **Rangos: aritmética de intervalos de punta a punta.** Todo valor interno es `{min, max}` (los puntuales, colapsados). Display: punto medio + banda ("≈450 mg, entre 380 y 520"). El semáforo evalúa el punto medio; si el intervalo cruza el umbral → estado "al borde". El punto medio solo miente si escondés la banda: acá no se esconde.
- **Nulos jamás son cero en silencio**: cada resultado lleva **cobertura** (% de la masa de la receta con dato para ese nutriente). Cobertura baja ⇒ `sin_datos`, no rojo falso.
- **RDA**: resolución por perfil sobre claves canonizadas; proteína en g/kg de peso. Ajuste vegano: factor numérico se aplica (hierro ×1.8, zinc ×1.5); guía textual se muestra como nota, no se inventa factor.
- **Ventanas**: agregación de `cocciones` por nutriente en SU ventana. Día = día calendario local; semana = **ventana móvil de 7 días** (evita el absurdo del lunes en rojo). Suplemento declarado ⇒ `cubierto_por_suplemento`. `ul_nota` respetada (Mg alimentario no alerta).
- **Preparados**: resolución recursiva de `ref_receta_id` con set de visitados (ciclos) y profundidad máxima 3; nutrición /100 g derivada de `rendimiento_g`.
- **Intérprete de reglas**: evaluador del AST contra un contexto (receta activa, líneas tildadas, perfil, registro del día). Predicado que no matchea contexto ⇒ la regla degrada a texto informativo. Nunca rompe.
- `g_aprox` es la única fuente de cálculo; `unidad` es solo display. Siempre.

## 6. Riesgos técnicos y mitigación

1. **Eviction de storage (riesgo #1, iOS)**: `storage.persist()` + onboarding de instalación + recordatorios de backup + auto-export previo a migraciones.
2. **Migraciones de usuario que corrompen**: migraciones Dexie versionadas, cada una con test sobre fixture real, backup automático pre-migración.
3. **Ids inestables entre semillas**: el diff del pipeline lo vuelve error de build.
4. **Bugs de cálculo que erosionan confianza**: dominio puro + golden/property tests.
5. **Churn de dependencias**: 5 deps de runtime, lockfile, revisión anual.
6. **Predicados de reglas que crecen mal**: el AST obliga a formalizar cada predicado nuevo en el pipeline, con test, antes de llegar al cliente.
