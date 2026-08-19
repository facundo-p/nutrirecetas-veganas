# 04 — Interacción y estética

## 1. Principio de interacción

Tres contextos de uso real mandan sobre todo lo demás:

1. **Cocinar con el celular en la mesada** (manos ocupadas, quizá sin señal): targets grandes, tipografía grande, pantalla siempre encendida, cero pasos innecesarios.
2. **Comprar en la verdulería** (una mano, apuro): checklist de lectura instantánea, gramos primero.
3. **Planificar sentado** (Mac o celular): densidad de información cómoda, el semáforo como protagonista.

**Toda pantalla es mobile-first y 100 % usable desde el celular** — sin backend no hay sync entre dispositivos, así que ninguna función puede quedar "solo desktop". En desktop las mismas vistas aprovechan el espacio (columnas laterales, grillas más anchas).

## 2. Mapa de pantallas

1. **Inicio / Hoy** — semáforo del día y la semana móvil (cada nutriente en SU ventana), qué toca cocinar según el plan, accesos rápidos (última cocción, lista de compras activa). Responde "¿cómo vengo y qué cocino?".
2. **Recetario** — búsqueda y filtros: tipo, dificultad, tiempo total, familia, en temporada, probada/por probar, **por ingrediente** y **por nutriente** ("ricas en hierro", calculado en vivo). Variantes agrupadas bajo su madre (expandibles); preparados con badge. Tarjetas que resumen con íconos: tipo, tiempo, dificultad, freezer, IC.
3. **Detalle de receta** — selector de porciones con escalado y avisos; ingredientes con función/imprescindible/sustitutos; nutrición por porción en vivo (bandas ≈, IC, cobertura, alerta B12); reglas R como tips; enlaces a preparados y variantes; guarda y estacionalidad. Acciones: **Cocinar ahora · Al plan · A compras**.
4. **Cocinar (sesión)** — 1º personalizar: desmarcar (advertencia si imprescindible), sustituir (resolubles recalculan), agregar; la nutrición se mueve en vivo. 2º pasos con tipografía enorme, wake lock, secretos del chef en contexto. 3º registrar: qué cambió, notas, porciones que quedaron.
5. **Planificador semanal** — grilla de la semana; asignar recetas y ver el semáforo proyectado moverse por nutriente/ventana. Genera la lista de compras de la semana. En mobile: semana como lista vertical + semáforo colapsable siempre a un tap.
6. **Lista de compras** — consolidada por góndola; **gramos como medida principal**, unidades como referencia ("≈ 3 medianas"), latas como dato secundario; badges de estacionalidad. **Modo verdulería**: checklist offline de targets grandes.
7. **Diario** — historial de cocciones con variaciones y anotaciones; evolución del semáforo; desde una cocción: "convertir en receta propia"; probar una IC 5 ofrece subirle el IC.
8. **Ingredientes** — ficha de los 158: nutrición /100 g con bandas e IC, sinónimos, estacionalidad, conservación, equivalencias. Búsqueda por nombre/sinónimo ("chickpeas" encuentra garbanzos), filtros por categoría y por nutriente ("fuentes de calcio" ordenadas por aporte).
9. **Mi perfil** — datos para RDA (sin placeholders), suplementos declarados (apagan exigencia), objetivos derivados visibles.
10. **Glosario** — pestañas: **íconos** (cada uno con su significado) y **términos culinarios** (37 del dataset).
11. **Ajustes y datos** — export/import, recordatorio de backup, versión de semilla, actualización de la app.

La carga/edición de recetas propias vive dentro del Recetario (Fase 4).

## 3. Estética: "Botánica editorial"

Elegida por Facu entre tres direcciones. Cálida pero seria; los datos nutricionales respiran porque el fondo es calmo.

### Tokens de diseño (punto de partida, se pulen con el Render 0)

| Token | Valor aprox. | Uso |
|---|---|---|
| `--papel` | `#F7F3EA` | fondo general (crema papel) |
| `--tinta` | `#2E2B24` | texto principal (tinta cálida) |
| `--oliva` | `#6B7A45` | acento primario, navegación activa |
| `--salvia` | `#9BAA88` | acentos suaves, bordes, tags |
| `--terracota` | `#C0603C` | acciones destacadas, énfasis |
| `--verde-profundo` | `#3D5637` | headers, contraste alto |
| Semáforo verde | `#4C7C4A` | objetivo cubierto (≥90 %) |
| Semáforo ámbar | `#D29A3A` | parcial (60-90 %) |
| Semáforo rojo | `#B0492F` | insuficiente (<60 %) |
| Suplemento | `#5B7A9E` | cubierto por suplemento |
| Sin datos | `#8F8A7E` | ventana sin registros |

