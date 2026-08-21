# Changelog

Qué cambió en cada versión de Nutrirecetas Veganas, contado desde lo que se ve al
usarla. Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

El criterio para decidir qué número sube está en `CLAUDE.md`.

## [No publicado]

Lo que está en `staging` y todavía no salió en un release.

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
