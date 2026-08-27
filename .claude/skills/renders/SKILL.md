---
name: renders
description: Genera los screenshots reales de la app (390 px y 1280 px, en los tres temas) para revisión de Facu y los publica como Artifact. Usar al cierre de cada fase o cuando Facu pida ver la app.
---

# /renders — screenshots reales para revisión

1. **Build al día**: `npm run build` (regenera la semilla y falla si algo está roto — no seguir si falla).

2. **Elegir el nombre de la tanda y comprobar que esté libre**: `ls docs/renders/`. Si
   `fase-N-tema-*` ya existe, **no generar encima**: las rutas cambian entre fases, así que
   los PNG viejos que ya no tienen ruta se quedan sueltos y la carpeta queda con dos tandas
   mezcladas. Renombrar la vieja a lo que realmente fue (pasó con `fase-3`, que era la tanda
   de estética del 25/08) o usar un nombre nuevo.

3. **Generar los tres temas**:

   ```bash
   for t in d c a; do npm run renders -- fase-N --tema=$t; done
   ```

   Deja `docs/renders/fase-N-tema-{a,c,d}/`, un PNG por ruta y viewport
   (`{ruta}--mobile-390.png`, `{ruta}--desktop-1280.png`). Si el cambio es puramente
   funcional alcanza con el tema activo (**D**); si toca algo visual, van los tres.

4. **Si el script falla, casi siempre es él y no la app.** Dos formas conocidas:
   - *"El sembrado de datos de demo no llegó"*: el guard busca un texto de una pantalla que
     puede haber cambiado de nombre o dejado de existir. Está en `scripts/renders.mjs`.
   - **`user_schema_version` del sembrado desactualizado**: si quedó atrás, el aviso de
     migración sale en las 78 capturas. Tiene que igualar el del código.

   `RUTAS` también se desactualiza: cuando una fase agrega o borra pantallas, hay que tocarlo.

5. **Mirar los PNG, no asumir.** Es control de calidad, no documentación: en la Fase 3
   encontró un problema de seguridad que ningún test podía fallar. Qué mirar:
   - **Números que afirman más de lo que el dato sostiene.** Un porcentaje grande al lado de
     una cobertura chica, un punto medio sin su banda, un valor que salió de un ingrediente
     que puede no tenerlo. Si un número tranquiliza, verificar el intervalo.
   - **Repeticiones que el código no ve.** Tres recomendaciones con el mismo argumento son
     una sola, aunque el código haya variado lo que prometía variar.
   - **Texto mal armado**: artículos y géneros ("el 20 % del proteína"), unidades pegadas al
     número equivocado, nombres que desbordan.
   - **A 390 px**: nada cortado, ningún anillo de foco comido, y lo importante arriba.
   - Tipografías y fondo correctos por tema (**Vollkorn** en el A, **Fraunces** en C y D;
     Schibsted para datos en los tres).

   **Medir en píxeles CSS, no en los del PNG**: se generan con `deviceScaleFactor: 2`, así
   que el archivo es del doble. Confundirlos hace abrir issues falsos.

6. **Lo que aparezca se abre como issue** antes de publicar, con el label que corresponda.
   Si toca un invariante, se arregla **antes** del release, no después.

7. **Publicar el Artifact** con todas las capturas embebidas, agrupadas por pantalla, mobile
   y desktop lado a lado, y una nota corta de qué cambió. Título estable por fase.

8. **Pasarle el link a Facu** y pedir revisión explícita. Los renders son el checkpoint de
   cierre: sin su OK no se cierra la fase.

## Reglas

- Los renders se commitean en `docs/renders/` (son parte de la historia del proyecto). Son
  ~33 MB por tema: el push tarda, no es que se colgó.
- Si una pantalla se ve mal, arreglar y **regenerar**: jamás publicar renders rotos "para
  mostrar avance". Y si se arregló algo después de generarlos, los renders quedaron viejos.
- **Para verificar que un refactor no cambió nada**, esto es la única red: baseline antes,
  `cmp` archivo por archivo después. Va en un PR aparte del que cambia lo visual — mezclados,
  el diff no puede probar nada.
