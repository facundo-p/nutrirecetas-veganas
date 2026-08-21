# Recetario personal — Estandarización e integración (Set P)

**Versión:** 1.0 — Agosto 2026 · **Origen:** Google Doc personal de Facu (45 preparaciones)
**Estatus especial:** todas probadas y aprobadas por el usuario → entran con **estado `probada` y confianza 8** — la más alta del recetario para el paladar del dueño de la app (más que cualquier fuente externa). Las marcadas ⭐ son candidatas a `clásica` (confirmar cuáles son las de cabecera).

## Decisiones tomadas (revisar y objetar lo que no cierre)

1. **Nueva categoría `preparado`:** leches, quesos, manteca, masas y rellenos no son platos sino **componentes reutilizables**. Se modelan como recetas con `tipo: "preparado"` y otras recetas los referencian como ingrediente (`ref_receta`). Esto habilita la cadena más linda del recetario: **leche de soja → su bagazo (okara) → milanesas de soja**: residuo cero, dos recetas de un poroto.
2. **Sistema de variantes (`variante_de`):** 10 recetas tuyas se superponen con existentes y quedaron enlazadas, no duplicadas: guiso de lentejas→R09 · sushi→R13 · burgers aduki y de texturizada→familia R06 · budín de banana→D04 · carrot cake→D10 · brownies (×3)→D01 · arroz con leche de coco→D08 · crumble→D06 · pudding de chía→D09. En la app: una receta "madre" con pestañas de variantes.
3. **⚠️ Crema de vainilegumbres llevaba MIEL** (no vegana). La cargué con el reemplazo que tu propia receta habilita ("el endulzante que prefieras"): puré de dátiles o miel de caña. Único ajuste de este tipo en todo el doc.
4. **Pastafrola, lemonies, torta de coco:** van como están, sincerados como `indulgente: true` — son repostería clásica con azúcar y harina blanca, y está perfecto que existan. La app no debe disfrazarlos de saludables ni castigarlos.
5. **Picada vegana:** no es una receta sino un armado. La modelé como `tipo: "combo"` con componentes que referencian otras recetas (hummus R03, garbanzos crocantes de R07, seitán P08, queso de maní P04...). 
6. **NO cargué el "Pan de molde integral proteico"** (el último): el texto llegó cortado en el doc, es fuente externa (hazlovegan.com, citada), y pide ingredientes de especialidad (malta, proteína aislada, inulina). Si lo hacés seguido, avisame y lo completo desde la fuente.
7. **Seguridad alimentaria validada a favor tuyo:** tu leche de soja hierve 40-45 min — correcto y necesario (inactiva los inhibidores de tripsina de la soja cruda; muchas recetas de internet lo omiten). Lo dejé documentado como regla, no como casualidad.

## Ingredientes nuevos → base v1.3 (24)

Gluten de trigo (¡seitán casero!), fécula de mandioca, mandioca, maíz blanco pisado, porotos pallares, porotos aduki, hongos secos, lecitina de soja, agar-agar, dulce de membrillo, durazno en almíbar, mayonesa vegana, harina leudante (fortificada por ley), sémola, harina de maíz blanca (paraguaya), levadura fresca, masa madre, provenzal, nibs de cacao, azúcar impalpable, margarina (con nota: preferir tu manteca casera P03), alcaparras, semillas de amapola, zapallito redondo.

---

## Fichas (estandarización + magias)

### PREPARADOS

**P01 · Leche de soja casera** ⭐ — 250 g porotos secos + 2,15 L agua → ~1,8 L. Remojo 10-12 h, licuar en 2 tandas con 325 ml c/u, hervir destapada 40-45 min espumando. **Regla de seguridad: el hervor largo es obligatorio** (soja cruda = antinutrientes). *Magia sugerida:* pizca de sal y vainilla al final; para "barista", 1 cdta de aceite neutro licuado en caliente. **El bagazo (okara) alimenta P10** — guardalo (heladera 3 días / freezer 3 meses). Nutrición: prot ~3 g/100 ml, sin calcio (la comprada fortificada sigue ganando en calcio: usar según objetivo).

**P02 · Leche de coco casera** — 1 taza coco rallado + 2 tazas agua caliente (1 para concentrada), licuar fuerte, reposo 5', filtrar. *Magia:* el bagazo → galletitas D02. La capa de crema que separa en heladera = crema de coco para D-recetas.

