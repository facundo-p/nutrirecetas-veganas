# Changelog

Qué cambió en cada versión de Nutrirecetas Veganas, contado desde lo que se ve al
usarla. Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

El criterio para decidir qué número sube está en `CLAUDE.md`.

## [No publicado]

Lo que está en `staging` y todavía no salió en un release.

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
