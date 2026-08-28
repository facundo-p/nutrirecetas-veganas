---
name: agregar-receta
description: Cómo se agrega o corrige una receta del recetario, y el criterio aprobado para escribir sus pasos. Usar cuando Facu pide una receta nueva, o tocar ingredientes, pasos o secretos de una existente.
---

# /agregar-receta — recetas nuevas y pasos bien escritos

## Dónde vive cada cosa

- `.artifacts/` es **read-only**: ninguna receta se toca ahí.
- Corregir una receta existente (porciones, líneas, pasos) = entrada en la tabla curada que corresponda en `scripts/build-seed/curated-tables.ts`. Los pasos van en **T9 (`CURATED_STEPS`)**.
- **Agregar una receta nueva a la semilla no tiene mecanismo todavía** (la carga de recetas propias es de Fase 5, issue #17). Si Facu pide una hoy, el camino es diseñar la tabla curada de altas primero — no improvisar un JSON en `.artifacts/`.

## El criterio de pasos (aprobado por Facu, 2026-08-27)

Vale para toda receta, nueva o corregida:

1. Oración completa en rioplatense, con voseo. Nada de `;` y `+` como pegamento.
2. Cada paso dice qué entra, dónde, a qué fuego y **cuál es la señal** para pasar al siguiente ("hasta que se deshacen solas"), no solo el minutaje.
3. Todo ingrediente `imprescindible` aparece en algún paso, con su cantidad dicha con naturalidad ("los 400 g de garbanzos cocidos"). Los opcionales se marcan: "si la usás".
4. El acompañamiento tiene su propio paso o se declara al principio.
5. Los `secretos_chef` no se absorben: se muestran aparte en la app, y copiarlos en un paso hace leer lo mismo dos veces.
6. 4 a 8 pasos (mínimo absoluto 3, solo para recetas genuinamente triviales). Antes que apilar tres acciones en uno, se parte.
7. Se conserva el énfasis útil del original (A MANO, EN CALIENTE, TENEDOR) y la voz del recetario: si hay un chiste, sobrevive.
8. **Sin códigos del dataset en los pasos**: ni reglas (R8) ni ids de recetas (P04). El porqué se dice con palabras; otra receta se nombra por su nombre.
9. **Sin ingredientes fantasma**: si no está en la lista de la receta, no aparece en los pasos (pasó con un "ají" en el dal). Excepción: despensa básica (agua, sal, pimienta, aceite de sofreír).
10. Las correcciones de contenido (tiempos contradictorios, ingrediente fantasma) van al campo `nota` de la entrada, que **no llega a la app**: es documentación del build y material del gate.

## La entrada T9

```ts
r99: {
  base: 'de dónde salió cada cosa (prosa del .md, funcion de las líneas, técnica estándar)',
  flag_gate: true, // siempre que se sume técnica que el dataset no declara
  nota: 'solo si hubo corrección de contenido',
  pasos: ['…'],
},
```

## Verificación

`npm test` corre los tests de T9 (`transform.test.ts`): cobertura de las 84, largo mínimo, imprescindibles nombrados, secretos no repetidos (ventana de 6 palabras), sin códigos. Si un paso viola algo, el test nombra la receta y el paso.

Toda entrada con `flag_gate: true` se lista en el gate de datos de la fase para que Facu la valide cocinando (`docs/decisiones-de-datos.md` § 8).
