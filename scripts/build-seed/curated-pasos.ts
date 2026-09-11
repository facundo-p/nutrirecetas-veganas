/**
 * T13 — En qué paso entra cada línea de ingrediente (#163). Lo leyó un agente
 * por receta sobre las líneas y los pasos ya curados (T9), y se revisó contra
 * el matcher de nombres: lo que el agente ubicaba después del primer paso que
 * nombra al ingrediente se miró a mano.
 *
 * Una posición por línea, en el orden de la receta: el número de paso como se
 * lee (desde 1), o null para lo que no entra en ningún paso —lo que decora o
 * va al lado sin que un paso lo diga—. Un imprescindible nunca es null.
 */
export const PASO_DE_CADA_LINEA: Record<string, ReadonlyArray<number | null>> = {
  r01: [4, 1, 1, 2, 3, 2, 2, 4, 1, 6, 6], // Sopa de lentejas rojas al estilo turco
  r02: [5, 2, 3, 3, 3, 3, 3, 4, 5, 6, 7, 1], // Curry de garbanzos y espinaca
  r03: [1, 1, 2, 2, 2, 4, 5, 5], // Hummus cremoso técnica Zahav
  r04: [4, 4, 1, 1, 1, 2, 2, 4, 3, 6, 4, 6, 7], // Boloñesa de lentejas y nueces
  r05: [1, 4, 5, 4, 2, 2, 2, 4], // Tofu revuelto (scramble)
  r06: [1, 5, 5, 3, 5, 5, 2, 5], // Hamburguesas de porotos negros
  r07: [3, 2, 2, 2, 1, 5, 4, 4, 4, 6], // Bowl de quinoa con garbanzos crocantes y salsa de tahini
  r08: [1, 3, 2, 3, 4, 5, 6], // Sopa crema de calabaza asada
  r09: [3, 1, 1, 1, 3, 4, 4, 4, 2, 5, 3, 3, 3, 4, 7], // Guiso de lentejas argentino (veganizado)
  r10: [1, 1, 2, 2, 5, 1], // Budín de chía y avena nocturno
  r11: [2, 4, 7, 5, 5, 5, 3, 5, 5, 1], // Salteado de tofu y brócoli al sésamo con arroz integral
  r12: [1, 1, 4, 3, 5, 4, 4], // Ensalada de kale masajeado, garbanzos y naranja
  r13: [5, 1, 2, 2, 4, 4, 4, 8, 8], // Rolls de nori con palta, pepino y arroz
  r14: [4, 2, 2, 2, 2, 2, 3, 1], // Fideos al pesto de albahaca y nueces con tomates asados
  r15: [3, 3, 1, 1, 1, 3, 2, 2, 3, 3, 3, 6], // Chili sin carne con cacao
  r16: [1, 1, 1, 1, 6, 2, 2, 2, 3], // Omelette de harina de garbanzo con verduras
  r17: [3, 5, 1, 1, 1, 2, 2, 3, 1, 5, 6], // Guiso toscano de alubias y kale
  r18: [1, 1, 5, 5, 6, 6, 1, 6, 8, 4], // Dal de lentejas turcas con tadka
  r19: [1, 3, 3, 4, 4, 5, 5, 4], // Tabule de quinoa con menta
  r20: [1, 6, 2, 5, 3, 3, 6, 6, 2, 6], // Arroz integral salteado con edamame, champiñones y maní
  d01: [2, 3, 3, 3, 1, 3, 3, 3, 4], // Brownies de porotos negros
  d02: [1, 2, 2, 2, 2], // Galletitas de banana y avena
  d03: [2, 2, 1, 2, 2, 2, 4, 6], // Mousse de chocolate y palta
  d04: [2, 3, 2, 2, 1, 3, 3, 3, 5, 5], // Budín de banana integral
  d05: [1, 2, 3, 2, 3, 4, 3], // Bolitas de dátiles, cacao y maní
  d06: [1, 1, 1, 1, 2, 2, 2, 1, 2], // Crumble de manzana y avena
  d07: [1, 3, 4, 4, 4], // Helado de banana (nice cream)
  d08: [1, 1, 3, 1, 1, 4, 5], // Arroz con leche vegetal y canela
  d09: [3, 1, 1, 1, 2, 5], // Budín de chía al cacao
  d10: [2, 4, 3, 3, 1, 1, 2, 4, 4, 4, 5, 5], // Muffins integrales de zanahoria y nueces
  r21: [1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 5, 6], // Milanesas de tofu al horno
  r22: [4, 2, 1, 2, 2, 3, 3, 3, 4, 1, 6, 7, 7, 7, 1, 1], // Tacos de lentejas con palta y crema de limón
  r23: [3, 1, 2, 2, 2, 2, 2, 2, 3, 1, 6, 5, 5, 5, 5, 1], // Burritos de porotos negros con arroz al limón
  r24: [1, 2, 2, 2, 2, 2, 2, 2, 2, 4, 5, 5, 5, 5, 5, 5, 7, 7, 7], // Ensalada mediterránea con tofu marinado al horno
  r25: [3, 1, 1, 1, 1, 1, 1, 2, 2, 2, 4, 2, 4, 4, 6, 6, 6, 6, 6], // Ensalada tibia de quinoa, garbanzos y verduras asadas
  r26: [1, 5, 2, 2, 2, 2, 3, 3, 3, 5, 5, 4, 4, 4, 5, 7, 8, 8, 8, 8], // Guiso de quinoa con verduras y garbanzos
  r27: [1, 5, 3, 3, 3, 3, 2, 5, 4, 4, 4, 4, 4, 4, 4, 6, 6], // Ensalada de arroz integral, lentejas y aliño cítrico
  r28: [1, 1, 6, 2, 2, 2, 2, 2, 3, 3, 7, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 7], // Ensalada de cuscús con verduras, hierbas y pasas
  r29: [1, 4, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 4, 4], // Ensalada de garbanzos, palta y tomate con aliño de comino
  p01: [1, 1, 7, 7], // Leche de soja casera
};
