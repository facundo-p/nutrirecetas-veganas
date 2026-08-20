# Fase 2 — Plan de implementación

> **Para trabajadores agénticos:** SUB-SKILL REQUERIDA: usar superpowers:executing-plans para implementar tarea por tarea. Los pasos usan checkboxes (`- [ ]`).

**Objetivo:** cerrar el ciclo **perfil → cocinar → registrar → semáforo**: la app conoce a Facu, lo acompaña mientras cocina, registra qué comió y le dice cómo viene cada nutriente en su ventana.

**Arquitectura:** aparecen los datos de usuario, así que entra Dexie (IndexedDB) con migraciones versionadas y Zustand para el estado efímero de la sesión de cocina. El motor del dominio sigue puro: recibe perfil + cocciones + consumos y devuelve objetivos y estados. **La semilla nunca entra a IndexedDB; los datos de usuario nunca salen de IndexedDB** (salvo por el export explícito).

**Stack añadido:** dexie ^4 + dexie-react-hooks (useLiveQuery), zustand ^5. Con esto quedan las 5 deps de runtime previstas para v1 (react, react-dom, zod, dexie, zustand; workbox ya viene dentro de vite-plugin-pwa).

**Spec:** `docs/plan/02-arquitectura.md` (§2.2 tablas, §4 export/import, §5 motor), `03-funcionalidades.md` (§1.4 registro, §1.5 escalado, §1.6 personalización), `04-interaccion-y-estetica.md` (§2 pantallas 1/3/4/7/9, §4 íconos de semáforo), `05-roadmap.md` (alcance Fase 2), CLAUDE.md (invariantes).

## Restricciones globales

- Todo en rama `staging`; jamás tocar `main`. `.artifacts/` jamás se edita.
- **Invariante 3**: el semáforo evalúa cada nutriente en SU ventana (`dia` | `semana` móvil de 7 días). **Nunca por comida individual.**
- **Invariante 4**: un suplemento declarado que cumple el esquema apaga la exigencia alimentaria de ese nutriente → estado `cubierto_por_suplemento`.
- **Invariante 5**: la incertidumbre se muestra (bandas, IC, cobertura). Un valor que no se puede afirmar dice "sin datos", nunca cero silencioso (`hasReportableValue`).
- **Invariante 7**: el UL de magnesio aplica solo a suplementos; el semáforo no alerta exceso de Mg alimentario. Regla general: respetar `ul_nota`.
- **Invariante 8**: la app informa, no diagnostica. Sin embarazo/lactancia/menores/condiciones médicas.
- El semáforo **nunca comunica solo con color**: siempre ícono + texto (regla anti-look-IA 6).
- Toda pantalla usable a 390 px. Sin reborde lateral de acento en tarjetas. Los colores se piden por token de rol (`--semaforo-cubierto`, etc.), jamás nombrando un color: el tema decide (ver `src/styles/temas/`).
- Código en inglés; campos de datos de usuario en castellano (como la semilla). UI y docs en castellano rioplatense.
- **Decisiones de producto tomadas por Facu para esta fase** (2026-08-19):
  1. **Consumo**: al registrar una cocción se declara cuántas porciones se comieron en el momento; el resto queda como **sobras**, que se registran los días que se comen. El semáforo suma consumos, no cocciones.
  2. **Alcance del semáforo**: en Fase 2 solo entran cocciones registradas. No hay ingredientes sueltos ni comidas libres; la pantalla Hoy avisa explícitamente que mide solo lo cocinado con la app.

## Estructura de archivos

