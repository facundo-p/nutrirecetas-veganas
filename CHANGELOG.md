# Changelog

Qué cambió en cada versión de Nutrirecetas Veganas, contado desde lo que se ve al
usarla. Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

El criterio para decidir qué número sube está en `CLAUDE.md`.

## [No publicado]

Lo que está en `staging` y todavía no salió en un release.

## [0.6.0] — 2026-09-03

Dos temas nuevos en lugar de los tres viejos, y el primero oscuro. **Mercado** es
el que abre: papel claro, encabezado de pantalla pleno en verde y un sello de
color por categoría en cada receta. **Pizarra** es la carta de noche, con los
verdes y ocres levantados para que rindan sobre fondo hondo.

No hay nada que hacer antes de actualizar. Si tenías elegido alguno de los temas
que se van, la app abre en Mercado y podés cambiar a Pizarra en Ajustes.

### Agregado

- **Tema Mercado**, el nuevo default: el color deja la tipografía y pasa a la
  superficie. (#129)
- **Tema Pizarra**, el primer tema oscuro de la app. (#129)

### Cambiado

- **La tarjeta de cada receta dice su categoría dos veces**: una banda a la
  izquierda con el ícono de tipo, y un sello arriba a la derecha. El relleno lo
  lleva una sola —en Mercado la banda, en Pizarra el sello—, porque con las dos
  llenas la tarjeta grita. (#129, #134)
- **El buscador y los filtros quedaron arriba de "Qué cocinar"**: quien viene a
  buscar algo puntual ya no pasa por encima de la sugerencia. (#129)
- **Las calorías por porción tienen bloque propio** en la ficha de la receta,
  arriba del aviso de B12, en vez de estar mezcladas en la fila de datos. (#129)
- **Los pasos se numeran con un disco**, que cocinando se encuentra de un
  vistazo. (#129)
- **"IC 8" ahora dice "confianza 8 de 10"**, en los seis lugares donde aparecía.
  Tres de ellos lo mostraban solo con los brotes y un cartelito al pasar el
  mouse, que en el celular no existe. (#129)

### Quitado

- **Los temas Botánica editorial, Carta de estación y El color dice de qué se
  trata**, y con ellos la ilustración de fondo. (#128, #129)

## [0.5.0] — 2026-09-01

**Esta versión borra datos.** Se van los registros de porciones comidas, las
sobras, y los suplementos y objetivos a mano de tu perfil. Tus cocciones, tus
notas, tus favoritas y el resto del perfil quedan enteros. Si querés conservar lo
que se va, exportá desde Ajustes **antes** de actualizar. La app te lo avisa al
abrirla, pero para entonces ya no se puede exportar.

Es el giro que cierra la Fase 3: la app deja de ser un régimen que se lleva y
pasa a ser un recetario. Lo nutricional sigue entero, pero como consulta —buscar
recetas o ingredientes por nutriente, y ver cuánto aporta una porción— y nunca
más como una cuenta que haya que cerrar. El criterio que resolvió cada duda del
camino: **a quien no le interese el dato, no le tiene que estorbar.**

### Quitado

- **El semáforo y el tracking semanal.** La app no registra lo que comés ni
  evalúa cómo venís. (#90)
- **La pantalla Hoy**: la app abre en el recetario, con una franja "Qué cocinar"
  arriba. (#91)
- **Las sobras.** El diario registra cocciones y nada más: qué cocinaste, cuándo
  y cuánto rindió. (#92)
- **Los suplementos declarados y los objetivos a mano** del perfil. Queda sexo,
  nacimiento, peso y entrenamiento, y sigue siendo opcional: ninguna pantalla lo
  exige, lo bloquea ni te lo pide antes de dejarte ver una receta. Su único
  trabajo es que el porcentaje diga "de tu dosis" en vez de "de la referencia
  adulta". (#93)

### Agregado

- **Cuánto aporta una porción de tu dosis diaria.** El porcentaje va adentro de
  la nutrición de la receta, con la banda de incertidumbre a la vista. Sin perfil
  se mide contra la referencia adulta genérica, y lo dice con todas las letras:
  un porcentaje que no aclara contra qué se mide es un número sin significado.
  (#94)
- **Pantalla Nutrientes**, para el camino inverso: elegís un nutriente que te
  interesa incorporar y te muestra qué recetas y qué ingredientes lo tienen. Sin
  dato reportable no hay puesto en el ranking — el último se leería como "casi no
  tiene". (#95)
- **Cada nutriente dice qué es y por qué importa.** La ficha abre con eso y con
  el ajuste vegano antes que cualquier número: sin ese contexto, un "40 % de la
  dosis" de B12 alimentaria se lee tranquilizador. El texto sale de las fichas
  NIH ODS que el dataset ya cita. (#115)
- **La franja "Qué cocinar"** en el recetario, con tres recomendaciones y el
  porqué de cada una. El motor tiene criterios enchufables, así que sumar uno
  nuevo no toca la pantalla. (#69)
- **Ajustes se abre con un engranaje en el encabezado**, en vez de encontrarse
  solo si ya sabías que existía. (#58)

### Cambiado

- **Las recomendaciones ya no salen de un hueco nutricional**, que era el
  semáforo por otro nombre. Ahora recomiendan por lo que la receta tiene, no por
  lo que te falta. (#96)
- **La nutrición de la receta baja al final y arranca colapsada**, contando
  cuántos nutrientes no tienen dato en vez de llenar la pantalla con filas
  vacías. (#59)
- **Tema A**: tipografía Vollkorn, más cálida que la Fraunces, y el título de las
  saladas pasa de ladrillo a laurel. Las familias tipográficas ahora las declara
  el tema, no la capa de forma. (#71, #73, #74)
- Las tres skills del taller (`/cierre-fase`, `/renders`, `/agregar-receta`), los
  invariantes de `CLAUDE.md` y el gate de datos quedaron al día con lo que la
  fase cambió, y el README lleva los links a los dos entornos. (#83, #97, #118,
  #121, #87)

### Corregido

- **El recordatorio de backup se puede posponer** y dejó de pegarse arriba de
  todo. (#57)
- **Un porcentaje no se afirma si su banda toca el cero.** Podía leerse como una
  recomendación tranquilizadora sobre la B12, que es lo único que el invariante 6
  prohíbe de plano. (#106)
- **Las tres recomendaciones ya no repiten motivo**: diversificaban por tipo de
  receta y no por el porqué, así que las tres decían casi lo mismo. (#107)
- **Los filtros del recetario** dejaron de estar apretados y de comerse el anillo
  de foco. (#72)

### Datos

- **Las 84 recetas tienen instrucciones de verdad.** Las viejas no alcanzaban
  para cocinar: pasos sueltos, ingredientes imprescindibles que ningún paso
  nombraba, caldos y ajíes fantasma, tiempos que se contradecían. La reescritura
  fue también una auditoría, y lo que encontró quedó anotado receta por receta.
  (#60, #65)
- **"Proteína (lisina)" pasa a llamarse "Proteína".** El nombre venía del dataset
  y prometía una validación que no existe: se mide proteína total, ningún
  ingrediente trae lisina medida. Lo destapó la masa de pizza, 100 % trigo — el
  cereal pobre en lisina— "aportando 28 % de Proteína (lisina)". La lisina como
  limitante práctico sigue explicada en la ficha. (#123)

## [0.4.1] — 2026-08-22

Nada cambia dentro de la app: son tres arreglos del taller que la mantiene, y los
tres se habían roto en silencio.

### Cambiado

- **El tablero marca solo lo que ya está publicado.** "Hecho" mezclaba trabajo
  publicado hacía días con trabajo que seguía en `staging`: 19 issues varados y
  uno solo realmente sin publicar. Ahora `npm run tablero` mueve a **Publicado**
  lo que llegó a `main`, tiene `--seco` para ver qué haría antes de tocar nada, y
  se puede correr de nuevo sin miedo. Los PR salieron del tablero: duplicaban a
  su issue. (#54)
- **`/release` calculaba mal qué entra en el release.** Derivaba el rango con
  `git describe`, que nunca alcanza el tag del release anterior y devolvía uno
  viejo — al armar la v0.4.0 daba `v0.2.0`, así que la entrada del changelog
  habría repetido entera la de v0.3.0. Iba a fallar en todos los releases. Ahora
  el rango es `origin/main..staging`, que no depende de tags. (#51)
- **El hook que protege `main` dejó de bloquear lo legítimo.** Miraba el texto
  entero sin distinguir el comando de sus argumentos: cualquier frase que
  nombrara git y más adelante un verbo prohibido rebotaba, lo que hacía
  imposible escribir los issues de este proyecto. Y un merge con conflicto no se
  podía cerrar, aunque el mismo merge sin conflicto pasaba solo. (#42)

## [0.4.0] — 2026-08-21

Dos números que la app venía diciendo mal: cuánta proteína necesitás si entrenás,
y cuánto de cada ingrediente lleva una receta reescalada.

### Agregado

- **Niveles de entrenamiento en el perfil.** El selector de actividad topeaba en
  1,2 g/kg de proteína y mezclaba "entrenás fuerza" con "tenés más de 60" en la
  misma opción. Ahora son cuatro niveles y los dos de entrenamiento salen de la
  literatura deportiva: **1,6 g/kg** si entrenás fuerza y **2,0 g/kg** si
  entrenás intenso, contra el 1,0-1,2 que el dataset recomienda para un vegano
  promedio. A 75 kg el objetivo pasa de 90 a 150 g por día, así que esperá ver
  amarillo o rojo en proteína bastante más seguido: es información correcta, no
  un problema a maquillar. (#47)
- **La edad ya no se declara a mano.** El "+60" salió del selector porque la app
  lo sabe por tu fecha de nacimiento. Se aplica como piso y gana el más alto de
  los dos: 61 años entrenando intenso pide 2,0 g/kg, no 1,2. (#47)
- Cada nivel guarda de dónde salió su número y con cuánta confianza, y hay un
  test que no deja agregar un nivel sin fuente. El detalle está en
  `docs/decisiones-de-datos.md`. (#47)

### Corregido

- **Las cantidades al reescalar porciones.** Bajar la boloñesa de 6 a 5 porciones
  mostraba `0.8333333333333334 mediana` y `208.33333333333334 g secas`. Ahora
  cada unidad se redondea según lo que significa — peso, medida de cocina, pieza
  o cantidad a ojo — y manda la cantidad redondeada: los gramos se derivan de
  ella, así lo que leés, lo que cocinás y lo que calcula la nutrición son el
  mismo número. (#46)

### Cambiado

- Tu perfil ahora guarda el nivel elegido en vez del multiplicador numérico. La
  base local se migra sola al abrir la app, y los backups viejos siguen
  entrando: se convierten al importarlos.

## [0.3.0] — 2026-08-21

La app pasa a estar en internet: se puede usar desde el celular sin la compu
prendida, e instalarla desde el navegador.

### Agregado

- **La app publicada** en `facundo-p.github.io/nutrirecetas-veganas/app/`. Es la
  que tiene tus datos reales. Instalala desde el menú del navegador y queda como
  un ícono más; instalada, además, Safari deja de purgarte los datos por no
  usarla una semana. (#38)
- **Una versión de prueba** en `.../staging/`, con lo que todavía no se publicó.
  Usa **una base de datos aparte**: nada de lo que cargues ahí toca tu app. Se
  distingue por el nombre debajo del ícono y por una banda de aviso adentro. (#38)
- Un índice en la raíz del sitio con los links a las dos. (#25)

### Cambiado

- Las dos versiones se publican solas con cada cambio, y el publicador **verifica
  que no compartan base de datos antes de subir nada**: si esa separación se
  rompiera, el deploy falla en vez de dejar que la versión de prueba escriba
  sobre tu historial de cocciones.

## [0.2.0] — 2026-08-21

Primera versión que llega a `main`. Cierra la Fase 2: el ciclo completo de
cocinar, registrar y ver el semáforo del día.

### Agregado

- **Tu perfil de verdad**: peso, actividad y suplementos declarados. A partir de
  ahí el semáforo usa tus RDA y no un ejemplo. (#8)
- **Cocinar ahora**, el flujo completo: elegís qué va a la olla (podés desmarcar,
  sustituir o agregar, con la nutrición recalculándose en vivo y avisos cuando
  sacás algo imprescindible), seguís los pasos con tipografía grande y la
  pantalla que no se apaga, y al final registrás cuántas porciones rindió y
  cuántas comiste. El resto queda como sobras para registrar después. (#10)
- **Escalar una receta** desde el detalle, con los avisos de cuándo el escalado
  lineal deja de ser confiable. (#9)
- **Marcar favoritas, dejar notas y subirle la confianza** a una receta cuando la
  probaste y te salió bien. (#11)
- **Exportar e importar todos tus datos**, con recordatorio de backup. Es la red
  de seguridad: no hay servidor, tus datos viven solo en este dispositivo. (#12)
- **Tema A "botánica editorial"**, tercer tema elegible desde Ajustes junto a D y
  C. La preferencia queda guardada y se aplica antes de que la app pinte.

### Cambiado

- La planificación del proyecto se mudó de archivos markdown a Issues con
  sub-issues y un tablero. El trabajo entra por PR con tests y build en verde, y
  los releases se arman con `/release`. (#1)
- Los issues se cierran solos al mergear su PR, y las GitHub Actions se
  actualizaron a la versión que corre sobre Node 24. (#29, #30)
- El sistema de temas pasó a tres capas con un test de contrato: ninguna regla de
  la app puede nombrar un color. Se limpiaron 141 usos de color crudo que se
  habían acumulado sin que nadie lo notara.

### Corregido

- Un test dejaba una operación colgada que rompía la verificación automática
  según lo rápida que fuera la máquina. (#27)

### Datos

- Confirmados los dos factores veganos que el dataset declara en prosa:
  **proteína ×1.25** (1,0 g/kg en vez de 0,8, por la digestibilidad vegetal) y
  **omega-3 ×2** (3,2 g de ALA en vez de 1,6, salvo que declares un suplemento de
  EPA/DHA). Los dos multiplican tus RDA y se ven en el semáforo. (#35)

## [0.1.0] — 2026-08-19

Fase 1. Nunca llegó a `main`: queda como registro de qué había en la app cuando
se cerró esa fase.

### Agregado

- **El recetario completo, navegable sin conexión**: búsqueda por nombre,
  ingrediente o sinónimo, filtros, "rica en", y variantes agrupadas.
- **Detalle de receta con nutrición calculada en vivo** desde los ingredientes,
  no desde valores precargados: rangos como bandas, índice de confianza a la
  vista y cobertura del cálculo reportada. Cuando falta un dato, la app dice
  "sin datos" en vez de mostrar un cero.
- **Alerta de B12**: si una receta usa levadura nutricional como fuente, avisa
  que muchas marcas argentinas no están fortificadas.
- **Fichas de ingredientes y glosario**, con navegación a los preparados que una
  receta usa.
- Tres temas visuales elegibles.
