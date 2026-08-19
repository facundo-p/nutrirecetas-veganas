# Dataset "Recetario vegano nutricional" — Documentación de base

**Versión del dataset:** 1.0 · Agosto 2026 · Idioma: español rioplatense
**Propósito:** capa de datos completa para una PWA personal de recetas veganas con base nutricional. Todo el contenido está en pares Markdown (legible) + JSON (consumible). **La app consume los JSON; los MD son documentación para humanos y para vos.**

---

## 1. Inventario de archivos

### 1.1 Archivos VIGENTES (los que la app debe consumir)

| Archivo | Contenido | Tamaño |
|---|---|---|
| `ingredientes-v1.3.json` | **158 ingredientes** con valores nutricionales /100 g, nombres porteños y sinónimos | 59 KB |
| `nutrientes-veganos-v1.1.json` | **20 nutrientes** (RDA, ajuste vegano, UL, ventana de evaluación) + **15 reglas de combinación** | 23 KB |
| `recetas.json` | Set 1 — 10 recetas saladas fundacionales | 37 KB |
| `recetas-set2.json` | Set 2 — 10 saladas dirigidas a huecos nutricionales + 10 dulces | 57 KB |
| `recetas-set3.json` | Set 3 — 9 adaptadas del libro comercial | 40 KB |
| `recetas-personales.json` | **Set P — 45 recetas propias del usuario** (la fuente de mayor confianza) | 102 KB |
| `equivalencias.json` | Volumen↔peso, peso por unidad, seco→cocido, envases argentinos, temperaturas de horno | 9 KB |
| `glosario.json` | 37 términos culinarios con implicancia nutricional | 10 KB |
| `utensilios.json` | Materiales, equipos, 10 reglas de utensilio, kit mínimo | 8 KB |
| `perfil.json` | Esquema de perfil de usuario + lógica de cálculo de objetivos + semáforo | 3 KB |
| `estacionalidad.json` | 41 frescos con meses de pico (AMBA) | 8 KB |
| `conservacion.json` | 41 ítems con duración en despensa/heladera/freezer | 6 KB |
| `evaluacion-libro.json` | Análisis del libro comercial (referencia; **no** es data de producción) | 22 KB |

Cada uno tiene su `.md` gemelo con la misma información en prosa.

⚠️ **Excepción:** `ingredientes.md` quedó congelado en la v1.0 (84 ingredientes) mientras el JSON avanzó a v1.3 (158). Sirve para entender el criterio y las trampas documentadas (calcio del sésamo, tofu según coagulante, castaña de Pará), pero **para el listado real usar siempre `ingredientes-v1.3.json`**. Los 74 ingredientes agregados después están documentados en prosa dentro de `recetas-set3.md` y `recetas-personales.md`.

### 1.2 Archivos SUPERSEDIDOS (no usar; conservados por historial)

- `ingredientes.json` (84 ítems, v1.0) → reemplazado por v1.3
- `ingredientes-v1.1.json` (120) → reemplazado por v1.3
- `ingredientes-v1.2.json` (134) → reemplazado por v1.3
- `nutrientes-veganos.json` (v1.0, sin ventanas de evaluación) → reemplazado por v1.1

⚠️ **Además:** `recetas.json` y `recetas-set2.json` contienen una clave `ingredientes_nuevos_para_base` que ya fue fusionada a `ingredientes-v1.3.json`. **Ignorarla al importar** o se duplicarán ingredientes.

---

## 2. Invariantes de diseño (NO negociables)

Estas decisiones son la columna vertebral del dataset. Cualquier implementación debe respetarlas:

1. **La unidad canónica interna es el gramo.** Toda cantidad se convierte a gramos para calcular. El campo `g_aprox` de cada línea de ingrediente es el puente confiable (ver §4.2).
2. **Los valores nutricionales viven en el ingrediente, no en la receta.** La nutrición de una receta se *calcula* sumando ingredientes. Esto permite escalar porciones, sustituir y desmarcar ingredientes con recálculo automático.
3. **Índice de confianza (IC 1-10) en todo dato.** 9-10 = valor regulatorio oficial · 7-8 = consenso experto · 5-6 = variable o dependiente de marca. La app debe mostrar esta incertidumbre, no ocultarla.
4. **Ventana de evaluación por nutriente (día | semana).** El semáforo nutricional evalúa cada nutriente en SU ventana. **Nunca por comida individual.** Un almuerzo sin calcio no es un problema; una semana sin yodo sí. Ver `ventana_evaluacion` en `nutrientes-veganos-v1.1.json`.
5. **Un suplemento declarado apaga la exigencia alimentaria** de ese nutriente (estado `cubierto_por_suplemento`).
6. **Contexto argentino embebido:** harina fortificada con hierro y folato (Ley 25.630), sal yodada (Ley 17.259), tamaños de envase locales. ⚠️ **Dato crítico de seguridad: muchas levaduras nutricionales locales NO están fortificadas con B12** — la app debe advertirlo siempre que una receta la use como fuente de B12.
7. **La app no diagnostica ni prescribe.** Informa y sugiere. Perfil fuera de alcance: embarazo, lactancia, menores, condiciones médicas.