```
src/
  db/
    schema.ts           # Zod de los datos de usuario (perfil, cocciones, consumos, overlays, meta)
    db.ts               # Dexie: tablas, versiones y migraciones
    repos.ts            # operaciones tipadas (guardarPerfil, registrarCoccion, consumirSobras…)
    backup.ts           # export/import: armado, validación, dry-run, reemplazo total
    *.test.ts           # con fake-indexeddb
  domain/
    profile.ts          # perfil → objetivos por nutriente (RDA + vegano + peso + suplementos + overrides)
    supplements.ts      # ¿el suplemento declarado cumple el esquema del nutriente?
    windows.ts          # ventanas: día calendario local y semana móvil de 7 días
    traffic-light.ts    # estado por nutriente en su ventana (el semáforo)
    scaling.ts          # escalado lineal + avisos por tipo de ingrediente/receta
    session.ts          # nutrición de una sesión de cocina personalizada (desmarcar/sustituir/agregar)
    *.test.ts
  app/
    store.ts            # Zustand: sesión de cocina en curso (efímera, no persiste)
  ui/
    today/              # Hoy: semáforo del día y de la semana, sobras, accesos
    profile/            # onboarding y edición de perfil + suplementos
    cook/               # Cocinar: personalizar → pasos (wake lock) → registrar
    diary/              # Diario: historial de cocciones y consumos, overlays
    settings/           # Ajustes: export/import, recordatorio de backup, versión
    common/             # semáforo compartido (píldoras, íconos de estado)
```

---

## Modelo de datos de usuario (Dexie `nutrirecetas_user`, versión 1)

```ts
// perfil: singleton (id siempre 1)
Perfil = { id: 1; nombre?: string; sexo_para_requerimientos: 'masculino'|'femenino';
  fecha_nacimiento: string /* YYYY-MM-DD */; peso_kg: number; altura_cm?: number;
  multiplicador_actividad: 1 | 1.1 | 1.2;
  suplementos: Array<{ nutriente_id: string; dosis: number; unidad: string;
    frecuencia: 'diaria'|'2x_semana'|'3x_semana'|'semanal'; nota?: string }>;
  overrides: Array<{ nutriente_id: string; objetivo: number; unidad: string; motivo: string }>;
  nutrientes_destacados: string[]; creado_en: string; actualizado_en: string }

// cocciones: snapshot denormalizado completo — sobrevive a cualquier semilla futura
Coccion = { id?: number; receta_id: string; receta_nombre: string; seed_version: string;
  fecha: string /* ISO */;
  porciones_rendidas: number;
  factor_escala: number;                       // 1 = tal cual la receta
  lineas: LineaCocinada[];                     // gramos reales tras personalizar
  variaciones: Variacion[];                    // qué se desmarcó / sustituyó / agregó
  nota?: string;
  nutricion_porcion: NutricionSnapshot;        // congelada al registrar
}
LineaCocinada = { ref: LineRef; nombre: string; g_aprox: number; unidad_display: string }
Variacion = { tipo: 'desmarcado'|'sustituido'|'agregado'; nombre: string; detalle?: string }
NutricionSnapshot = { masa_total_g: number; kcal: NutrientResult;
  por_nutriente: Record<string, NutrientResult>; alerta_b12: boolean }

// consumos: qué se comió y cuándo (el semáforo suma esto, no las cocciones)
Consumo = { id?: number; coccion_id: number; fecha: string /* ISO */; porciones: number }

// overlays: por receta de la semilla; la semilla jamás se muta
Overlay = { receta_id: string; ic_usuario?: number; favorita?: boolean;
  nota?: string; actualizado_en: string }

// meta: singleton (id siempre 1)
Meta = { id: 1; user_schema_version: number; seed_version: string;
  ultimo_backup?: string; cambios_desde_backup: number }
```

Índices Dexie v1: `perfil: 'id'` · `cocciones: '++id, receta_id, fecha'` · `consumos: '++id, coccion_id, fecha'` · `overlays: 'receta_id'` · `meta: 'id'`.

## Decisiones de motor (Fase 2)