- El semáforo **nunca comunica solo con color**: siempre ícono + texto (accesibilidad y honestidad).
- Tipografías self-hosted (offline): **Fraunces** (serif display, títulos con carácter) + una sans muy legible para datos y UI (a definir en Render 0 entre Inter ajustada u otra menos estándar).
- Ilustración botánica de línea fina como ornamento (vacíos, headers, estados vacíos) — jamás compitiendo con datos.
- Modo cocina: contraste reforzado y cuerpo tipográfico +2 escalas.

## 4. Iconografía propia

Set SVG custom, trazo uniforme (~1.75 px en 24 px de caja), estilo línea botánica coherente con la estética. **Regla: ver el ícono debe alcanzar para entender el concepto.** Cada ícono se valida en el Render 0 y el set completo entra en Fase 1 junto con su glosario en la app.

### Glosario de íconos (spec inicial, ~26)

| Grupo | Ícono (concepto visual) | Significado |
|---|---|---|
| Semáforo | Hoja entera | Nutriente cubierto en su ventana (≥90 %) |
| Semáforo | Hoja a medio llenar | Parcial (60-90 %) |
| Semáforo | Hoja caída/marchita | Insuficiente (<60 %) |
| Semáforo | Cápsula | Cubierto por suplemento declarado |
| Semáforo | Hoja punteada | Sin datos suficientes en la ventana |
| Ventana | Sol | Se evalúa por día |
| Ventana | Siete puntos en arco | Se evalúa por semana (móvil, 7 días) |
| Datos | Símbolo ≈ sobre línea | Valor con banda de incertidumbre (rango) |
| Datos | Brotes 1-2-3 | Índice de confianza del dato (bajo/medio/alto) |
| Datos | Círculo semirrelleno | Cobertura parcial del cálculo |
| Receta | Mortero | Salada |
| Receta | Flor | Dulce |
| Receta | Espiga | Pan / masa |
| Receta | Frasco | Preparado (componente reutilizable) |
| Receta | Rama que bifurca | Variante de otra receta |
| Receta | Bandeja | Combo |
| Práctico | Reloj | Tiempo total (prep + cocción) |
| Práctico | Llama ascendente ×1/2/3 | Dificultad |
| Práctico | Plato con ×N | Porciones / escalado |
| Práctico | Asterisco botánico | Ingrediente imprescindible |
| Práctico | Flechas circulares | Sustituible / sustitución activa |
| Práctico | Copo de nieve | Va bien al freezer |
| Práctico | Heladera (puerta) | Guarda en heladera (días) |
| Práctico | Sol naciente sobre surco | En temporada (AMBA) |
| Alerta | Escudo con "B12" | Advertencia B12 (levadura no fortificada) |
| Extra | Estrella brotada | Candidata a clásica / probada y aprobada |

(`indulgente` se evalúa en Render 0: posible ícono de cuchara colmada.)

## 5. Flujos principales (resumen)

- **Cocinar**: Recetario → Detalle (elegir porciones) → Cocinar ahora → personalizar → pasos → registrar. Máximo 2 taps entre detalle y primer paso.
- **Comprar**: Planificador (o multi-selección en Recetario) → Lista de compras → modo verdulería → tildar.
- **Planificar**: Planificador → arrastrar/asignar recetas → mirar semáforo proyectado → generar compras.
- **Backup**: Ajustes → Exportar → compartir archivo (AirDrop/Drive). Banner insistente si pasaron >30 días con cambios.

## 6. Renders por fase

- **Render 0** (Fase 0): mockups estáticos HTML de 5 vistas (home/recetario mobile, detalle mobile, cocción mobile, planificador desktop y mobile) con estética e íconos. Throwaway: no es código de la app.
- **Fases 1-4**: screenshots reales de la app corriendo (Playwright, 390 px y 1280 px) generados por `npm run renders` / skill `/renders`, publicados como Artifact para revisión conjunta al cierre de cada fase.