---

## 3. Esquemas de datos (verificados contra los archivos reales)

### 3.1 Ingrediente (`ingredientes-v1.3.json` → `ingredientes[]`)

```jsonc
{
  "id": "garbanzos",                  // clave primaria, snake_case
  "nombre": "Garbanzos",
  "sinonimos": ["chickpeas"],         // para búsqueda y resolución de nombres
  "categoria": "legumbre",            // legumbre|cereal|verdura|fruta|semilla|fruto_seco|
                                      // derivado_soja|alga|hongo|especia|condimento|aceite|
                                      // fortificado|otro|fruta_seca|pseudocereal
  "base": "cocidos",                  // ⚠️ estado al que refieren los valores (crudo/cocido/seco)
  "kcal": 164,                        // por 100 g  (puede ser {min,max})
  "nutrientes": { "prot_g": 8.9, "hierro_mg": 2.9, /* ... */ },  // por 100 g
  "notas": "…",
  "confianza": 8,
  "fuentes": ["usda"],
  "origen": "set3_libro"              // opcional: de qué tanda vino
}
```

**Nutrientes usados como claves:** `prot_g`, `fibra_g`, `hierro_mg`, `calcio_mg`, `zinc_mg`, `magnesio_mg`, `potasio_mg`, `sodio_mg`, `selenio_ug`, `yodo_ug`, `folato_ug`, `vitc_mg`, `vita_ug_rae`, `vitk_ug`, `vite_mg`, `b2_mg`, `b6_mg`, `b12_ug`, `colina_mg`, `ala_g`, `grasa_saturada_g`.

### 3.2 Nutriente (`nutrientes-veganos-v1.1.json` → `nutrientes[]`)

```jsonc
{
  "id": "hierro", "nombre": "Hierro", "grupo": "A",   // A=crítico, B=importante
  "unidad": "mg",
  "rda": { "hombre_19_50": 8, "mujer_19_50": 18, /* … */ },
  "ajuste_vegano": 1.8,               // multiplicador (biodisponibilidad)
  "ul": 45,                           // límite superior tolerable
  "ventana_evaluacion": "dia",        // dia | semana  ← rige el semáforo
  "ventana_nota": "…",
  "confianza_rda": 9, "fuentes": [...], "notas": "…"
}
```

### 3.3 Regla de combinación (`reglas_combinacion[]`, R1–R15)

```jsonc
{ "id": "R1", "tipo": "potenciador",
  "condicion": "receta con hierro no-hemo + fuente de vitamina C en la misma comida",
  "mensaje": "…", "confianza": 9, "fuentes": [...] }
```

⚠️ `condicion` está en **lenguaje natural**, no es ejecutable. Traducirla a predicados es trabajo de implementación (ver §5, punto 7).

### 3.4 Receta (los 4 sets)

```jsonc
{
  "id": "r01" | "d01" | "p01",
  "nombre": "…",
  "tipo": "salada|dulce|preparado|combo|pan",   // ⚠️ ausente en recetas.json (set 1)
  "porciones": 4,                                // a veces string: "~1.8 L", "6-8 medallones"
  "tiempo_prep_min": 20, "tiempo_coccion_min": 30,
  "dificultad": "trivial|fácil|media|difícil",
  "fuente": { "ref": "…", "nota": "…" },
  "ingredientes": [ /* ver 4.2 */ ],
  "pasos": ["…"],
  "secretos_chef": ["…"],
  "guarda": { "heladera_dias": 3, "freezer": true },
  "reglas_disparadas": ["R1", "R8"],
  "perfil_nutricional_porcion_aprox": { … },     // ⚠️ ver §5 punto 3
  "utensilio_recomendado": ["U3"],
  // Set P exclusivamente:
  "variante_de": "r09", "familia": "hamburguesas",
  "usa_preparados": ["p04","p16"], "indulgente": true, "candidata_clasica": true
}
```

### 3.5 Línea de ingrediente dentro de una receta

```jsonc
{
  "ingrediente_id": "garbanzos",     // FK → ingredientes-v1.3.json
  "cantidad": 400,
  "unidad": "g_cocidos",             // ⚠️ TEXTO LIBRE, no enum (ver §5 punto 2)
  "g_aprox": 400,                    // ✅ EL CAMPO CONFIABLE para calcular
  "funcion": "proteína del plato",   // para qué está: habilita sustituciones inteligentes
  "imprescindible": true,            // ⚠️ mapea directo al "desmarcar ingredientes"
  "sustitutos": ["porotos_alubia"],  // ⚠️ mitad son texto libre (ver §5 punto 4)
  "nota": "…"
}
```