- **Objetivo por nutriente** = RDA canónica resuelta por sexo/edad (× peso si `por_kg`, × `multiplicador_actividad` solo en proteína) × factor vegano si el dataset lo trae. Un `override` del perfil pisa todo. Cada objetivo lleva `origen: 'rda' | 'override'` y `aproximada?` para mostrarlo.
- **Suplemento que cumple**: se convierte la dosis a **aporte diario equivalente** (`diaria` ×1, `3x_semana` ×3/7, `2x_semana` ×2/7, `semanal` ×1/7) y se compara contra el objetivo del nutriente. Si el equivalente diario ≥ objetivo → `cubierto_por_suplemento`. Si aporta pero no alcanza, se suma como aporte y el estado sigue evaluándose (no se apaga).
- **Ventanas**: día = día calendario local (00:00–23:59 del huso del dispositivo). Semana = **ventana móvil de 7 días** que termina hoy (incluye hoy). El objetivo semanal = objetivo diario × 7.
- **Estados** (perfil.json §semaforo): `cubierto` ≥90 % · `parcial` 60–90 % · `insuficiente` <60 % · `cubierto_por_suplemento` · `sin_datos` (cobertura insuficiente para afirmar, vía `hasReportableValue`) · `al_borde` cuando el intervalo cruza un umbral (arquitectura §5: el punto medio decide, pero si la banda cruza se marca).
- **UL**: se avisa exceso solo si el nutriente tiene `ul` y **no** tiene `ul_nota` que lo limite a suplementos (magnesio queda excluido, invariante 7).
- **Escalado** (03 §1.5): factor libre (0.5×–4×) aplicado a `g_aprox`; avisos: (a) sal/especias/condimentos/levaduras → "ajustá a gusto, no escala lineal"; (b) tiempos de cocción no se escalan → "revisá el tiempo"; (c) recetas horneadas (tipo `pan`/`dulce` o con equipo de horno) → advertencia fuerte: mejor tandas o múltiplos del molde.
- **Sesión de cocina**: desmarcar una línea (advertencia si `imprescindible`, citando su `funcion`), sustituir por un sustituto resoluble (recalcula) o de texto (solo sugerencia), agregar cualquier ingrediente de la base. La nutrición se recalcula en vivo sobre las líneas efectivas.
- **Fase 2 explícitamente NO incluye**: plan semanal, lista de compras, recetas propias, ingredientes sueltos fuera de receta, despensa/freezer.

---

### Tarea 1: Dexie, esquema de usuario y migraciones

**Files:** Create `src/db/schema.ts`, `src/db/db.ts`, `src/db/repos.ts`, `src/db/db.test.ts`; Modify `package.json`

**Interfaces producidas:** los tipos del modelo de arriba; `db` (instancia Dexie); `repos` con `getPerfil/savePerfil`, `addCoccion`, `addConsumo`, `getOverlay/saveOverlay`, `getMeta/bumpCambios`.

- [ ] **Paso 1: instalar deps y fixture de tests**

```bash
npm i dexie dexie-react-hooks zustand && npm i -D fake-indexeddb
```

- [ ] **Paso 2: escribir el test que falla** (`src/db/db.test.ts`)

```ts
import 'fake-indexeddb/auto';
import { describe, expect, test, beforeEach } from 'vitest';
import { db } from './db';
import { addCoccion, addConsumo, getPerfil, savePerfil } from './repos';

beforeEach(async () => { await db.delete(); await db.open(); });

test('el perfil es un singleton que se pisa a sí mismo', async () => {
  await savePerfil({ sexo_para_requerimientos: 'masculino', fecha_nacimiento: '1990-05-02',
    peso_kg: 78, multiplicador_actividad: 1.1, suplementos: [], overrides: [], nutrientes_destacados: [] });
  await savePerfil({ sexo_para_requerimientos: 'masculino', fecha_nacimiento: '1990-05-02',
    peso_kg: 80, multiplicador_actividad: 1.1, suplementos: [], overrides: [], nutrientes_destacados: [] });
  expect(await db.perfil.count()).toBe(1);
  expect((await getPerfil())!.peso_kg).toBe(80);
});

test('una cocción y sus consumos viven juntos', async () => {
  const id = await addCoccion({ receta_id: 'p19', receta_nombre: 'Pastel de papas', seed_version: '1.0.0',
    fecha: '2026-08-19T20:00:00.000Z', porciones_rendidas: 6, factor_escala: 1, lineas: [], variaciones: [],
    nutricion_porcion: { masa_total_g: 343, kcal: { intervalo: { min: 457, max: 471 }, cobertura_pct: 99, ic: 8 },
      por_nutriente: {}, alerta_b12: true } });
  await addConsumo({ coccion_id: id, fecha: '2026-08-19T20:30:00.000Z', porciones: 2 });
  expect(await db.consumos.where('coccion_id').equals(id).count()).toBe(1);
});
```