**P03 · Manteca vegana** ⭐ — La emulsión: leche de soja/almendras cortada con vinagre de manzana (¡tiene que ser de esas leches para cuajar!) + aceite de coco ½ taza + lecitina (el estabilizante real). Tu tip de ⅓ de girasol para untabilidad quedó como variante oficial. *Magia:* la levadura nutricional opcional acá no es detalle — suma B (y B12 si tu marca está fortificada).

**P04 · Queso de maní (muzza de maní)** — leche de maní casera cuajada con limón+vinagre y ligada con fécula de mandioca (4 cdas + 4 de agua). Rinde tipo muzzarella fundente. Referenciado por P19 (pastel de papas).

**P05 · Quesofu (untable/dip de tofu)** — tofu + levadura + limón + fécula, cocido hasta espesar. El más rápido y el más proteico de tus quesos.

**P06 · Queso de papa (paparella)** — papa + fécula de mandioca (la elasticidad) + levadura, procesado caliente y cocido revolviendo hasta elástico. Para pizza: horno fuerte 220-250°. *Estandaricé:* 2 papas medianas = 300-350 g; ½ taza agua de cocción.

**P07 · Masa integral para tartas** — 1 taza integral + ½ común + 3 cdas semillas + 3 cdas oliva + ½ taza agua. Base de P22. *Magia:* las semillas van mejor molidas gruesas (lino entero pasa de largo — regla R9).

### SALADAS

**P08 · Bifecitos de seitán** ⭐ — gluten 250 g : harina integral/pan rallado 125 g (2:1) + 10 cdas salsa de soja, hervido 40' en caldo con soja. *Magia que ya sabías sin saberlo:* tu proporción 2:1 y el hervor suave son exactamente la técnica del seitán tierno. Sellarlo vuelta y vuelta al servir (Maillard). Nutrición: ~23 g prot/100 g — el campeón proteico del recetario.

**P09 · Guiso de lentejas (versión liviana licuada)** → `variante_de R09`. Tu diferencial: las verduras se hierven y **se licúan como base**, sin sofrito en aceite — guiso bajo en grasa con caldo-crema. Estandaricé: 150 g lentejas secas, 450 g papa, 2 porciones. *Nota técnica:* tu remojo de 8 h a las lentejas no es obligatorio (cocinan bien sin él) pero sí reduce fitatos (regla R4) — lo dejé como "recomendado".

**P10 · Milanesas de soja (de okara)** ⭐ — el bagazo de P01 (300 g) + avena 125 g + harina de maíz 125 g + provenzal, formadas, **congeladas ANTES de empanar** (tu técnica, y es la correcta: sólidas se rebozan sin romperse). Doble freezado = milanesa lista para siempre. Residuo cero.

**P11 · Picada vegana** → `tipo: combo`. Componentes propios (P04, P08 salteado, hummus R03, garbanzos crocantes de R07, crudités, berenjenas en escabeche...). La app puede armarla como checklist.

**P12 · Curry de garbanzos y seitán con durazno en almíbar** — tu rareza golosa (fuente citada: Directo al Paladar / Jack Monroe). Estandaricé lata de durazno = 400 g. *Magia:* el almíbar entra DE A POCO al final para regular dulzor; el seitán (P08) en cubos absorbe el curry. Dispara R8 si lleva cúrcuma+pimienta (la lleva).

**P13 · Coliflor en adobo filipino** — dorado fuerte de gajos + braseado 30' en vinagre:soja:azúcar (125:75:5) con ajos enteros y laurel. Tu nota "queda balanceada la salsa" es la gracia del adobo: agridulce-salado-ácido. Servir con arroz yamaní + garbanzos como hiciste = plato completo (cereal+legumbre).

**P14 · Sopa crema de garbanzo, espinaca y manzana** — licuado directo de cocidos: garbanzos 2 tazas + espinaca cruda + manzana roja + aquafaba caliente. Sin cocción extra. *Magia:* la manzana hace de "crema dulce" contra el amargor de la espinaca; un toque de comino y limón la redondea (R1 de paso).

