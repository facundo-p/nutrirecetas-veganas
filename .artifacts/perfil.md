# Perfil de usuario — La pieza que personaliza todo

**Versión:** 1.0 — Agosto 2026
**Rol:** sin perfil, "% de la dosis diaria" no significa nada: los objetivos de hierro difieren ×2,3 entre un varón y una mujer de 19–50. Este documento define el esquema, la lógica de cálculo y un ejemplo. **Los datos del ejemplo son placeholder: completar con los reales en la app.**

## Lógica de cálculo del objetivo por nutriente

```
objetivo(nutriente, perfil) =
  1. valor base según sexo/edad         (doc nutrientes: rda)
  2. × ajuste vegano si existe           (hierro ×1,8; zinc ×1,5)
  3. ajuste por peso si aplica           (proteína: g/kg × peso)
  4. estado "cubierto por suplemento"    (si el suplemento declarado cumple el esquema)
```

## Reglas de interpretación

1. **Sexo/edad determinan la fila de la tabla RDA.** El campo se llama `sexo_para_requerimientos` porque es un parámetro fisiológico de las tablas (hierro por menstruación, etc.), no una identidad.
2. **Suplementos declarados apagan la exigencia alimentaria.** Si el perfil declara B12 1.000 µg 2×/semana (esquema válido según doc nutrientes), el semáforo de B12 muestra "✔ cubierto por suplemento" en lugar de exigirlo a las recetas. Ídem D en invierno, omega-3 algal, etc. Si la dosis declarada NO alcanza el esquema mínimo, la app lo avisa.
3. **`multiplicador_actividad`** solo afecta proteína (y calorías si se usan): sedentario 1,0 · activo 1,1 · fuerza/mayor de 60: 1,2 (sobre el 1,0 g/kg vegano base).
4. **Exclusiones y alergias** filtran recetas *antes* de recomendar (un sustituto registrado puede rescatar la receta: si excluye nueces, la boloñesa R04 ofrece la variante con champiñones).
5. **Fuera de alcance v1:** embarazo, lactancia, menores, condiciones médicas → la app debe decir explícitamente que sus objetivos no aplican y derivar a profesional.

## Esquema de campos (ver JSON)

- `sexo_para_requerimientos`: "masculino" | "femenino"
- `fecha_nacimiento` (la edad se deriva, no se guarda fija)
- `peso_kg` (proteína), `multiplicador_actividad`
- `suplementos[]`: nutriente_id, dosis, unidad, frecuencia ("diaria" | "2x_semana" | ...)
- `exclusiones[]` / `alergias[]`: ingrediente_ids o categorías
- `overrides[]`: objetivo manual por nutriente (p. ej. indicación médica de hierro), con campo `motivo` — pisa todo lo anterior
- `preferencias_ui`: qué nutrientes destacar en el tablero

## Semáforo sugerido (por nutriente, en su ventana de evaluación)

| Estado | Criterio | 
|---|---|
| 🟢 | ≥ 90 % del objetivo en la ventana |
| 🟡 | 60–90 % |
| 🔴 | < 60 % |
| ✔️ | cubierto por suplemento declarado |
| ⚪ | sin datos suficientes cargados en la ventana |

**Importante:** el semáforo evalúa cada nutriente en su **ventana** (día/semana — ver nutrientes v1.1), nunca por comida individual. Un almuerzo sin calcio no es un problema; una semana sin yodo sí.