- [ ] **Paso 3: correr y ver fallar** — `npx vitest run src/db` → falla porque `./db` no existe.
- [ ] **Paso 4: implementar** `schema.ts` (Zod de cada tabla, sin `id` en los tipos de entrada), `db.ts` (`class UserDb extends Dexie` con `version(1).stores({...})` y los índices de arriba) y `repos.ts` (funciones tipadas; `savePerfil` usa `put({...datos, id: 1})`; `addCoccion` incrementa `meta.cambios_desde_backup`).
- [ ] **Paso 5: correr los tests** → PASS. Verificar además que `npx tsc -b` pasa.
- [ ] **Paso 6: commit** — `feat(f2): base de datos de usuario con Dexie y migraciones versionadas`

### Tarea 2: dominio — objetivos del perfil y suplementos

**Files:** Create `src/domain/profile.ts`, `src/domain/supplements.ts`, `src/domain/profile.test.ts`

**Interfaces consumidas:** `resolveRda`, `veganFactor` (de `src/domain/rda.ts`), `Nutrient` (semilla).
**Interfaces producidas:**

```ts
export type ObjetivoOrigen = 'rda' | 'override';
export interface ObjetivoNutriente { nutriente_id: string; valor: number; unidad: string;
  origen: ObjetivoOrigen; aproximada?: true; cubierto_por_suplemento: boolean; aporte_suplemento_diario: number }
export function edadEnAnios(fecha_nacimiento: string, hoy: Date): number;
export function objetivosDelPerfil(perfil: Perfil, nutrientes: Nutrient[], hoy: Date): Map<string, ObjetivoNutriente>;
export function aporteDiarioEquivalente(s: SuplementoDeclarado): number;  // supplements.ts
```

- [ ] **Paso 1: test que falla**

```ts
test('hierro para varón de 36: RDA 8 × factor vegano 1.8 = 14.4', () => {
  const objetivos = objetivosDelPerfil(perfilBase, idx.seed.nutrientes, new Date('2026-08-19'));
  expect(objetivos.get('hierro')!.valor).toBeCloseTo(14.4, 2);
});
test('proteína usa peso y multiplicador de actividad', () => {
  // 0.9 g/kg × 75 kg × 1.0 = 67.5
  expect(objetivos.get('proteina')!.valor).toBeCloseTo(67.5, 1);
});
test('B12 1000 µg 2x/semana apaga la exigencia alimentaria', () => {
  expect(objetivos.get('b12')!.cubierto_por_suplemento).toBe(true);
});
test('un suplemento que no alcanza suma pero no apaga', () => {
  // 5 µg/día de vitD contra objetivo 15 µg
  expect(o.cubierto_por_suplemento).toBe(false);
  expect(o.aporte_suplemento_diario).toBeCloseTo(5);
});
test('un override pisa la RDA y se marca como tal', () => {
  expect(objetivos.get('hierro')!.origen).toBe('override');
});
```

- [ ] **Paso 2: correr y ver fallar.**
- [ ] **Paso 3: implementar** `supplements.ts` (`aporteDiarioEquivalente`: diaria ×1, 3x_semana ×3/7, 2x_semana ×2/7, semanal ×1/7) y `profile.ts` (edad desde `fecha_nacimiento`; `resolveRda` por sexo/edad/peso; × `veganFactor`; proteína × `multiplicador_actividad`; overrides pisan; suplemento cubre si `aporteDiarioEquivalente ≥ valor`).
- [ ] **Paso 4: correr → PASS.**
- [ ] **Paso 5: commit** — `feat(f2): objetivos nutricionales derivados del perfil real`

### Tarea 3: dominio — ventanas y semáforo

**Files:** Create `src/domain/windows.ts`, `src/domain/traffic-light.ts`, `src/domain/traffic-light.test.ts`

**Interfaces producidas:**