**P15 · Ñoquis de calabaza con crema de frutos secos** — calabaza asada (no hervida: menos agua = menos harina) + papa + ~700 g harina "según humedad". *Magia clave que estandaricé:* la MENOR harina posible en la masa, la forma se da con la harina de la mesada — tal cual lo escribiste, es la regla de oro del ñoqui tierno. Salsa: frutos secos remojados 4 h licuados + sofrito. Congelan crudos.

**P16 · Relleno de soja texturizada y hongos** → `tipo: preparado`. El agua de remojo de los hongos vuelve al final = umami líquido (técnica seria). Alimenta tartas, empanadas, canelones.

**P17 · Hamburguesas de texturizada y remolacha** → `familia hamburguesas` (con R06 y P21). Tu diferencial: remolacha y papa cruda ralladas (jugosidad + color "meat"). Tu técnica de freezar y cocinar congeladas = la anti-desarme. 15 unidades: batch total.

**P18 · Sushi (técnica de arroz maestra)** → `variante_de R13`. Tu receta es SUPERIOR en la técnica del arroz a la del set 2 (11' mínimo + 15" fuerte + 10' reposo sin destapar; sushizu 80/20 alcohol/manzana): **la promoví a técnica oficial de la familia sushi**. R13 queda como armado simple; P18 manda en el arroz.

**P19 · Pastel de papas** ⭐ — puré + relleno de texturizada (P16 simplificado) + **capa de queso de maní P04** al medio. El limón al final del relleno es tu firma (R1, además). Gratinar fuerte. Frío corta perfecto — mejor al día siguiente, como todo lo grande.

**P20 · Locro vegano** ⭐⭐ — LA joya patria del recetario: maíz blanco + pallares (remojo 24 h), zapallo que se deshace, y la **salsita picante de verdeo+pimentón+ají con seitán** aparte. Tu truco del puñado de algas o bicarbonato en la cocción (ablanda + el alga suma yodo/umami) quedó documentado. Estandaricé: 5 porciones, cocción total ~2 h. Único plato del recetario con maíz blanco y pallares: ya están en la base.

**P21 · Burgers de aduki** → `variante_de R06`. El aduki (dulzón, cocción más corta que porotos) + tu pisado parcial + reposo 20-30' en frío. Ya venía con "secretos gourmet" escritos (pimentón ahumado = parrilla): coincidís con el estándar del set 1 sin haberlo leído.

**P22 · Tarta de zapallitos, zanahoria y tofu** — usa masa P07. El tofu desmenuzado + levadura + fécula = "ricota" (¡la técnica que buscábamos del libro, ya la tenías!). Tu tip de licuar la mitad del relleno para cremosidad quedó como variante.

**P23 · Vitel toné vegano de seitán** ⭐⭐ — la receta más técnica del documento y una joya de fiesta: seitán "peceto" (gluten:harina 2:1, amasado 2' MAX, cocción 60' SIN hervir, enfriado en el caldo, 6-12 h de frío) + salsa tonnata (mayo vegana + tofu + alcaparras + mostaza; el miso/nori opcional es el "microdetalle marino" — gran instinto). El reposo de 6-24 h armado es la clave y quedó como regla. Diciembre resuelto.

**P24 · Ensalada de hojas, rabanito y manzana** — fresca simple; estandaricé cantidades orientativas. *Magia:* las semillas de sésamo tostadas en seco al momento.

**P25 · Ensalada de banana y remolacha** — la curiosa del doc: remolacha + banana pisada + limón + comino. La cargué tal cual (probada por vos manda). *Nota:* funciona porque es dulce-terroso-ácido, primo del "beet-banana bowl" nórdico. Folato + potasio.

### DULCES

**P26 · Crema chocoporotos** ⭐ → `tipo: preparado`. Legumbre + cacao + endulzante + aceite de coco, licuada caliente. 10 días de heladera. Alimenta P34 y sirve de "nutella" honesta. Familia con D03 (mousse de palta).

**P27 · Crema de vainilegumbres** → **ajustada a vegana** (miel → dátiles/miel de caña, ver decisión 3). Base de P39.

**P28 · Panqueques de avena y banana** — 3 ingredientes licuados. El desayuno más simple del recetario. *Magia:* dejar reposar la mezcla 5' (la avena hidrata y no se rompen al dar vuelta).

