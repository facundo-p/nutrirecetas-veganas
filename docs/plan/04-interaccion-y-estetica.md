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

## 3. Estética: propuestas registradas (decisión pendiente del checkpoint de Fase 0)

Historial de iteraciones del Render 0 ([artifact](https://claude.ai/code/artifact/b25c5547-deb5-430c-b227-b2f1791b6525)):

- **Iteración 1** → Propuesta A (Botánica editorial). Facu la valoró como viable pero pidió más personalidad y notó que la paleta desaturada coincidía con otra app suya de huerta.
- **Iteración 2** → Propuesta B (Tinta fresca): saturación plena + estructura de imprenta. Veredicto de Facu: carácter sí, dirección no — quería algo **sofisticado/elegante/gourmet**; rechazó los contornos negros gruesos y prefirió las tipografías de A. De la B sobrevive la idea central: **los colores de la app son los colores de las verduras**.
- **Iteración 3** → **Propuesta C (Carta de estación)**, la candidata actual: brief de Facu "tan hermosa como un plato vegano colorido y saludable, sin sobresaturar".

### Reglas comunes a cualquier propuesta (anti-look-IA, pedido explícito de Facu)

1. **Prohibido el reborde lateral de acento en tarjetas** — es el "tell" clásico de UI generada. El tipo de receta lo comunica el ícono.
2. **Comprometerse con un mundo de color propio**, no repartir colores "de buen gusto" en partes iguales.
3. **Firmas de dominio propias**: semáforo-hoja, bandas de incertidumbre, brotes de IC — elementos que ningún template trae.
4. **Tipografía con opinión**: nada de Inter/Roboto/Space Grotesk como default.
5. **Cero emoji como íconos, cero gradientes decorativos**; jerarquía derivada del uso real.
6. El semáforo **nunca comunica solo con color**: siempre ícono + texto.
7. Tipografías self-hosted (offline). Modo cocina: contraste reforzado y cuerpo tipográfico +2 escalas.

### Propuesta A — "Botánica editorial" (registrada, viable)

Cálida y seria; los datos respiran porque el fondo es calmo. Fraunces (serif display) + Schibsted Grotesk (datos).

| Token | Valor | Uso |
|---|---|---|
| `--papel` | `#F6F1E5` | fondo (crema papel) |
| `--tinta` | `#2C2A22` | texto principal |
| `--oliva` | `#6B7A45` | acento primario |
| `--salvia` | `#9BAA88` | bordes suaves, tags |
| `--terracota` | `#BE5B35` | acción |
| `--verde-profundo` | `#37502F` | headers |
| Semáforo | `#4C7C4A` / `#C98F2E` / `#B0492F` | cubierto / parcial / insuficiente |
| Suplemento / sin datos | `#5B7A9E` / `#8F8A7E` | estados especiales |

Estructura: tarjetas crema con borde fino, sombra apenas presente, radios generosos. Ilustración botánica de línea fina como ornamento.

### Propuesta C — "Carta de estación" (candidata actual, gourmet)

Sofisticada como la carta de un restaurante de estación. Base de A (papel ocre, Fraunces + Schibsted Grotesk, bordes finos — **confirmados por Facu**) + sistema de colores-verdura. Regla que ordena el color: **cada verdura tiene un rol, y cada rol tiene su verdura** — en una pantalla cualquiera dominan ocre y tinta, y el color aparece solo donde significa algo.

Tokens vigentes (iteración 4: saturación +1 pedida por Facu, papel calibrado al crema de su imagen de fondo):

| Token | Valor | Verdura / rol |
|---|---|---|
| `--papel` | `#F5EFDC` | fondo ocre (calibrado a la imagen de fondo) |
| `--tofu` | `#FDFAF0` | superficie de tarjetas |
| `--tinta` | `#2C2A22` | texto |
| `--espinaca` | `#427A3A` | identidad, marca, etiquetas de sección |
| `--zanahoria` | `#D06A24` | **acción** (botones, énfasis, nav activa) |
| `--zapallito` | `#47903F` | semáforo: cubierto |
| `--garbanzo` | `#D1942C` | semáforo: parcial |
| `--rabanito` | `#CF3D4D` | semáforo: insuficiente / dulce |
| `--repollo-colorado` | `#85477F` | cubierto por suplemento (reemplaza el azul genérico) |
| `--chia` | `#75787D` | sin datos |
| `--lechuga` | `#A5C179` | tags y bordes suaves |
| `--soja` | `#AB7442` | preparados |

**Fondo**: ilustración de verduras provista por Facu (línea sobre crema, generada con Gemini), guardada como asset maestro en `docs/assets/fondo-verduras.png` (1536×2752). Se aplica en todas las pantallas con `background-size: cover` y un **velo de papel al 38 %** encima para que el contenido respire; la app deberá servir versiones optimizadas (WebP/AVIF comprimidas) desde el build.

Elementos distintivos: puntos de guía tipo carta de restaurante entre ingrediente y cantidad; filetes dobles de menú impreso; cifras clave en itálica serif zanahoria; íconos de tipo de receta coloreados por verdura; píldoras del semáforo teñidas con su propio color (`color-mix`). Sin contornos gruesos, sin sombras duras (rechazados de B).

### Propuesta B — "Tinta fresca" (registrada, dirección descartada por Facu)

Colores de verdulería real a plena saturación sobre blanco verdoso; estructura de imprenta. Bricolage Grotesque (display) + Archivo (datos; fundición porteña Omnibus-Type).

| Token | Valor | Uso |
|---|---|---|
| `--fondo` | `#F3F7EA` | fondo (blanco verdoso) |
| `--tinta` | `#16231B` | texto y contornos (verde-negra) |
| `--clorofila` | `#2C9C43` | acento primario |
| `--verde-profundo` | `#17572A` | navegación activa, timers |
| `--remolacha` | `#C21E56` | acción |
| `--limon` | `#F6E74A` | resaltador de números clave, tags activos |
| Semáforo | `#23913B` / `#E9A00F` / `#D64524` | cubierto / parcial / insuficiente |
| Suplemento / sin datos | `#3B6FD1` / `#7E8878` | estados especiales |

Estructura: tarjetas blancas con **contorno de tinta 1.5 px + sombra dura desplazada** (etiqueta impresa), esquinas contenidas (8–10 px), chips como sellos en mayúsculas, **resaltador limón** sobre los números que importan (kcal, punto clave del paso). Íconos con trazo 2 px (vs 1.7 en A).

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