```ts
export type EstadoSemaforo = 'cubierto' | 'parcial' | 'insuficiente' | 'cubierto_por_suplemento' | 'sin_datos';
export interface EstadoNutriente { nutriente_id: string; nombre: string; ventana: 'dia'|'semana';
  estado: EstadoSemaforo; al_borde: boolean; porcentaje: number; consumido: Interval;
  objetivo: number; unidad: string; exceso_ul: boolean }
export function ventanaDia(hoy: Date): { desde: Date; hasta: Date };
export function ventanaSemanaMovil(hoy: Date): { desde: Date; hasta: Date };  // 7 días terminando hoy
export function consumoEnVentana(consumos: Consumo[], cocciones: Map<number, Coccion>,
  ventana: { desde: Date; hasta: Date }): Record<string, NutrientResult>;
export function semaforo(perfil: Perfil, nutrientes: Nutrient[], consumos: Consumo[],
  cocciones: Map<number, Coccion>, hoy: Date): EstadoNutriente[];
```

- [ ] **Paso 1: tests que fallan** (casos tabulados, sin depender del reloj real: siempre se pasa `hoy`)

```ts
test('la semana es móvil: incluye hoy y los 6 días previos', () => {
  const v = ventanaSemanaMovil(new Date('2026-08-19T15:00:00'));
  expect(v.desde.toISOString().slice(0, 10)).toBe('2026-08-13');
});
test('cada nutriente se evalúa en SU ventana', () => {
  // hierro (día) mira solo hoy; yodo (semana) mira los 7 días
});
test('90 % o más = cubierto; 60-90 = parcial; menos = insuficiente', () => { … });
test('si el intervalo cruza el umbral, queda al_borde', () => { … });
test('B12 con suplemento declarado no se evalúa por comida: cubierto_por_suplemento', () => { … });
test('el magnesio alimentario no dispara exceso aunque supere el UL (ul_nota)', () => { … });
test('cobertura insuficiente ⇒ sin_datos, no insuficiente (nunca rojo falso)', () => { … });
```

- [ ] **Paso 2: correr y ver fallar.**
- [ ] **Paso 3: implementar.** El objetivo de la ventana semanal es `objetivo_diario × 7`. `consumoEnVentana` escala la nutrición congelada de cada cocción por las porciones del consumo y suma con la aritmética de intervalos. `exceso_ul` solo si `nutriente.ul != null && nutriente.ul_nota == null`.
- [ ] **Paso 4: correr → PASS.**
- [ ] **Paso 5: commit** — `feat(f2): semáforo por ventanas con suplementos y bandas`

### Tarea 4: dominio — escalado y sesión de cocina

**Files:** Create `src/domain/scaling.ts`, `src/domain/session.ts`, `src/domain/scaling.test.ts`, `src/domain/session.test.ts`

**Interfaces producidas:**

```ts
export type AvisoEscalado = { tipo: 'ajustar_a_gusto'|'revisar_tiempo'|'horneado'; mensaje: string; ingredientes?: string[] };
export function escalarReceta(recipe: Recipe, factor: number, seed: Seed): { lineas: Line[]; avisos: AvisoEscalado[] };
export interface LineaSesion { ref: LineRef; nombre: string; g_aprox: number; unidad_display: string;
  activa: boolean; sustituida_por?: { ref: LineRef; nombre: string }; agregada?: true; imprescindible?: boolean; funcion?: string }
export function lineasIniciales(recipe: Recipe, factor: number, seed: Seed): LineaSesion[];
export function nutricionSesion(lineas: LineaSesion[], seed: Seed): RecipeNutrition;
export function advertenciaDesmarcar(linea: LineaSesion): string | null;
```

- [ ] **Paso 1: tests que fallan**

```ts
test('escalar ×2 duplica los gramos de todas las líneas', () => { … });
test('la sal y las especias disparan "ajustá a gusto"', () => { … });
test('una receta horneada dispara la advertencia fuerte de molde/tandas', () => { … });
test('los tiempos nunca se escalan, pero se avisa que hay que revisarlos', () => { … });
test('desmarcar un ingrediente imprescindible advierte citando su función', () => {
  expect(advertenciaDesmarcar(linea)).toContain('proteína del plato');
});
test('sustituir por un sustituto resoluble recalcula la nutrición', () => { … });
test('agregar un ingrediente de la base suma su aporte', () => { … });
test('la línea desmarcada no aporta nada', () => { … });
```