**P29 · Budín de banana clásico** → `variante_de D04` (esta es la versión "domingo": azúcar entera y harina leudante; D04 es la integral). Ambas conviven: la app muestra la familia.

**P30 · Carrot cake liviana** → `variante_de D10` — sin aceite casi (1 cda de coco), con harina de avena. Tu crema de coco montada del reposo de 12-24 h en heladera es técnica pro (whipped coconut cream) y quedó documentada.

**P31 · Pastafrola** ⭐ — `indulgente` y gloriosa: TU manteca vegana P03 en la masa (encadenamiento de preparados). Membrillo aflojado con agua caliente para esparcir. 200° 25-30'.

**P32/P33/P34 · Familia brownies de porotos** → `variantes_de D01`: con avena (aduki), con girasol remojado (textura fudge), y sin harina desde crema P26 + banana + maní. Tres caminos al mismo lugar; la app los muestra juntos.

**P35 · Arroz con leche de coco** → `variante_de D08`. Tu técnica es distinta y mejor en un punto: **pre-hervir el arroz 10' en agua y colar** (larga almidón sin cortar la leche), leche de coco en dos tiempos (cocción + fría al final = cremosidad fresca). Promovida a técnica recomendada de la familia.

**P36 · Torta de mandioca y coco** — la exótica: mandioca cruda rallada licuada (¡sin harina de trigo, sin gluten!). Estandaricé molde 24 cm con chimenea. Única receta con mandioca: ingrediente ya en base.

**P37 · Lemonies** — `indulgente`; blondie de limón sin huevo. Tu nota de usar la masa de pastafrola como base quedó como variante.

**P38 · Bocaditos helados de banana y chocolate** — banana + cacao + aceite de coco al freezer; primo del nice cream D07 (quedaron enlazados como familia "banana congelada"). El aceite de coco es lo que les da la mordida de bombón helado.

**P39 · Crumble de manzana con crema de vainiporotos** → `variante_de D06`, versión patissier: masa sablée (con manteca P03) + manzana + crema P27 + crumble. Tres preparados encadenados en un postre — el mejor ejemplo del sistema de componentes funcionando.

**P40 · Pudding de chía y chocolate** → `variante_de D09` (casi idéntica; quedó como variante con tus toppings).

**P41 · Torta/budín de coco** — `indulgente` simple de un bowl; banana opcional documentada.

**P42 · Cuadrados de limón** — la técnica distinta: curd de limón **con agar-agar + maicena** (gelificación vegetal doble), cúrcuma para el amarillo. Base horneada a mínima + relleno cocido aparte. Único uso de agar: ingrediente ya en base.

### PANES

**P43 · Pan proteico de calabaza** — integral + harina de garbanzo 1:1 (¡legumbre en el pan: lisina + hierro fortificado de la harina AR!). Leudado 1 h. Dura 4-5 días.

**P44 · Masa de pizza (masa madre, sin amasado)** ⭐ — 500 integral + 300 común + 200 sémola, mezcla sin amasar + **noche entera de heladera** (fermentación fría = sabor + digestibilidad + menos fitatos, regla R4 aplicada a panificación). 5 bollos, freezables. Con paparella P06 encima: pizza 100% del recetario.

**P45 · Crackers de masa madre** — el destino noble del descarte de masa madre. Estirar a 2 mm, marcar cuadrícula sin cortar, horno 180-200° hasta crocante + secado con horno apagado. Duran "un montón" en frasco (confirmado por conservación: semanas).

---

## Lo que NO entró y por qué

| Ítem | Motivo |
|---|---|
| Pan de molde integral proteico | Texto cortado en el doc + fuente externa + ingredientes de especialidad (malta, proteína aislada). Avisame si lo querés y lo completo. |
| (Nada más) | Todo lo demás entró. Las 45 restantes están. |

## Síntesis

Tu recetario aporta lo que ningún set tenía: **la capa de preparados** (leches, quesos, manteca, masas — el "sistema operativo" de una cocina vegana), **las joyas argentinas** (locro, vitel toné, pastafrola, pastel de papas, ñoquis — el recetario ahora tiene identidad), **residuo cero** (okara→milanesas, bagazo de coco→galletitas, descarte de masa madre→crackers), y **dos técnicas que destronan a las existentes** (tu arroz de sushi y tu arroz con leche pasan a ser las oficiales de sus familias).