---

## 4. Contenido por números

- **84 recetas** = 10 (set 1) + 20 (set 2) + 9 (set 3) + 45 (set P personal)
- **158 ingredientes** · **20 nutrientes** · **25 reglas programables** (R1–R15 nutricionales + U1–U10 de utensilios)
- **Integridad referencial verificada: 0 ingredientes huérfanos** en los 4 sets
- Set P incluye **10 preparados** (componentes reutilizables), **12 variantes** enlazadas a recetas existentes, **10 recetas que encadenan preparados**

### Niveles de confianza por set

| Set | Estado | IC | Significado |
|---|---|---|---|
| **P (personal)** | `probada` | **8** | Probadas y aprobadas por el usuario. La verdad de referencia. |
| 1 y 2 | `probada`/`por-probar` | 6-8 | Fuentes testeadas (Rainbow Plant Life, Minimalist Baker, técnica Zahav…) |
| 3 | `por-probar` | **5** | Libro autoeditado sin certificación. Subir IC al validarlas en cocina. |

---

## 5. Problemas conocidos del dataset (leer antes de implementar)

Detectados por auditoría automática. **Ninguno es bloqueante, pero todos requieren una decisión de implementación:**

1. **Deriva de nombres de campo entre sets.** Sets 1-3 usan `estado_sugerido` + `confianza_adaptacion`; el set P usa `estado` + `confianza`. El set 1 no tiene `tipo`. → **Normalizar en una capa de ingesta**, no editar los archivos fuente a mano.

2. **`unidad` es texto libre y está desbordado: 191 valores distintos** solo en el set P (`"cda_jugo_AL_FINAL"`, `"cda + 4 de agua"`, `"taza_de_coccion_papa"`…). No sirve como enum ni para parsear. → **Usar `g_aprox` como fuente de verdad para todo cálculo**; mostrar `unidad` solo como texto de display al cocinar.

3. **`perfil_nutricional_porcion_aprox` está en 39 de 84 recetas** (los sets 1-3 lo tienen completo; el set P casi no). Además fue estimado a mano. → **Calcular siempre desde los ingredientes.** Usar el valor precargado únicamente como *sanity check* (si difieren >30%, hay un error de datos que vale la pena loguear).

4. **84 de 166 sustitutos son texto libre**, no IDs resolubles (`"porotos_alubia"` ✅ vs `"copos de maíz + harina de almendras (sin gluten)"` ❌). → La sustitución con recálculo nutricional solo funciona con los resolubles; el resto se muestra como sugerencia textual. Alternativa: mapearlos progresivamente a IDs.

5. **42 de 158 ingredientes no tienen bloque `nutrientes`** (especias, condimentos, algunos otros donde el aporte es irrelevante). → El cálculo debe tolerar nulos y **reportar cobertura** ("nutrición calculada sobre el 94% del peso de la receta").

6. **36 valores nutricionales son rangos `{min, max}`** (ej. yodo de las algas, calcio del tofu según coagulante). → Decidir: ¿punto medio con banda de incertidumbre visible? ¿aritmética de intervalos? Es una decisión de producto, no solo técnica. Coherente con el espíritu del IC: **mostrar la incertidumbre, no aplanarla**.

7. **Las `condicion` de las reglas R1-R15 están en prosa**, no como predicados ejecutables. → Hay que traducirlas a código. La mayoría es simple ("hay un ingrediente con hierro + uno con vitC en la misma receta").

8. **Los preparados encadenados no están enlazados a nivel de línea de ingrediente.** Ejemplo: `p19` (pastel de papas) lista `mani: 250 g` con una nota que dice "como queso P04", y declara `usa_preparados: ["p04"]` a nivel receta. → Nutricionalmente cuenta maní crudo, no el queso elaborado. **Es la debilidad de modelado más real del dataset.** Idealmente la línea debería poder referenciar `receta_id` en lugar de `ingrediente_id`.

9. **`conservacion.json` mezcla IDs de ingrediente con nombres de categoría** (`"lino_molido"` vs `"legumbres_cocidas"`). → No asumir FK directa; resolver por *matching* flexible.

10. **`perfil.json` contiene datos PLACEHOLDER** (fecha de nacimiento y peso inventados). El usuario debe cargar los reales en el primer uso.

11. **Auditoría USDA pendiente:** los valores nutricionales provienen de USDA FoodData Central pero **no fueron verificados uno por uno**. IC máximo 8 por eso. Tarea pendiente sugerida: auditar los ~20 ingredientes más usados contra fdc.nal.usda.gov.