- [ ] **Paso 2: correr y ver fallar.**
- [ ] **Paso 3: implementar.** `nutricionSesion` reusa el motor: arma una `Recipe` sintética con las líneas activas y llama a `computeNutrition`. Categorías que disparan "ajustá a gusto": `especia`, `condimento` y los ids de sal/levadura/polvo de hornear.
- [ ] **Paso 4: correr → PASS.**
- [ ] **Paso 5: commit** — `feat(f2): escalado con avisos y motor de sesión de cocina`

### Tarea 5: perfil — onboarding y edición

**Files:** Create `src/ui/profile/ProfileScreen.tsx`, `src/ui/profile/SupplementsEditor.tsx`, `src/ui/profile/ProfileScreen.test.tsx`; Modify `src/app/router.ts`, `src/app/Nav.tsx`, `src/app/App.tsx`

- [ ] **Paso 1: ruta y navegación.** Agregar `#/perfil` al router (con su test de ida y vuelta) y la entrada en la nav (4 secciones en mobile: Recetario, Ingredientes, Hoy, Más — o el reparto que quede legible a 390 px; el glosario pasa a "Más" si hace falta).
- [ ] **Paso 2: test que falla**

```tsx
test('sin perfil, la app pide los datos mínimos y no muestra placeholders', () => {
  render(<ProfileScreen />);
  expect(screen.getByLabelText(/Peso/)).toHaveValue(null);   // jamás 75 precargado
  expect(screen.queryByText('1990-01-01')).toBeNull();
});
test('guardar el perfil muestra los objetivos derivados', async () => { … });
test('declarar B12 1000 µg 2x/semana marca ese nutriente como cubierto', async () => { … });
```

- [ ] **Paso 3: implementar.** Formulario: nombre (opcional), sexo para requerimientos (con la aclaración textual del dataset: "parámetro fisiológico de las tablas RDA, no identidad"), fecha de nacimiento, peso, altura (opcional), actividad (3 opciones con ejemplos). Editor de suplementos: nutriente + dosis + unidad + frecuencia. Al guardar, se muestran los objetivos derivados con su origen. **Sin placeholders del dataset: los campos arrancan vacíos.** Nota fija al pie: "La app informa, no diagnostica. Fuera de alcance: embarazo, lactancia, menores y condiciones médicas."
- [ ] **Paso 4: correr los tests → PASS.**
- [ ] **Paso 5: commit** — `feat(f2): onboarding de perfil real con objetivos derivados`

### Tarea 6: Hoy — semáforo del día y de la semana

**Files:** Create `src/ui/today/TodayScreen.tsx`, `src/ui/common/TrafficLight.tsx`, `src/ui/today/TodayScreen.test.tsx`; Modify `src/ui/icons/catalog.ts` (los íconos de semáforo ya existen: hoja entera/media/caída, cápsula, hoja punteada)

- [ ] **Paso 1: test que falla**

```tsx
test('sin perfil, Hoy invita a completarlo en vez de mostrar un semáforo vacío', () => { … });
test('con perfil y sin consumos, cada nutriente aparece como insuficiente o sin datos, nunca en blanco', () => { … });
test('el semáforo dice el estado con ícono y texto, no solo con color', () => {
  expect(screen.getByText('cubierto')).toBeDefined();
});
test('avisa que solo mide lo cocinado con la app', () => {
  expect(screen.getByText(/solo lo que registraste/i)).toBeDefined();
});
```

- [ ] **Paso 2: implementar.** `TrafficLight` (píldora por nutriente: ícono + nombre + estado en texto + banda ≈ y porcentaje). `TodayScreen`: dos bloques (Hoy / Últimos 7 días) según la ventana de cada nutriente, los destacados del perfil primero; sección "Sobras disponibles" (cocciones con porciones sin consumir) con acción rápida "comí 1 porción"; acceso a la última cocción. Aviso fijo de alcance parcial.
- [ ] **Paso 3: correr los tests → PASS.**
- [ ] **Paso 4: commit** — `feat(f2): pantalla Hoy con el semáforo por ventanas`

