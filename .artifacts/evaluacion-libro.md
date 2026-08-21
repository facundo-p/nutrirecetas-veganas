# Evaluación: "250 Recetas Veganas Proteicas" (Vegano Gourmet)

**Fecha:** Agosto 2026 · **Método:** parseo automático del PDF y cruce contra `ingredientes-v1.1.json` (120 ingredientes)

## 1. Qué es realmente este libro

- **Contiene 99 recetas, no 250.** Están numeradas 1–99; el índice promete secciones hasta la 200 que no existen en el archivo. El título es marketing.
- **Calidad de fuente: media-baja (IC 5).** Es un recetario autoeditado sin autor identificable, sin certificación externa ni comunidad de reseñas verificable (a diferencia de Rainbow Plant Life o Minimalist Baker). Afirma que cada receta "ha sido probada múltiples veces" sin evidencia. Las recetas que sumemos de acá deberían entrar con **estado "por-probar" e IC 5**, y subir de confianza recién cuando las valides en tu cocina.
- **Registro español-neutro/peninsular:** usa "fresas", "aguacate", "frijoles", "pimiento", "sirope de arce". Al cargar, la app resuelve por sinónimos (ya están en la base).
- **A favor:** los datos nutricionales declarados ("18 g de proteína por porción") son verosímiles pero no auditados — nuestra app los recalcularía desde los ingredientes, que es más confiable que confiar en el libro.
- **Derechos:** libro con copyright. Para tu app personal, cargar recetas adaptadas está bien; no redistribuir el contenido tal cual.

## 2. Compatibilidad con nuestra base

Sobre las **29 recetas parseadas con precisión** (capítulos de desayunos, ensaladas y principales simples; el resto del PDF usa un diseño gráfico que revuelve la extracción y se evaluó por método aproximado):

| Métrica | Valor |
|---|---|
| Cobertura media con la base actual (120 ingredientes) | **85%** |
| Recetas 100% cubiertas hoy | 5 |
| Cobertura media si sumamos ~10 ingredientes nuevos | **96%** |
| Recetas que quedarían 100% cubiertas | 17 de 29 |

**Conclusión estructural: el libro es altamente compatible.** Usa el mismo universo de ingredientes que ya modelamos.

## 3. Ingredientes que el libro usa y nos faltan (por frecuencia)

| Ingrediente | Recetas | ¿Sumarlo? |
|---|---|---|
| Sirope de arce/agave | 11 | ⚠️ Caro/importado en BA. Sumar como id `sirope` con **sustituto local registrado**: miel de caña (vegana) o mascabo disuelto |
| Cilantro fresco | 6 | Sí — común en verdulerías |
| **Proteína vegetal en polvo** | 5 | **Decisión tuya:** es un suplemento, no un alimento. Alternativa: omitirlo y compensar con más legumbre/soja texturizada; la receta funciona igual con ajuste de líquido |
| Yogur vegano | 3 | Sí — hay marcas locales (coco/almendra); calcio/proteína variable por marca (IC 5) |
| Aceite de coco | 3 | Sí — fácil de conseguir; grasa saturada alta: uso puntual |
| Mostaza | 2+ | Sí — trivial |
| Tomillo / romero | 2+2 | Sí — especias básicas |
| Miso | 1 | Sí si te interesa la sopa de miso (r42): umami + fermentado; se consigue en dietéticas |
| Cuscús | 1 | Sí — trivial (es trigo) |
| Otros de 1 aparición | mango, granada, espárragos, piñones, rúcula*, seitán, shiitake, wakame, cáñamo, espirulina, cardamomo | Solo si adoptás la receta que lo usa. *Rúcula ya está en la base (falso faltante del matcher). Cáñamo/espirulina: difíciles/caros en BA, y la espirulina además arrastra el problema de análogos de B12 (ver doc nutrientes) |

## 4. Recetas recomendadas para sumar

### Grupo A — Sumar ya: 100% compatibles (o con 1 ingrediente trivial), no duplican nada nuestro

| # | Receta | Por qué suma |
|---|---|---|
| 16 | Ensalada de arroz integral con vegetales | 100% cubierta; comodín de viandas |
| 18 | Ensalada mediterránea con tofu marinado | 100%; técnica de marinado de tofu que no teníamos |
| 26 | Guiso de quinoa con verduras | 100%; guiso sin legumbre = variedad |
| 11 | Ensalada de quinoa con garbanzos y verduras asadas | 100% con sirope→mascabo |
| 37 | **Milanesas de tofu al horno** | La más valiosa del libro para un público argentino: plato-puente cultural; solo falta tomillo |
| 15 | Ensalada de garbanzos con palta y tomate | Solo falta cilantro |
| 22 | Tacos veganos de lentejas y palta | Cilantro + yogur vegano; formato nuevo (tacos) |
| 36 | Burritos integrales con porotos negros | Solo cilantro; formato nuevo |
| 20 | Ensalada de couscous | Solo cuscús (trivial) |

### Grupo B — Valiosas con 2-3 ingredientes nuevos razonables

| # | Receta | Aporta |
|---|---|---|
| 42 | Sopa de miso con edamame | ⭐ El faltante nutricional más interesante del libro: miso (fermentado/umami) + potencial wakame (yodo, segundo vector tras nuestro nori) |
| 63 | Pimientos rellenos de quinoa y champiñones | Formato relleno, no lo teníamos |
| 33 / 71 | Woks de fideos (arroz / integrales con salsa de maní) | Salsa de maní asiática = técnica nueva |
| 39 | Tofu teriyaki | Técnica de glaseado |
| 46 | Minestrone vegana | Clásico que faltaba |
| 52 | Caldo con albóndigas veganas | Técnica de albóndigas (legumbre+liga) |
| 59 / 62 / 32 | Moussaka / canelones de calabaza / lasaña de berenjena con ricotta vegana | ⭐ Familia "ricotta de tofu/almendras + bechamel vegana": dos técnicas troncales que nuestro set no tiene, desbloquean toda la pasta rellena |
| 86 | Hummus de remolacha | Variante vistosa de R03 |

### Grupo C — Descartar o postergar

- **Duplicadas con nuestro set (11):** curry de garbanzos (≈R02), tabulé (≈R19), pesto (≈R14), kale con tahini (≈R12), pudín de chía con cacao (≈D09), avena nocturna (≈R10), hummus clásico (dentro de la 2, ≈R03), bolitas energéticas (≈D05), smoothies básicos, etc. No aportan; nuestras versiones tienen mejor fuente.
- **Dependientes de proteína en polvo** (1, 4, 6, 10...): postergar hasta decidir si el suplemento entra al modelo.
- **Ingredientes difíciles en BA** (cáñamo, espirulina): postergar.

## 5. Síntesis

**Vale la pena.** No como fuente de confianza (IC 5, entra todo como "por-probar"), sino como **cantera de variedad**: ~20 recetas adoptables que agregan formatos que no teníamos (tacos/burritos, pastas rellenas con ricotta vegana, woks, milanesas de tofu, sopa de miso) con costo de apenas ~8 ingredientes nuevos, la mayoría triviales. Las dos joyas estratégicas: la **familia ricotta-bechamel vegana** (técnica troncal) y la **sopa de miso** (segundo vector de yodo + fermentados).

**Próximo paso sugerido:** decime cuáles del grupo A/B te interesan y las cargo adaptadas al esquema de la app (reescritas, con funciones, sustitutos, reglas nutricionales y utensilios — como los sets 1 y 2), más los ingredientes nuevos a la base v1.2.