### Tarea 7: escalado en el Detalle de receta

**Files:** Modify `src/ui/recipe-detail/RecipeDetail.tsx`; Create `src/ui/recipe-detail/PortionScaler.tsx`

- [ ] **Paso 1: test que falla**

```tsx
test('subir las porciones escala los gramos y la nutrición por porción no cambia', () => { … });
test('escalar una receta horneada muestra la advertencia de molde', () => { … });
```

- [ ] **Paso 2: implementar.** Selector de porciones (− / valor / +) arriba de los ingredientes; los gramos de cada línea se muestran escalados; los avisos aparecen debajo del selector. Botón **Cocinar ahora** que abre la sesión con el factor elegido.
- [ ] **Paso 3: correr los tests → PASS.**
- [ ] **Paso 4: commit** — `feat(f2): escalado de porciones con avisos en el detalle`

### Tarea 8: Cocinar — personalizar, pasos y registrar

**Files:** Create `src/app/store.ts`, `src/ui/cook/CookSession.tsx`, `src/ui/cook/CustomizeStep.tsx`, `src/ui/cook/StepsView.tsx`, `src/ui/cook/RegisterStep.tsx`, `src/ui/cook/CookSession.test.tsx`; Modify `src/app/router.ts`

- [ ] **Paso 1: store de sesión (Zustand, efímero).** `{ recetaId, factor, lineas: LineaSesion[], paso: 'personalizar'|'pasos'|'registrar', pasoActual: number }` con acciones `toggleLinea`, `sustituir`, `agregar`, `avanzar`. No persiste: si se cierra la app, la sesión se pierde (la cocción registrada es lo que importa).
- [ ] **Paso 2: tests que fallan**

```tsx
test('desmarcar un imprescindible pide confirmación citando su función', () => { … });
test('la nutrición se mueve en vivo al desmarcar', () => { … });
test('registrar guarda cocción + consumo y vuelve a Hoy', async () => {
  // porciones rendidas 6, comí 2 → 1 cocción, 1 consumo de 2 porciones, 4 de sobra
});
test('el registro guarda las variaciones que se hicieron', async () => { … });
```

- [ ] **Paso 3: implementar los tres pasos.**
  - *Personalizar*: lista de líneas con check; desmarcar imprescindible abre confirmación con su `funcion`; sustitutos resolubles como opciones; buscador para agregar ingredientes; panel de nutrición en vivo (compacto, sticky).
  - *Pasos*: tipografía +2 escalas, un paso a la vez con avance grande, secretos del chef en contexto, **wake lock** (`navigator.wakeLock.request('screen')` con liberación al salir y manejo de rechazo silencioso).
  - *Registrar*: porciones rendidas (prellenado con las de la receta × factor), **"¿cuántas porciones comiste ahora?"**, nota libre, resumen de variaciones. Guarda `Coccion` + `Consumo` inicial (si comió > 0) y ofrece subir el IC si la receta era `por-probar`.
- [ ] **Paso 4: correr los tests → PASS.**
- [ ] **Paso 5: commit** — `feat(f2): flujo cocinar completo con wake lock y registro`

### Tarea 9: Diario, sobras y overlays

**Files:** Create `src/ui/diary/DiaryScreen.tsx`, `src/ui/diary/CookingCard.tsx`, `src/ui/diary/DiaryScreen.test.tsx`; Modify `src/ui/recipe-detail/RecipeDetail.tsx` (overlay: favorita, nota, IC propio)

- [ ] **Paso 1: tests que fallan**

```tsx
test('el diario lista las cocciones con sus variaciones y porciones consumidas', () => { … });
test('comer una porción de sobras crea un consumo con la fecha de hoy', async () => { … });
test('el IC del usuario pisa el de la semilla en el detalle, sin mutar la semilla', async () => { … });
```

- [ ] **Paso 2: implementar.** Diario cronológico con tarjetas de cocción (fecha, receta, porciones rendidas/consumidas/sobrantes, variaciones, nota); acción "comí N porciones" sobre las sobras. En el detalle de receta: estrella de favorita, nota propia, y si la receta es `por-probar` y ya la cocinaste, ofrecer "la probé y la apruebo" → `ic_usuario`. Un badge deja claro que el IC mostrado es el tuyo.
- [ ] **Paso 3: correr los tests → PASS.**
- [ ] **Paso 4: commit** — `feat(f2): diario de cocciones, consumo de sobras y overlays`

### Tarea 10: Export / import y recordatorio de backup

**Files:** Create `src/db/backup.ts`, `src/ui/settings/SettingsScreen.tsx`, `src/db/backup.test.ts`; Modify `src/app/router.ts`, `src/app/App.tsx`

- [ ] **Paso 1: tests que fallan**

```ts
test('round-trip: exportar, borrar todo, importar → los datos vuelven idénticos', async () => { … });
test('el import valida con Zod y rechaza un archivo ajeno sin tocar nada', async () => { … });
test('el dry-run informa qué trae el backup antes de pisar', async () => {
  expect(reporte).toEqual({ cocciones: 3, consumos: 5, overlays: 1, perfil: true, exportado_en: '…' });
});
test('antes de reemplazar, se genera el auto-export del estado actual', async () => { … });
```

- [ ] **Paso 2: implementar.** `exportar()` → `{ user_schema_version, seed_version, exported_at, data: {...} }`; `analizarImport(json)` → reporte; `importar(json)` → **reemplazo total** (nunca merge) previo auto-export. UI en Ajustes: botón Exportar (Web Share API en mobile con fallback a descarga), Importar con selector de archivo + confirmación del dry-run, fecha del último backup, versión de semilla y de esquema. **Banner de recordatorio** cuando pasaron >30 días con cambios (`meta.cambios_desde_backup > 0`).
- [ ] **Paso 3: correr los tests → PASS.**
- [ ] **Paso 4: commit** — `feat(f2): export/import con dry-run y recordatorio de backup`

### Tarea 11: cierre de fase

**Files:** Modify `scripts/renders.mjs`, `lessons.md`, `docs/plan/05-roadmap.md`

- [ ] **Paso 1: sumar las pantallas nuevas a los renders** (`#/hoy`, `#/perfil`, `#/cocinar/p19`, `#/diario`, `#/ajustes`). Como las pantallas nuevas dependen de datos de usuario, el script siembra un estado de demo determinista (perfil + 2 cocciones + consumos con fechas fijas) vía `localStorage`/IndexedDB antes de capturar; ese sembrado vive solo en el script de renders, nunca en la app.
- [ ] **Paso 2: correr la skill `/renders`** para ambos temas y publicar el Artifact.
- [ ] **Paso 3: verificación completa** — `npm test` y `npm run build` verdes; probar el round-trip de backup a mano en el navegador.
- [ ] **Paso 4: entrada en `lessons.md` + roadmap actualizado + commit.**
- [ ] **Paso 5: pedirle a Facu la revisión de cierre** (renders + uso real de un ciclo cocinar→registrar→semáforo).

## Autochequeo (hecho al escribir el plan)

- Cobertura del roadmap §Fase 2: perfil T5 ✓ · RDA personalizadas y semáforo T2/T3/T6 ✓ · escalado con avisos T4/T7 ✓ · cocinar (personalizar/pasos/registrar) T4/T8 ✓ · overlays T9 ✓ · export/import + recordatorio T10 ✓ · cierre T11 ✓.
- Decisiones de Facu incorporadas: consumo por porciones con sobras (modelo `Consumo`, T1/T8/T9) y alcance solo-cocciones (aviso explícito en T6).
- Tipos consistentes: `Coccion.nutricion_porcion` usa `NutrientResult` del motor de Fase 1; el semáforo consume `Consumo` + `Coccion`, no recalcula desde la semilla (el historial sobrevive a semillas futuras).
