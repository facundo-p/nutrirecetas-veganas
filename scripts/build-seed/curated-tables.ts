import type { IngredientCategory } from '../../src/seed/schema';

/**
 * TODAS las decisiones de datos tomadas a mano viven acá, en un solo lugar,
 * para que Facu las revise en el gate de datos de Fase 1
 * (docs/decisiones-de-datos.md). Cada `estimada: true` es una propuesta,
 * no un dato del recetario.
 */

// ---------- T1: porciones string → número (34 recetas del set P) ----------

export interface PortionsEntry {
  /** null = sin porciones definidas: la nutrición se muestra por 100 g */
  porciones_num: number | null;
  estimada: boolean;
  base?: string;
}

export const CURATED_PORTIONS: Record<string, PortionsEntry> = {
  // preparados: su nutrición va por 100 g vía rendimiento_g
  p01: { porciones_num: null, estimada: false, base: 'preparado' },
  p02: { porciones_num: null, estimada: false, base: 'preparado' },
  p03: { porciones_num: null, estimada: false, base: 'preparado' },
  p04: { porciones_num: null, estimada: false, base: 'preparado' },
  p05: { porciones_num: null, estimada: false, base: 'preparado' },
  p06: { porciones_num: null, estimada: false, base: 'preparado' },
  p07: { porciones_num: null, estimada: false, base: 'preparado' },
  p16: { porciones_num: null, estimada: false, base: 'preparado' },
  p26: { porciones_num: null, estimada: false, base: 'preparado' },
  p27: { porciones_num: null, estimada: false, base: 'preparado' },
  // número explícito entre paréntesis = confiable
  p19: { porciones_num: 6, estimada: false, base: 'bandeja 28x22 (6 porciones)' },
  p22: { porciones_num: 6, estimada: false, base: '1 tarta mediana (6 porciones)' },
  p23: { porciones_num: 9, estimada: false, base: 'punto medio de "8-10 porciones fiesta"' },
  p31: { porciones_num: 10, estimada: false, base: 'molde 22-25 cm (10 porciones)' },
  p32: { porciones_num: 12, estimada: false, base: '1 placa (12)' },
  p33: { porciones_num: 12, estimada: false, base: '1 placa (12)' },
  p37: { porciones_num: 9, estimada: false, base: 'fuente chica (9)' },
  p39: { porciones_num: 8, estimada: false, base: 'molde 28 cm (8)' },
  p42: { porciones_num: 12, estimada: false, base: '1 placa (12)' },
  p44: { porciones_num: 5, estimada: false, base: '5 bollos (1 pizza c/u)' },
  // propuestas para revisar con Facu
  p10: { porciones_num: 4, estimada: false, base: '~8 milanesas, 2 por porción (Facu)' },
  p11: { porciones_num: null, estimada: false, base: '"libre": se muestra por 100 g (Facu)' },
  p17: { porciones_num: 3, estimada: false, base: '~15 unidades, 5 por porción (Facu)' },
  p18: { porciones_num: 3, estimada: false, base: '3 rolls, 1 por porción (Facu)' },
  p21: { porciones_num: 4, estimada: false, base: '~7 medallones, 2 por porción (Facu)' },
  p28: { porciones_num: 2, estimada: false, base: '4 panqueques, 2 por porción (Facu)' },
  p29: { porciones_num: 8, estimada: false, base: '1 budinera = 16 rodajas, 2 por porción (Facu)' },
  p30: { porciones_num: 8, estimada: false, base: '1 budinera = 16 rodajas, 2 por porción (Facu)' },
  p34: { porciones_num: 8, estimada: false, base: '1 molde chico = 8 brownies (Facu)' },
  p36: { porciones_num: 12, estimada: false, base: 'molde 24 cm = 12 porciones (Facu)' },
  p38: { porciones_num: 6, estimada: false, base: '~12 bocaditos, 2 por porción (Facu)' },
  p41: { porciones_num: 8, estimada: false, base: '1 budinera = 16 rodajas, 2 por porción (Facu)' },
  p43: { porciones_num: 8, estimada: false, base: '1 budinera = 16 rodajas, 2 por porción (Facu)' },
  p45: { porciones_num: null, estimada: false, base: '1 frasco grande: se muestra por 100 g (Facu)' },
};

// ---------- T2: rendimiento en gramos de los 11 preparados ----------

export interface YieldEntry {
  rendimiento_g: number;
  estimada: boolean;
  base: string;
}

export const CURATED_YIELDS: Record<string, YieldEntry> = {
  p01: { rendimiento_g: 1800, estimada: false, base: '"~1.8 L", densidad ≈ leche' },
  p02: { rendimiento_g: 500, estimada: false, base: '"~500 ml"' },
  p03: { rendimiento_g: 200, estimada: false, base: '"~200 g"' },
  p04: { rendimiento_g: 500, estimada: false, base: '"~500 g"' },
  p05: { rendimiento_g: 350, estimada: false, base: '"~350 g"' },
  p06: { rendimiento_g: 480, estimada: false, base: '530 g de insumos menos merma de horno (confirmado)' },
  p07: { rendimiento_g: 370, estimada: false, base: 'suma de insumos, masa cruda (confirmado)' },
  p08: { rendimiento_g: 750, estimada: false, base: '375 g de masa de seitán + absorción de caldo (confirmado)' },
  p16: { rendimiento_g: 650, estimada: false, base: '322 g de insumos + hidratación de la texturizada (Facu)' },
  p26: { rendimiento_g: 700, estimada: false, base: '"~700 g"' },
  p27: { rendimiento_g: 500, estimada: false, base: '"~500 g"' },
};

/** p08 (bifecitos de seitán) es preparado de facto: p12 y p20 lo consumen. */
export const DE_FACTO_PREPARADOS = ['p08'];

// ---------- T3: líneas fantasma → referencia a receta ----------

export interface PhantomLineEntry {
  receta_id: string;
  ingrediente_id: string;
  /** `unidad` original: desambigua si la receta repite el ingrediente */
  unidad: string;
  ref_receta_id: string;
  flag_gate: boolean;
  nota?: string;
  /** ids de ingrediente que quedan como sustituto de la línea migrada (mismo peso) */
  sustitutos_id?: string[];
}

export const PHANTOM_LINES: PhantomLineEntry[] = [
  { receta_id: 'p12', ingrediente_id: 'gluten_trigo', unidad: 'g_seitan_en_cubos', ref_receta_id: 'p08', flag_gate: false, nota: 'seitán ya cocido' },
  { receta_id: 'p19', ingrediente_id: 'mani', unidad: 'g_como_queso_P04', ref_receta_id: 'p04', flag_gate: false },
  { receta_id: 'p20', ingrediente_id: 'gluten_trigo', unidad: 'g_seitan_SALSA', ref_receta_id: 'p08', flag_gate: false },
  {
    receta_id: 'p31',
    ingrediente_id: 'margarina',
    unidad: 'g',
    ref_receta_id: 'p03',
    flag_gate: false,
    nota: 'Facu usa su manteca vegana (p03); la margarina comprada sirve igual, al mismo peso',
    sustitutos_id: ['margarina'],
  },
  { receta_id: 'p34', ingrediente_id: 'porotos_negros', unidad: 'taza_de_crema_P26_sin_aceite_coco', ref_receta_id: 'p26', flag_gate: false },
  { receta_id: 'p39', ingrediente_id: 'porotos_alubia', unidad: 'g_como_crema_P27', ref_receta_id: 'p27', flag_gate: false },
  {
    receta_id: 'p39',
    ingrediente_id: 'margarina',
    unidad: 'g_masa + 150 crumble',
    ref_receta_id: 'p03',
    flag_gate: false,
    nota: 'ídem p31: la margarina comprada sirve igual, al mismo peso',
    sustitutos_id: ['margarina'],
  },
];

/**
 * Ingredientes que aportan cero de verdad, no "sin dato" (decisión de Facu en el
 * gate): el agua se cuenta como cobertura completa con valor 0, así una sopa no
 * reporta 17 % de cobertura por el peso del líquido. El caldo NO entra: depende
 * de con qué se hizo, así que sigue siendo "sin datos".
 */
export const APORTE_NULO_IDS = ['agua', 'agua_helada'];

/** Líneas que el dataset omite y hay que agregar (la tarta p22 no lista su masa). */
export interface AddedLineEntry {
  receta_id: string;
  ref_receta_id: string;
  cantidad: number;
  unidad_display: string;
  g_aprox: number;
  funcion?: string;
  nota?: string;
  flag_gate: boolean;
}

export const ADDED_LINES: AddedLineEntry[] = [
  {
    receta_id: 'p22',
    ref_receta_id: 'p07',
    cantidad: 1,
    unidad_display: 'masa entera',
    g_aprox: 370,
    funcion: 'base de la tarta',
    nota: 'línea agregada en la ingesta: el dataset lista solo el relleno',
    flag_gate: true,
  },
];

/**
 * usa_preparados que quedan como enlace navegacional (sin tocar líneas):
 * p10→p01 consume el okara (subproducto), no la leche; p30→p02 ya desagrega
 * la leche de coco en agua+coco rallado; p44→p06 el queso va sobre la pizza
 * armada, no dentro de la masa.
 */
export const NAV_ONLY_PREPARADOS: Array<{ receta_id: string; preparado_id: string }> = [
  { receta_id: 'p10', preparado_id: 'p01' },
  { receta_id: 'p30', preparado_id: 'p02' },
  { receta_id: 'p44', preparado_id: 'p06' },
];

// ---------- T6: conceptos usados por reglas R que no son ids/categorías reales ----------

export interface ConceptEntry {
  ids?: string[];
  categorias?: IngredientCategory[];
  calificador?: string;
}

export const RULE_CONCEPTS: Record<string, ConceptEntry> = {
  cereal_integral: {
    ids: ['avena', 'arroz_integral', 'harina_integral', 'burgol', 'cebada', 'quinoa', 'trigo_sarraceno'],
  },
  tomate_cocido: { ids: ['tomate', 'tomate_triturado', 'salsa_tomate', 'extracto_tomate'], calificador: 'cocido' },
  zanahoria_cocida: { ids: ['zanahoria'], calificador: 'cocido' },
  castana_para: { ids: ['castanas_para'] },
  lino_entero: { ids: ['lino'], calificador: 'entero' },
};

// ---------- T7: items de conservación que son grupos, no ids ----------

export type StorageMapping =
  | { tipo: 'ids'; ids: string[] }
  | { tipo: 'categorias'; categorias: IngredientCategory[] }
  | { tipo: 'estado'; descripcion: string };

export const STORAGE_GROUPS: Record<string, StorageMapping> = {
  legumbres_secas: { tipo: 'categorias', categorias: ['legumbre'] },
  legumbres_cocidas: { tipo: 'categorias', categorias: ['legumbre'] },
  granos_pastas_arroz: { tipo: 'categorias', categorias: ['cereal', 'pseudocereal'] },
  arroz_granos_cocidos: { tipo: 'categorias', categorias: ['cereal', 'pseudocereal'] },
  azucar_sal_cacao: { tipo: 'ids', ids: ['azucar', 'azucar_impalpable', 'azucar_mascabo', 'sal_yodada', 'cacao_amargo'] },
  especias_molidas: { tipo: 'categorias', categorias: ['especia'] },
  especias_enteras: { tipo: 'categorias', categorias: ['especia'] },
  fruta_seca: { tipo: 'categorias', categorias: ['fruta_seca'] },
  frutos_secos: { tipo: 'categorias', categorias: ['fruto_seco'] },
  semillas_peladas: { tipo: 'categorias', categorias: ['semilla'] },
  algas: { tipo: 'categorias', categorias: ['alga'] },
  lino_entero: { tipo: 'ids', ids: ['lino'] },
  lino_molido: { tipo: 'ids', ids: ['lino'] },
  tofu_abierto: { tipo: 'ids', ids: ['tofu_firme'] },
  tempeh_abierto: { tipo: 'ids', ids: ['tempeh'] },
  bebida_vegetal_abierta: { tipo: 'ids', ids: ['bebida_vegetal_fortificada', 'bebida_soja'] },
  leche_coco_abierta: { tipo: 'ids', ids: ['leche_coco'] },
  extracto_tomate_abierto: { tipo: 'ids', ids: ['extracto_tomate'] },
  hierbas_frescas: { tipo: 'ids', ids: ['albahaca', 'cilantro', 'perejil', 'menta'] },
  hojas_verdes_frescas: { tipo: 'categorias', categorias: ['verdura_hoja', 'crucifera'] },
  raices: { tipo: 'ids', ids: ['zanahoria', 'remolacha', 'batata', 'papa', 'mandioca'] },
  palta_madura: { tipo: 'ids', ids: ['palta'] },
  banana_muy_madura: { tipo: 'ids', ids: ['banana'] },
  aquafaba: { tipo: 'estado', descripcion: 'líquido de cocción de garbanzos' },
  guisos_sopas: { tipo: 'estado', descripcion: 'guisos y sopas ya cocidos' },
  caldo_casero: { tipo: 'estado', descripcion: 'caldo casero' },
  hamburguesas_crudas: { tipo: 'estado', descripcion: 'medallones crudos formados' },
  panificados: { tipo: 'estado', descripcion: 'panes y masas horneadas' },
};

// ---------- catálogo de nutrientes → clave en ingredientes ----------

export const NUTRIENT_INGREDIENT_KEY: Record<string, string> = {
  b12: 'b12_ug',
  vitd: 'vitd_ug',
  hierro: 'hierro_mg',
  zinc: 'zinc_mg',
  calcio: 'calcio_mg',
  yodo: 'yodo_ug',
  selenio: 'selenio_ug',
  omega3: 'ala_g',
  proteina: 'prot_g',
  vitc: 'vitc_mg',
  vita: 'vita_ug_rae',
  folato: 'folato_ug',
  b2: 'b2_mg',
  vite: 'vite_mg',
  vitk: 'vitk_ug',
  b6: 'b6_mg',
  magnesio: 'magnesio_mg',
  potasio: 'potasio_mg',
  fibra: 'fibra_g',
  colina: 'colina_mg',
};

// ---------- T8: factores veganos que el dataset declara en prosa ----------

/**
 * `ajuste_vegano` casi siempre trae `factor` numérico (hierro ×1.8, zinc ×1.5) y
 * la regla del proyecto es NO inventar factores donde no los hay. Pero dos
 * nutrientes traen el multiplicador escrito en la descripción, y el propio
 * dataset lo confirma en `perfil.json → objetivos_derivados_del_ejemplo`
 * (proteína 75 g y ALA 3.2 g para un varón de 75 kg). Formalizarlos acá es
 * transcribir el dato, no fabricarlo; cualquier otro caso sigue siendo guía
 * textual sin número.
 */
export interface ProseVeganFactor {
  factor: number;
  base: string;
}

export const VEGAN_FACTORS_FROM_PROSE: Record<string, ProseVeganFactor> = {
  proteina: {
    factor: 1.25, // 0.8 g/kg × 1.25 = 1.0 g/kg
    base: '"Práctico: ~1.0 g/kg (digestibilidad vegetal algo menor)" sobre una RDA de 0.8 g/kg; el ejemplo del dataset deriva 75 g para 75 kg',
  },
  omega3: {
    factor: 2, // "duplicar ALA"
    base: '"Si no se suplementa EPA/DHA: duplicar ALA"; el ejemplo del dataset deriva 3.2 g desde una RDA de 1.6 g',
  },
};

// ---------- T9: pasos reescritos ----------

/**
 * Las instrucciones del dataset son notas de cocinero, no una receta: 3,95
 * pasos y ~202 caracteres por receta entera, con la mayoría de los
 * ingredientes sin aparecer nunca. Esta tabla las reemplaza.
 *
 * Estilo, para que las 84 salgan parejas:
 * - Oración completa en rioplatense. Nada de `;` y `+` como pegamento.
 * - Cada paso dice qué entra, dónde, a qué fuego y **cuál es la señal** para
 *   pasar al siguiente, no solo el minutaje.
 * - Todo ingrediente `imprescindible` aparece en algún paso.
 * - El acompañamiento tiene su paso o se declara al principio.
 * - Los `secretos_chef` no se absorben: siguen aparte.
 * - 4 a 8 pasos. Antes que apilar tres acciones en uno, se parte.
 * - Se conserva el énfasis útil del original (A MANO, EN CALIENTE, TENEDOR).
 * - Sin códigos del dataset en los pasos: ni reglas (R8) ni ids de recetas
 *   (P04). El porqué se dice con palabras; otra receta, por su nombre.
 *
 * `base` dice de dónde salió cada cosa. `flag_gate: true` significa que la
 * entrada suma técnica de cocina estándar que el dataset no declara (fuego,
 * recipiente, señal visual): cocina Facu, y en el gate de Fase 1 corrigió 5 de
 * las 15 porciones propuestas.
 */

export interface StepsEntry {
  pasos: string[];
  base: string;
  flag_gate: boolean;
  nota?: string;
}

export const CURATED_STEPS: Record<string, StepsEntry> = {
  r18: {
    base: 'prosa de recetas-set2.md ("en sartencita", "¡segundos!"); funcion de cada línea (pimienta = activa curcumina R8, tomate = picado_en_tadka, limón = R1); técnica estándar: fuego, señal de cocción, orden del arroz',
    flag_gate: true,
    nota: 'Los pasos viejos nombraban un "ají" que no existe como línea de ingrediente: se saca. Jengibre, pimienta negra y arroz no aparecían en ningún paso.',
    pasos: [
      'Enjuagar las lentejas turcas hasta que el agua salga clara y ponerlas en una olla con 900 ml de agua fría, la cucharadita de cúrcuma y la media cucharadita de pimienta negra. La pimienta no es condimento acá: es lo que hace que la curcumina se absorba.',
      'Llevar a hervor, bajar a fuego medio-bajo y cocinar 20 a 25 minutos destapado, revolviendo cada tanto para que no se pegue al fondo. Están listas cuando se deshacen solas y ya no se distingue el grano.',
      'Batir el dal con batidor o cuchara de madera hasta que quede cremoso y parejo. Si quedó muy espeso, aflojar con un chorrito de agua caliente: tiene que caer de la cuchara, no quedarse pegado.',
      'Si vas a acompañar con arroz, poner ahora la taza de arroz blanco a cocinar: llega justo con el dal.',
      'El tadka se hace aparte, en una sartencita, nunca en la olla del dal. Calentar las 3 cucharadas de aceite de oliva a fuego medio-alto, tirar la cucharadita de comino en grano y esperar a que crepite, unos 30 segundos.',
      'Sumar los 4 dientes de ajo laminados y la cucharada de jengibre, y revolver SEGUNDOS, hasta que el ajo apenas tome color. Si lo usás, el tomate picado entra acá y se saltea 30 segundos más.',
      'Volcar el tadka hirviendo sobre el dal — el "tsss" es el plato — y revolver una sola vez, para que quede veteado y no uniforme.',
      'Apagar el fuego, exprimir el jugo del limón y salar. El limón va al final y fuera del fuego: es lo que activa la absorción del hierro.',
    ],
  },

  p24: {
    base: 'prosa de recetas-personales.md ("las semillas de sésamo tostadas en seco al momento"); unidad de cada línea (tostado_al_momento, rallada, g_cherry); técnica estándar: secar las hojas, orden de armado',
    flag_gate: true,
    nota: 'La receta entera era un paso para 8 ingredientes.',
    pasos: [
      'Tostar la cucharada de sésamo integral en una sartén seca a fuego medio, moviéndola, hasta que empiece a saltar y largue perfume: dos o tres minutos. Pasarlo a un plato enseguida, porque en la sartén caliente se sigue cocinando y se quema.',
      'Lavar y secar bien los 100 g de hojas verdes y ponerlas en un bol amplio. Secas de verdad: sobre hojas mojadas el aliño resbala y se junta en el fondo.',
      'Cortar los 4 rabanitos en rodajas finas y la manzana roja en bastones o cubos, con cáscara.',
      'Rallar grueso la zanahoria, cortar los tomates cherry al medio y la palta en cubos.',
      'Sumar todo al bol de las hojas, aliñar con el chorrito de aceite de oliva y sal, y mezclar con las manos de abajo hacia arriba, para no aplastar la palta.',
      'Terminar con el sésamo tostado por encima recién en el plato: si entra antes se humedece y pierde todo el crocante.',
    ],
  },

  r28: {
    base: 'prosa de recetas-set3.md (el aliño agrupado como bloque, "esponjar con TENEDOR, jamás cuchara"); funcion de cada línea ("acá las hierbas son verdura"); técnica estándar: orden de cortes y momento de cada grupo',
    flag_gate: true,
    nota: 'La peor relación del dataset: 22 líneas de ingrediente y 4 pasos. El aliño se nombraba pero nunca se decía qué lleva.',
    pasos: [
      'Poner los 250 g de cuscús integral en un bol grande y volcarle encima los 350 ml de caldo de verduras hirviendo. Tapar con un plato y dejar 10 minutos sin tocar: se hidrata solo.',
      'Mientras tanto cortar en cubitos chicos el zucchini, el morrón rojo y el medio pepino, todo crudo; rallar la zanahoria y picar fino las 4 cebollas de verdeo.',
      'Picar las aceitunas verdes y, si los usás, los tomates secos escurridos. Picar la menta y el perejil gruesos: acá las hierbas son verdura y no adorno, por eso van 40 g de cada una. El cilantro es opcional.',
      'Armar el aliño en un frasco con tapa: el jugo y la ralladura del limón, las 4 cucharadas de aceite de oliva, el diente de ajo bien picado, la cucharadita de comino, un cuarto de cucharadita de canela y otro de cúrcuma, sal y pimienta. Cerrar y agitar hasta que emulsione. La cucharadita de azúcar mascabo, si querés redondearlo.',
      'Destapar el cuscús y esponjarlo con un TENEDOR, separando los granos de a poco. Con cuchara se aplastan y no hay vuelta atrás.',
      'Sumar al bol los garbanzos cocidos y escurridos y todas las verduras cortadas, volcar el aliño y mezclar.',
      'Incorporar las hierbas y las pasas al final, para que no se ablanden ni pierdan color. Las almendras fileteadas, si las usás, van también acá.',
      'Dejar reposar 15 minutos antes de servir: es el rato en que el cuscús toma el aliño.',
    ],
  },

  p27: {
    base: 'funcion de cada línea ("blancos = color crema", "endulzante"); secretos_chef (la veganización miel → dátiles); técnica estándar de procesado: tibio, raspar paredes, etapa granulosa',
    flag_gate: true,
    nota: 'La receta entera era "Licuar todo; contenerse". Se conserva el chiste al final, que es la voz del recetario.',
    pasos: [
      'Usar la taza y media de porotos alubia cocidos todavía tibios y escurridos. Tibios se procesan mucho mejor que fríos, y que sean blancos es lo que da el color crema.',
      'Poner los porotos en la procesadora con el tercio de taza de puré de dátiles, el chorrito de aceite —de oliva suave o de coco— y el chorrito de esencia de vainilla.',
      'Procesar a máxima potencia hasta que quede completamente lisa, parando dos o tres veces para bajar con una espátula lo que sube por las paredes. Va a pasar por una etapa de pasta granulosa antes de volverse crema: es normal, hay que seguir.',
      'Si quedó muy espesa, aflojar con una cucharada de agua o de bebida vegetal por vez, hasta que caiga de la cuchara como un dulce de leche blando.',
      'Sumar la cucharada de ralladura de naranja —o de limón, canela o café, según qué crema quieras— y darle un último golpe de procesadora, apenas para integrar.',
      'Probar, ajustar el dulzor con más puré de dátiles y guardar en un frasco en la heladera. Contenerse.',
    ],
  },

  p08: {
    base: 'prosa de recetas-personales.md (2:1 y hervor suave = seitán tierno, sellado final = Maillard); funcion de cada línea (harina "suaviza", caldo "medio de cocción + ½ taza salsa de soja"); técnica estándar: fuego del hervor, enfriar en el caldo, grosor del corte',
    flag_gate: true,
    nota: 'El paso viejo decía "20 min por lado" y el encabezado 40 de cocción: se explicita que son 20 y 20.',
    pasos: [
      'Mezclar en un bol los 250 g de gluten de trigo con los 125 g de harina integral (o pan integral rallado) y los secos: la cucharadita de pimentón ahumado, más ajo y cebolla en polvo, curry y orégano a gusto. Esa proporción de 2 a 1 entre gluten y harina no es casual: es la que define la textura.',
      'Sumar las 10 cucharadas de salsa de soja y después la media taza de agua de a poco, mezclando, hasta formar una masa pesada y algo pegajosa. Puede que no necesites toda el agua.',
      'Amasar SOLO hasta que se integre, un minuto como mucho. Amasar de más desarrolla el gluten y el bifecito sale duro.',
      'Tapar el bol y dejar reposar entre 10 y 20 minutos: la masa se relaja y después se corta mucho mejor.',
      'Calentar las 2 tazas de caldo de verduras con media taza más de salsa de soja en una olla ancha. Cuando rompa el hervor, bajar a fuego medio para que borbotee apenas: un hervor fuerte deshace la pieza.',
      'Meter la masa entera y cocinar 20 minutos de un lado y 20 del otro, 40 en total, dándola vuelta a la mitad.',
      'Apagar y dejar enfriar dentro del caldo hasta poder manipularla. Recién ahí cortar los bifecitos, de un centímetro más o menos.',
      'Al servir, sellarlos vuelta y vuelta en una sartén bien caliente con un hilo de aceite, o empanarlos pasándolos por un batido de harina y agua y después por pan rallado. Tienen que quedar con costra dorada, no solo calientes.',
    ],
  },

  p36: {
    base: 'prosa de recetas-personales.md ("mandioca cruda rallada licuada", molde 24 cm con chimenea); funcion de cada línea ("sin harina de trigo: sin gluten"); técnica estándar: precalentado, señal del palillo, enfriar antes de desmoldar',
    flag_gate: true,
    nota: 'El horneado es donde la imprecisión arruina el plato: el paso viejo mezclaba temperatura, tiempo, prueba del palillo, enfriado, desmolde y decoración en un renglón.',
    pasos: [
      'Precalentar el horno a 180°. Aceitar un molde de 24 cm, mejor si es con chimenea, y enharinarlo con fécula de mandioca.',
      'Pelar y rallar los 500 g de mandioca cruda. Va cruda y sin pelar de más: la mandioca aporta el almidón que reemplaza a la harina, así que la torta sale sin gluten.',
      'Licuar la mandioca rallada con la media banana madura, los 200 ml de bebida de soja, las 6 cucharadas de aceite neutro y los 50 g de margarina —o manteca vegana— hasta obtener una crema lisa. Lleva su tiempo y hay que parar a bajar lo que sube por las paredes: la mandioca es fibrosa y cuesta.',
      'Sumar los 250 g de azúcar, la pizca de sal y las 2 cucharaditas de polvo de hornear, y licuar un poco más, solo hasta integrar.',
      'Volcar la mezcla en un bol e incorporar los 100 g de coco rallado con cuchara, con movimientos envolventes. Acá se deja la licuadora: el coco tiene que quedar entero, no molido.',
      'Verter en el molde, emparejar la superficie y espolvorear coco rallado extra por encima.',
      'Hornear a 180° entre 35 y 45 minutos, hasta que la superficie esté dorada y un palillo salga seco del centro.',
      'Dejar enfriar en el molde antes de desmoldar: en caliente se rompe. Espolvorear azúcar impalpable al servir.',
    ],
  },

  r13: {
    base: 'prosa de recetas-set2.md (grano corto tipo doble carolina, lado brillante abajo, 2 cm libres); secretos_chef (lavar y sazonar caliente son el 80 %, no sobrecargar es el error #1, cuchillo mojado entre cortes); técnica estándar: sellar el borde, temperatura del arroz',
    flag_gate: true,
    nota: 'Cuatro pasos para una técnica de manos que se aprende haciendo. Se parte el armado en tres.',
    pasos: [
      'Lavar la taza y media de arroz blanco —mejor grano corto, tipo doble carolina— bajo el chorro, frotándolo con la mano y cambiando el agua hasta que salga clara. Sin ese enjuague el arroz se apelmaza en vez de pegar.',
      'Cocinar el arroz como de costumbre y, apenas esté, pasarlo a una fuente ancha y sazonarlo EN CALIENTE con las 3 cucharadas de vinagre de arroz, la cucharada de azúcar y sal, mezclando con movimientos de corte para no aplastar el grano. Caliente absorbe; frío no.',
      'Enfriar el arroz abanicándolo hasta que quede a temperatura ambiente y brillante. No va a la heladera: se endurece y deja de pegar.',
      'Mientras se enfría, cortar la palta en láminas, el pepino en bastones largos y, si la usás, la zanahoria en juliana fina.',
      'Apoyar una hoja de nori con el lado brillante hacia abajo sobre la esterilla —o un repasador limpio— y extender una capa fina de arroz, dejando 2 cm libres en el borde de arriba.',
      'Poner el relleno en una línea sobre el tercio más cercano a vos, sin pasarte de cantidad: si sobrecargás, el roll no cierra.',
      'Enrollar desde el borde más cercano, apretando con la esterilla a medida que avanzás, y sellar el borde libre con unas gotas de agua. Repetir con las 6 hojas de nori.',
      'Cortar cada roll con un cuchillo filoso y mojado, mojándolo otra vez entre corte y corte. Servir con el sésamo por encima y salsa de soja para mojar.',
    ],
  },

  p11: {
    base: 'secretos_chef (la regla de picada: crocante + untable + ácido + proteico; los bastones al horno como diferencial); nota de la receta ("combo componible"); técnica estándar: orden por tiempo de cocción, untables a temperatura ambiente',
    flag_gate: true,
    nota: 'El "paso 2" viejo no era un paso sino una lista de referencias a otras recetas. Como combo, los pasos son de armado y de orden, no de cocción.',
    pasos: [
      'Arrancar por lo que más tarda: los 300 g de mandioca y los 300 g de papa cortados en bastones, con aceite y sal, a horno fuerte (200°) entre 30 y 40 minutos, hasta que estén dorados y crocantes por fuera.',
      'Tostar los 150 g de pan integral en rodajas, en horno o tostadora, hasta que queden firmes: tienen que aguantar el untable sin doblarse.',
      'Preparar el guacamole pisando la palta con limón y sal. Si sumás hummus, queso de maní o quesofu, es el momento de sacarlos de la heladera: los untables van a temperatura ambiente, fríos no saben a nada.',
      'Cortar los crudos: la zanahoria y el morrón rojo en bastones, y los 150 g de tomates cherry enteros.',
      'Escurrir los 200 g de berenjenas en escabeche y, si sumás seitán salteado o garbanzos crocantes, dorarlos ahora para que lleguen tibios a la mesa.',
      'Armar la tabla repartiendo por zonas y no en pilas, y chequear que estén las cuatro patas: crocante (los bastones al horno, el pan, los garbanzos), untable (guacamole, hummus, quesos), ácido (las berenjenas en escabeche) y proteico (las nueces, los cajús, el seitán).',
      'Los bastones al horno y el pan van a la mesa recién salidos: es lo único de la picada que no espera.',
    ],
  },

  d01: {
    base: 'prosa de recetas-set2.md ("ENJUAGADÍSIMOS", "horno moderado (180°)", "calientes se desarman", "pizca de sal"); funcion de cada línea (lino = liga con 5 cdas agua, cacao = tapa el poroto, polvo de hornear = leve levantado, nueces = remate); técnica estándar: precalentado, molde aceitado, punto húmedo del brownie',
    flag_gate: true,
    pasos: [
      'Hidratar las 2 cucharadas de lino molido con 5 cucharadas de agua y dejar reposar el gel mientras se precalienta el horno a 180°: esa mezcla es la liga que reemplaza al huevo.',
      'Enjuagar los 400 g de porotos negros cocidos hasta que el agua salga clara — ENJUAGADÍSIMOS — y escurrirlos bien: cualquier resto del líquido de cocción se nota en el resultado.',
      'Procesar TODO junto hasta que quede liso total, 2 a 3 minutos de máquina: los porotos, los 60 g de cacao amargo, los 50 g de avena, los 120 g de azúcar mascabo, el gel de lino, las 3 cucharadas de aceite de oliva, la cucharadita de polvo de hornear, la de esencia de vainilla y una pizca de sal. La masa está lista cuando no se ve ni un pedacito de poroto.',
      'Repartir la masa en los moldes aceitados hasta dos tercios de altura — sube poco — y, si las usás, coronar con los 30 g de nueces.',
      'Hornear 22 a 26 minutos a 180°, horno moderado: los bordes se ven cocidos y el centro tiene que salir apenas húmedo al pincharlo. Es brownie: seco del todo es señal de que se pasó.',
      'Dejar enfriar COMPLETOS antes de desmoldar: calientes se desarman.',
    ],
  },

  d02: {
    base: 'prosa de recetas-set2.md ("no se expanden solas", "con manchas: ahí está el dulzor"); funcion de cada línea (banana = endulzante y liga, avena = estructura, pasta de maní = riqueza); técnica estándar: horno precalentado, señal de bordes dorados',
    flag_gate: true,
    pasos: [
      'Encender el horno a 180° y pisar las 2 bananas en un bol hasta hacer un puré. Tienen que estar muy maduras, de las de manchas oscuras: en esas manchas vive todo el dulzor de la galletita.',
      'Sumar los 150 g de avena y mezclar hasta tener una masa húmeda que se mantiene unida. Si los usás, acá entran la cucharadita de canela, los 30 g de pasas y la cucharada de pasta de maní.',
      'Tomar cucharadas de masa, apoyarlas en una placa con papel manteca y aplastarlas dándoles forma: en el horno no se expanden solas, quedan tal cual las dejás.',
      'Hornear 15 minutos a 180°, hasta que los bordes tomen color dorado. Salen tiernas y húmedas: son así, no les falta cocción.',
    ],
  },

  d03: {
    base: 'prosa de recetas-set2.md ("seda absoluta", "raspar bordes 2-3 veces", "versión lujosa", "frutillas para servir"); funcion de cada línea (palta = la crema invisible, dátiles = dulzor, chocolate = versión lujosa); técnica estándar: remojo de dátiles duros, frío para que tome cuerpo',
    flag_gate: true,
    pasos: [
      'Remojar los 6 dátiles 10 minutos en agua caliente si están duros y escurrirlos: blandos se procesan parejo y no dejan pedacitos.',
      'Procesar las 2 paltas con las 5 cucharadas de cacao amargo, los dátiles, las 5 cucharadas de bebida vegetal, la cucharadita de esencia de vainilla y una pizca de sal. Las paltas tienen que estar maduras pero sin partes oscuras: de ellas sale toda la cremosidad.',
      'Raspar los bordes del vaso dos o tres veces y seguir procesando hasta seda absoluta: ni un punto verde, ni un resto de dátil. Ahí, y no antes, deja de saber a palta.',
      'Probar y ajustar el dulzor: si falta, un dátil más y otra vuelta de máquina. Si lo usás, este es el momento de los 30 g de chocolate amargo derretido, la versión más lujosa.',
      'Repartir en compoteras y llevar a la heladera una hora como mínimo: entra crema y sale mousse.',
      'Servir bien frío y, si las sumás, con la taza de frutillas frescas por encima.',
    ],
  },

  d04: {
    base: 'prosa de recetas-set2.md ("húmedos por un lado (banana pisada, aceite, lino hidratado), secos por otro", "palillo seco = listo", "10 min en molde, luego rejilla", "pizca de sal"); funcion de cada línea (lino = liga con 3 cdas agua, nueces arriba); técnica estándar: mascabo con los húmedos, desmolde sobre rejilla',
    flag_gate: true,
    pasos: [
      'Hidratar la cucharada de lino molido con 3 cucharadas de agua y dejar que arme gel mientras se precalienta el horno a 175°.',
      'Pisar las 3 bananas muy maduras en un bol grande y mezclarlas con los 80 g de azúcar mascabo, los 60 ml de aceite de oliva y el gel de lino: esos son los húmedos.',
      'Mezclar los secos en otro bol: los 200 g de harina integral, las 2 cucharaditas de polvo de hornear, la media cucharadita de bicarbonato, la cucharadita de canela y una pizca de sal.',
      'Volcar los secos sobre los húmedos y unir SIN batir de más: se mezcla apenas hasta que no quede harina seca a la vista, y ahí se suelta la espátula. Cuanto menos se toca la masa, más tierna la miga.',
      'Pasar la masa a una budinera aceitada. Si los usás, mezclar antes los 40 g de chips de chocolate amargo y repartir los 60 g de nueces por arriba.',
      'Hornear 50 a 60 minutos a 175°, hasta que un palillo clavado en el centro salga seco: esa es la única señal confiable con tanta banana.',
      'Dejarlo 10 minutos en el molde y recién después desmoldarlo sobre una rejilla: caliente todavía está frágil y se quiebra.',
    ],
  },

  d05: {
    base: 'prosa de recetas-set2.md ("remojados 10 min si están duros", "arena gruesa", "masa que se pega al apretar", "coco rallado o sésamo para rebozar"); funcion de cada línea (dátiles = pegamento dulce, maní = cuerpo, avena = regula humedad); técnica estándar: manos húmedas para bolear, frío para que firmen',
    flag_gate: true,
    pasos: [
      'Remojar los 200 g de dátiles 10 minutos en agua caliente si están duros y escurrirlos bien: son el pegamento de todo, tienen que estar blandos.',
      'Procesar los 100 g de maní tostado con los 40 g de avena hasta una arena gruesa: con algún pedacito de maní se agradece el crocante.',
      'Sumar los dátiles, las 3 cucharadas de cacao amargo y, si las usás, la pizca de sal y la cucharada de chía. Procesar hasta que se forme una masa que se pega al apretarla entre los dedos: esa es la señal.',
      'Armar bolitas de un bocado con las manos apenas húmedas y, si lo usás, hacerlas rodar por las 3 cucharadas de coco rallado.',
      'Llevarlas a la heladera una media hora, hasta que estén firmes: frías toman textura de golosina.',
    ],
  },

  d06: {
    base: 'prosa de recetas-set2.md (mascabo repartido: "2 cdas" en la base y el resto en la cobertura, "arena gruesa con grumos", "burbujeo en bordes y dorado arriba"); funcion de cada línea (limón = frescura anti-oxidación, manzana = verde/ácida equilibra mejor, aceite = la arena grasa); técnica estándar: cobertura sin compactar',
    flag_gate: true,
    pasos: [
      'Encender el horno a 180°. Pelar las 4 manzanas grandes — verdes o ácidas equilibran mejor — y cortarlas en gajos a la fuente de horno, mezcladas con el jugo del medio limón, que evita que se oscurezcan, la cucharadita de canela y unas 2 cucharadas de los 90 g de azúcar mascabo. Si las sumás, las pasas entran acá.',
      'Hacer la cobertura aparte: los 100 g de avena, los 60 g de harina integral, el resto del azúcar y los 60 ml de aceite de oliva en un bol, frotando con la punta de los dedos hasta una arena gruesa y despareja, con grumos grandes. Si las usás, sumar los 40 g de nueces picadas.',
      'Repartir la cobertura sobre la fruta SIN apretarla: suelta se hornea crocante, compactada sale masa cruda.',
      'Hornear 35 minutos a 180°, hasta ver el jugo burbujeando en los bordes y la superficie dorada: las dos señales juntas, no una sola.',
    ],
  },

  d07: {
    base: 'prosa de recetas-set2.md ("procesadora potente", "arena → grumos → de golpe, crema", "raspando bordes", "solo si la máquina sufre"); funcion de cada línea (banana = todo el helado, bebida = ayuda a la máquina); técnica estándar: líquido de a poco para no terminar en licuado',
    flag_gate: true,
    pasos: [
      'Arrancar con las 3 bananas maduras ya congeladas en rodajas: cortarlas antes de congelarlas no es capricho, entera ninguna máquina puede con ellas. Y acá hace falta una procesadora con carácter.',
      'Procesar las rodajas sin agregar nada y tener fe: primero arena, después una masa de grumos y en un momento, de golpe, crema de helado. Son 2 a 4 minutos parando a raspar los bordes, y la etapa de grumos no es el final: hay que seguir.',
      'Solo si la máquina sufre, aflojar con las cucharadas de bebida vegetal, de a una y hasta 3: con líquido de más queda licuado, no helado.',
      'Sumar el sabor al final, si lo usás: las 2 cucharadas de cacao amargo, la cucharada de pasta de maní o la media taza de frutillas congeladas, con unas pulsadas apenas para integrar.',
      'Comerlo enseguida si lo querés cremoso tipo soft, o darle una hora de freezer si lo querés firme, de cortar.',
    ],
  },

  d08: {
    base: 'prosa de recetas-set2.md ("fondo grueso, fuego bajo", "grano corto ideal", "sin lo blanco", "espesa al enfriar"); funcion de cada línea (azúcar = entra al FINAL, cáscara = el alma del de abuela, bebida CON calcio); técnica estándar: vainilla fuera del fuego, retirar rama y cáscara antes de servir',
    flag_gate: true,
    pasos: [
      'Poner en una olla de fondo grueso los 100 g de arroz — grano corto, si hay — con el litro de bebida vegetal fortificada con calcio, la rama de canela y la tira de cáscara de limón o naranja sin nada de lo blanco, que amarga. La cáscara es el alma del arroz con leche de abuela.',
      'Cocinar a fuego MÍNIMO, destapado, revolviendo seguido con cuchara de madera: ese revolver constante le va sacando el almidón al grano, y de ahí sale la cremosidad sin una gota de crema.',
      'Sumar los 70 g de azúcar mascabo recién a los 25 o 30 minutos, cuando el grano ya está tierno, y seguir revolviendo 10 minutos más. El azúcar va al FINAL: si entra desde el principio, el arroz no se termina de ablandar nunca.',
      'Apagar cuando todavía está más líquido de lo que lo querés comer: al enfriar espesa muchísimo. Si la usás, la cucharadita de esencia de vainilla entra acá, ya fuera del fuego, para que no se evapore el perfume.',
      'Retirar la rama de canela y la cáscara, repartir en compoteras y llevar a la heladera. Al servir, si la usás, terminar con la canela molida por arriba.',
    ],
  },

  d09: {
    base: 'prosa de recetas-set2.md ("el cacao en frío hace grumos", "OTRA VEZ a los 10 minutos", "frascos", "banana o frutilla arriba"); funcion de cada línea (chía = gel, dátiles procesados = dulzor); técnica estándar: el segundo revuelto porque las semillas se asientan',
    flag_gate: true,
    pasos: [
      'Entibiar una parte de los 300 ml de bebida vegetal fortificada y disolver ahí las 2 cucharadas de cacao amargo con los 3 dátiles procesados, revolviendo hasta una pasta lisa: el cacao echado directo en líquido frío arma grumos que después no se van.',
      'Sumar el resto de la bebida y, si la usás, la media cucharadita de esencia de vainilla, y mezclar hasta que quede parejo.',
      'Agregar las 4 cucharadas de chía y revolver bien. A los 10 minutos, revolver OTRA VEZ: las semillas se van al fondo y ese segundo revuelto es lo que salva la textura pareja.',
      'Repartir en frascos, tapar y dejar toda la noche en la heladera: a la mañana la chía armó un gel espeso, de cuchara, y el budín está listo.',
      'Si la sumás, la banana en rodajas va por arriba recién al momento de comer.',
    ],
  },

  d10: {
    base: 'prosa de recetas-set2.md ("corta como suero", "moldes ¾", "movimientos envolventes", "lino 1 cda + 3 agua"); funcion de cada línea (vinagre = activa el leudado con el bicarbonato, zanahoria rallada fina, bebida con vinagre = suero vegano); técnica estándar: horno caliente de entrada, palillo seco',
    flag_gate: true,
    nota: 'La prosa del .md suma jengibre en polvo a las especias, pero no existe como línea de ingrediente en el JSON: no entra a los pasos. La sal sí, como despensa básica.',
    pasos: [
      'Mezclar los 120 ml de bebida vegetal con la cucharadita de vinagre y dejarla reposar 5 minutos: se corta apenas, como un suero, y ese ácido es el que después activa el leudado. Mientras, encender el horno a 190°.',
      'Hidratar la cucharada de lino molido con 3 cucharadas de agua, y rallar la zanahoria bien fina hasta juntar las 2 tazas: rallada gruesa llega cruda al final del horneado.',
      'Batir los húmedos en un bol: la bebida cortada, los 80 ml de aceite de oliva, los 100 g de azúcar mascabo y el gel de lino.',
      'Mezclar los secos en otro: los 220 g de harina integral, las 2 cucharaditas de polvo de hornear, la media cucharadita de bicarbonato, las 2 cucharaditas de canela y una pizca de sal.',
      'Unir húmedos y secos sin sobremezclar, apenas hasta que no se vea harina seca, e incorporar la zanahoria con movimientos envolventes. Si los sumás, los 60 g de nueces y los 40 g de pasas entran en esa misma pasada.',
      'Llenar los moldes de la muffinera hasta tres cuartos y hornear 20 a 24 minutos a 190°: esta masa quiere el horno bien caliente de entrada, es lo que la hace subir con domo. Están listos cuando un palillo clavado en el centro sale seco.',
    ],
  },

  p01: {
    base: 'prosa de recetas-personales.md ("licuar en 2 tandas con 325 ml c/u", "hervir destapada 40-45 min espumando", "El bagazo (okara) alimenta P10 — guardalo"); funcion de cada línea (agua = 650 licuado + 1500 en olla, sal = redondeo); técnica estándar: señal del remojo, la subida al romper hervor, escurrido en tela',
    flag_gate: true,
    pasos: [
      'Poner los 250 g de porotos de soja en un bol grande, cubrirlos con abundante agua fría y dejarlos en remojo 10 a 12 horas. Al otro día enjuagarlos bien: tienen que estar hinchados, al doble de tamaño.',
      'Licuar los porotos en dos tandas, cada una con 325 ml de agua, dos o tres minutos por tanda, hasta que no se sienta grano y quede una crema blanca pareja.',
      'Volcar el licuado en una olla grande, sumar el litro y medio de agua restante y llevar a hervor a fuego medio. OJO al romper hervor: sube muchísimo de golpe, así que quedarse al lado con la espumadera.',
      'Hervir DESTAPADA 40 a 45 minutos a fuego medio-bajo, espumando cada tanto. El hervor largo no se negocia: la soja cruda trae compuestos que bloquean la digestión y solo la cocción prolongada los desactiva.',
      'Dejar entibiar y filtrar con una tela sobre otra olla o un bol, retorciendo y escurriendo bien hasta sacarle todo el líquido al bagazo.',
      'Guardar el bagazo en un recipiente: es el okara, y con él se hacen las milanesas de soja del recetario. Aguanta unos tres días en la heladera o meses en el freezer.',
      'Si las usás, agregar las gotas de esencia de vainilla y la pizca de sal a la leche ya filtrada, y guardarla en botella en la heladera.',
    ],
  },

  p02: {
    base: 'prosa de recetas-personales.md ("licuar fuerte, reposo 5 min, filtrar", "2 tazas agua caliente (1 para concentrada)", "el bagazo → galletitas"); funcion del agua (1 sola para versión concentrada); técnica estándar: agua caliente para soltar la grasa del coco, exprimir la tela',
    flag_gate: true,
    pasos: [
      'Poner la taza de coco rallado en la licuadora con las dos tazas de agua bien caliente. El agua caliente es lo que ayuda a soltar la grasa del coco, y si la querés más concentrada, usar una taza sola.',
      'Licuar fuerte dos o tres minutos, hasta que las fibras se rompan y el líquido quede blanco y opaco.',
      'Dejar reposar cinco minutos con la licuadora apagada, para que el agua termine de sacarle todo el sabor al coco.',
      'Filtrar con una tela sobre un frasco o bol, retorciendo bien para exprimir hasta la última gota. El bagazo que queda sirve para unas galletitas del recetario, así que no lo tires.',
    ],
  },

  p03: {
    base: 'prosa de recetas-personales.md ("cortada con vinagre de manzana", "¡tiene que ser de esas leches para cuajar!", "lecitina (el estabilizante real)", "la levadura nutricional opcional acá no es detalle — suma B"); funcion de cada línea (aceite de coco = cuerpo sólido, lecitina = evita que se separe, cúrcuma = color); técnica estándar: derretir el coco apenas tibio, señal de emulsión pareja',
    flag_gate: true,
    nota: 'La línea del aceite de oliva dice "cda_girasol" en la unidad: se nombró oliva, que es lo que dice el ingrediente.',
    pasos: [
      'Batir el cuarto de taza de leche de soja con la media cucharada de vinagre de manzana y el cuarto de cucharadita de sal durante un minuto, y dejar reposar diez minutos hasta que se corte y espese apenas. Tiene que ser leche de soja o de almendras: son las únicas que cuajan con el vinagre.',
      'Mientras reposa, si el aceite de coco está sólido, derretir la media taza a baño maría suave. Tiene que quedar líquido pero apenas tibio, no caliente, para que después solidifique parejo y no corte la emulsión.',
      'Poner en la licuadora la leche cortada, el aceite de coco líquido y la cucharada de aceite de oliva. Si la usás —y conviene—, sumar la cucharadita de lecitina de soja: es la que mantiene todo unido y evita que la manteca se corte en la heladera.',
      'Si las sumás, entran también la cucharada de levadura nutricional, que da gusto y suma vitaminas del grupo B, y la pizca de cúrcuma, que es puro color manteca.',
      'Licuar 30 segundos a velocidad baja y un minuto a velocidad alta, hasta que la mezcla se vea espesa, pálida y sin vetas de aceite suelto.',
      'Volcar en un molde o frasco y llevar a la heladera hasta que solidifique del todo, unas horas. De ahí en más rinde como cualquier manteca: es la que va en la masa de la pastafrola y del crumble del recetario.',
    ],
  },

  p04: {
    base: 'prosa de recetas-personales.md ("leche de maní casera cuajada con limón+vinagre y ligada con fécula de mandioca (4 cdas + 4 de agua)", "rinde tipo muzzarella fundente"); funcion de cada línea (limón = acidez que cuaja, fécula = la elasticidad fundente, aceite = untuosidad); técnica estándar: fécula disuelta en frío, señal del hilo elástico',
    flag_gate: true,
    pasos: [
      'Remojar la taza de maní crudo pelado en agua fría durante 4 horas y colarlo. El remojo ablanda el grano y la leche sale más cremosa.',
      'Licuar el maní con las dos tazas de agua bien caliente durante un minuto, hasta que quede un líquido blanco y parejo.',
      'Filtrar con una tela, exprimiendo bien: eso que cae es leche de maní, la base del queso.',
      'Poner la leche de maní en una olla a fuego medio con las 2 cucharadas de jugo de limón, la cucharada de vinagre de manzana, la cucharadita de sal, las 4 cucharadas de levadura nutricional y el cuarto de taza de aceite de oliva. Al romper el hervor, bajar el fuego a mínimo: la acidez ya empezó a cuajar la leche.',
      'Disolver las 4 cucharadas de fécula de mandioca en 4 cucharadas de agua fría y volcarlas en la olla en forma de hilo, revolviendo sin parar.',
      'Seguir revolviendo a fuego bajo unos 5 minutos, hasta que la mezcla se ponga elástica, brillante y haga hilos al levantar la cuchara. Para usarlo fundente va del fuego a la pizza sin escalas, y para bloque, pasarlo caliente a un recipiente apenas pincelado con aceite y dejarlo enfriar.',
    ],
  },

  p05: {
    base: 'prosa de recetas-personales.md ("tofu + levadura + limón + fécula, cocido hasta espesar"); funcion de cada línea (agua = textura, fécula = espesa, vinagre = potencia lo quesoso, cúrcuma = color); técnica estándar: escurrir el tofu, fécula disuelta en frío, señal de espesado y despegue',
    flag_gate: true,
    pasos: [
      'Escurrir bien los 200 g de tofu firme, apretándolo entre las manos o con un repasador: cuanta menos agua traiga, más sabor concentra la crema.',
      'Procesarlo con las 3 cucharadas de levadura nutricional, la cucharada de jugo de limón, las 2 cucharadas de aceite de oliva, la media cucharadita de sal y la media taza de agua —o de bebida vegetal— hasta que quede una crema lisa, sin grumos.',
      'Si los usás, sumar el diente de ajo, el cuarto de cucharadita de cúrcuma —que es puro color— y la cucharadita de vinagre de manzana, que empuja el sabor a queso, y dar un golpe más de procesadora para integrarlos.',
      'Volcar la crema en una olla chica a fuego medio y revolver hasta que empiece a burbujear.',
      'Disolver la cucharada de fécula de maíz en un chorrito de agua fría, agregarla a la olla y seguir revolviendo dos o tres minutos, hasta que espese y se despegue de las paredes al pasar la cuchara.',
      'En caliente es un dip para untar ya mismo. Si lo querés en bloque, pasarlo a un molde y dejarlo enfriar en la heladera hasta que tome firmeza.',
    ],
  },

  p06: {
    base: 'prosa de recetas-personales.md ("procesado caliente y cocido revolviendo hasta elástico", "horno fuerte 220-250°", "2 papas medianas = 300-350 g; ½ taza agua de cocción"); funcion de cada línea (fécula de mandioca = LA elasticidad, agua = ajustar textura de a poco); técnica estándar: señal del cuchillo en la papa, despegue del fondo, cuchara húmeda',
    flag_gate: true,
    pasos: [
      'Pelar las dos papas medianas —unos 300 a 350 gramos—, cortarlas en cubos y hervirlas hasta que un cuchillo entre sin resistencia. Antes de colar, reservar media taza del agua de cocción.',
      'Procesar las papas todavía calientes con las 2 cucharadas colmadas de fécula de mandioca, las 3 cucharadas de levadura nutricional, las 2 de aceite de oliva, la cucharada de jugo de limón, la media cucharadita de sal y, si lo usás, el diente de ajo chico. En caliente el almidón trabaja a favor y la crema sale lisa.',
      'Agregar el agua de cocción reservada de a poco, procesando entre tanda y tanda, hasta lograr una crema espesa que caiga pesada de la cuchara, no líquida.',
      'Pasar la crema a una olla a fuego medio-bajo y revolver sin parar 3 a 5 minutos. Está listo cuando se vuelve brillante, elástico y se despega solo del fondo de la olla.',
      'Repartirlo con una cuchara húmeda —para que no se pegue— sobre la pizza ya armada, y llevar a horno fuerte, de 220 a 250 grados, hasta que tome color por arriba.',
    ],
  },

  p07: {
    base: 'prosa de recetas-personales.md ("las semillas van mejor molidas gruesas (lino entero pasa de largo)"); funcion de cada línea (aceite = arenado, sal = o 1 cdta azúcar si es dulce, polvo de hornear = esponjosa, semillas = chía/sésamo/lino/amapola); pasos viejos ("NO sobreamasar", "pinchar base"); técnica estándar: reposo que relaja la masa',
    flag_gate: true,
    pasos: [
      'Moler gruesas las 3 cucharadas de semillas —chía, sésamo, lino, amapola, las que haya—. Enteras pasan de largo, sobre todo el lino: molidas es como de verdad se aprovechan.',
      'Mezclar en un bol la taza de harina integral, la media taza de harina común, las semillas y la media cucharadita de sal. Si la tarta va dulce, cambiar la sal por una cucharadita de azúcar. Y si lo usás, acá entra también la cucharadita de polvo de hornear, que da una masa más esponjosa.',
      'Agregar las 3 cucharadas de aceite de oliva y frotar con la punta de los dedos hasta que todo quede como arena húmeda, sin pegotes grandes.',
      'Sumar la media taza de agua de a poco, amasando apenas hasta que la masa se una. Tierna y lisa alcanza: NO sobreamasar, porque el trabajo de más la endurece.',
      'Dejarla reposar 10 minutos tapada, para que se relaje y se deje estirar sin encogerse, y estirarla a 3 o 4 milímetros de espesor.',
      'Forrar el molde aceitado, pinchar la base con un tenedor para que no se infle, y prehornear 10 minutos a 180 grados si el relleno va húmedo, o rellenar directo y hornear todo junto.',
    ],
  },

  p09: {
    base: 'prosa de recetas-personales.md ("las verduras se hierven y se licúan como base, sin sofrito en aceite", "tu remojo de 8 h a las lentejas no es obligatorio pero sí reduce fitatos — recomendado"); pasos viejos (2 tazas para las verduras, 3 al guiso, papas 20 min, condimentos 5 min); técnica estándar: señal de lenteja tierna y papa que se deshace',
    flag_gate: true,
    pasos: [
      'Si podés, remojar los 150 g de lentejas —tres cuartos de taza— desde la noche anterior, unas 8 horas. Cocinan bien sin remojo, pero remojadas se digieren mejor y sueltan lo que traba la absorción de sus minerales. Enjuagarlas antes de usar.',
      'Hervir la media cebolla, la zanahoria y el morrón —uno verde y medio rojo— en una olla con 2 tazas de agua durante 10 minutos, hasta que estén blandos.',
      'Licuar las verduras con su propia agua de cocción hasta que quede una crema lisa. Esa base licuada hace de sofrito y de crema a la vez: el guiso sale liviano y con cuerpo sin una gota de aceite.',
      'Volver la base a la olla con las 2 cucharadas de salsa de tomate, las lentejas escurridas y las 3 tazas de agua restantes, y llevar a hervor a fuego medio.',
      'Sumar los 450 g de papa en cubos —dos papas grandes— y cocinar 20 a 25 minutos a fuego medio-bajo, hasta que las lentejas estén tiernas y los bordes de la papa empiecen a deshacerse en el caldo.',
      'Condimentar con las 2 cucharadas de orégano, la cucharada de pimentón dulce y la cucharadita de sal, y darle 5 minutos más a fuego bajo para que se integren. Apagar y dejarlo asentar un ratito: espesa solo.',
    ],
  },

  p10: {
    base: 'prosa de recetas-personales.md ("el bagazo de P01 (300 g)", "congeladas ANTES de empanar", "sólidas se rebozan sin romperse", "residuo cero"); funcion de cada línea (avena = liga seca, harina de maíz = liga y cuerpo, leche vegetal = ajustar masa, pan = empanado final, pimentón = + sal, curry, ajo en polvo); técnica estándar: señal de masa moldeable',
    flag_gate: true,
    nota: 'La línea del pimentón trae "+ sal, curry, ajo en polvo" como parte del condimento: se nombran como opcionales aunque no tengan línea propia.',
    pasos: [
      'Poner en un bol grande los 300 g de okara —el bagazo que queda al filtrar la leche de soja casera, que sirve tal cual— junto con los 125 g de avena instantánea y los 125 g de harina de maíz blanca, que son la liga seca de la masa.',
      'Condimentar con las 2 cucharaditas de provenzal, la cucharadita de pimentón ahumado y sal, y si te gustan, curry y ajo en polvo. Mezclar en seco hasta que el condimento quede repartido parejo.',
      'Agregar la leche vegetal de a poco, unos 100 ml, mezclando con la mano hasta que la masa se unifique y se deje moldear sin pegotearse ni desgranarse.',
      'Formar unas 8 milanesas aplastando porciones entre las palmas, acomodarlas separadas en una bandeja y llevarlas al freezer SIN empanar, hasta que estén bien duras.',
      'Ya congeladas, pasarlas por los 100 g de pan integral rallado apretando para que se pegue, y devolverlas al freezer. Duras se rebozan enteras, sin quebrarse, y quedan listas para cocinarse directo del freezer el día que haga falta.',
    ],
  },

  p12: {
    base: 'prosa de recetas-personales.md ("el almíbar entra DE A POCO al final para regular dulzor", "el seitán (P08) en cubos absorbe el curry", fuente citada Directo al Paladar / Jack Monroe); funcion de cada línea (durazno = "la rareza golosa: escurrido y picado; el almíbar aparte", gluten_trigo = P08 en cubos tamaño garbanzo, pimienta = activa curcumina R8); técnica estándar: señal de transparencia del sofrito, enjuague del envase del tomate',
    flag_gate: true,
    nota: 'El seitán no aparecía en ningún paso viejo: entra en cubos junto con los duraznos y los garbanzos. El "ají" de los pasos viejos es la línea de pimentón picante (la unidad dice ají o cayena).',
    pasos: [
      'Escurrir la lata de duraznos en almíbar reservando el almíbar en un vaso —es la rareza golosa de esta receta y se usa al final— y picar los duraznos en cubos. Cortar también los 100 g de seitán (gluten de trigo) en cubos tamaño garbanzo: los bifecitos de seitán ya hervidos van perfecto.',
      'Sofreír en una olla con un chorro de aceite, a fuego medio-suave, la cebolla picada, los 2 dientes de ajo y el ají (o cayena, o pimentón picante, lo que tengas), hasta que la cebolla se vea transparente.',
      'Sumar las dos cucharaditas de comino y sal, y enseguida los duraznos picados, los cubos de seitán y los 400 g de garbanzos cocidos. Dar unas vueltas para que todo se impregne del sofrito.',
      'Agregar los 400 g de tomate triturado, la cucharadita de cúrcuma y la media cucharadita de pimienta negra. La pimienta acá no es adorno: es lo que hace que la curcumina de la cúrcuma se absorba. Si lo usás, el medio cubito de caldo de verduras entra en este momento.',
      'Cocinar a fuego lento unos 30 minutos, revolviendo cada tanto, hasta que la salsa espese y todo tome el color del curry. Si se va secando, aflojar con un poco de agua — la de enjuagar el envase del tomate, que acá no se desperdicia nada.',
      'Probar y recién entonces sumar el almíbar reservado DE A POCO, en chorritos, probando entre uno y otro: tiene que quedar apenas dulce, nunca empalagoso.',
    ],
  },

  p13: {
    base: 'prosa de recetas-personales.md ("dorado fuerte de gajos + braseado 30 min en vinagre:soja:azúcar 125:75:5 con ajos enteros y laurel", "agridulce-salado-ácido"); funcion de cada línea (aceite = dorado inicial, vinagre = el ácido del adobo, salsa de soja = importante: baja en sal, azúcar = toque); técnica estándar: tandas sin encimar, reducción destapada a fuego fuerte, señal del cuchillo',
    flag_gate: true,
    pasos: [
      'Cortar la coliflor entera en 8 gajos grandes, tratando de que cada uno conserve parte del tronco para que no se desarme, y salpimentarlos.',
      'Calentar los 40 ml de aceite de oliva en una sartén amplia a fuego fuerte y dorar los gajos 4 minutos de un solo lado, en tandas para no encimarlos: tienen que quedar bien tostados de esa cara, porque ese dorado es la base de sabor del plato.',
      'Volver todos los gajos a la sartén con el lado crudo hacia abajo y agregar 60 ml de agua.',
      'Batir en un bol los 125 ml de vinagre de arroz, los 75 ml de salsa de soja —importa que sea baja en sal, porque la salsa después reduce y la sal se concentra— y los 5 g de azúcar mascabo, y volcar sobre la coliflor. Repartir los 6 dientes de ajo enteros y pelados y las 3 hojas de laurel. Si lo usás, el ají fresco también entra acá.',
      'Tapar y cocinar a fuego medio-bajo unos 30 minutos, agitando la sartén cada tanto para que nada se pegue. Está en su punto cuando el cuchillo entra pero todavía hace un poco de fuerza: tierna por fuera, entera por dentro.',
      'Destapar, subir a fuego fuerte y dejar que la salsa reduzca hasta ponerse brillante y napar los gajos. Recién acá se prueba y se corrige, porque antes de reducir el agridulce engaña.',
      'Servir con la cebolla de verdeo picada por encima, cortada a último momento. Si lo sumás, acompañar con una taza de arroz integral cocido aparte.',
    ],
  },

  p14: {
    base: 'prosa de recetas-personales.md ("licuado directo de cocidos", "sin cocción extra", "un toque de comino y limón la redondea (R1 de paso)"); funcion de cada línea (manzana = la crema dulce contra el amargor, limón = redondea + R1, agua = taza caliente o aquafaba); utensilio_recomendado (minipimer); técnica estándar: golpe de calor sin hervor',
    flag_gate: true,
    pasos: [
      'Poner en la licuadora —o en un jarro alto, si vas con la minipimer— las 2 tazas de garbanzos cocidos, la taza de espinaca cruda, la manzana roja pelada y en trozos, la taza de agua caliente (o de aquafaba, el caldito de los mismos garbanzos) y el chorro generoso de aceite de oliva. La manzana no es adorno: su dulzor es lo que compensa el amargor de la espinaca cruda.',
      'Si los usás, la media cucharadita de comino y el jugo de medio limón entran acá: el comino la hace más honda y el limón, además de redondearla, ayuda a que el hierro de la espinaca se absorba.',
      'Licuar unos 2 minutos, hasta que quede una crema homogénea, sin tropezones de garbanzo. Salar a gusto.',
      'Servir directo —el agua caliente ya la deja tibia— o calentarla un par de minutos en una cacerola a fuego medio hasta que humee.',
    ],
  },

  p15: {
    base: 'prosa de recetas-personales.md ("calabaza asada (no hervida: menos agua = menos harina)", "la MENOR harina posible en la masa, la forma se da con la harina de la mesada", "frutos secos remojados 4 h licuados + sofrito"); funcion de cada línea (harina = LA MENOR POSIBLE, sal = + nuez moscada + ajo en polvo, almendras = salsa: remojo 4 h, morrón = mitad rojo mitad verde); técnica estándar: ñoquis flotan = listos, agua de a poco en la crema',
    flag_gate: true,
    nota: 'La salsa entera era un solo paso viejo para cinco ingredientes. El remojo de 4 h de los frutos secos es previo y pasivo: se declara de entrada y no entra en los 40 min de preparación declarados.',
    pasos: [
      'Poner a remojar en agua fría, con 4 horas de anticipación, las 2 tazas de almendras, nueces y cajús: van a ser la crema de la salsa, y sin ese remojo no licúan fino.',
      'Asar los 500 g de calabaza al horno hasta que un cuchillo entre sin resistencia, y hervir los 500 g de papa con cáscara hasta que estén tiernas. La calabaza va asada y no hervida a propósito: pierde agua en el horno y después pide menos harina.',
      'Pisar la calabaza y la papa pelada juntas hasta un puré liso, y condimentar con la cucharadita de sal, nuez moscada y ajo en polvo. Si la usás, sumar también las 2 cucharadas de levadura nutricional.',
      'Agregar la harina DE A POCO, mezclando apenas, hasta lograr una masa blanda que se pueda trabajar sin pegarse: de los 700 g usá los menos que puedas, porque cuanta menos harina va adentro, más tierno sale el ñoqui.',
      'Formar choricitos sobre la mesada MUY enharinada, cortarlos en ñoquis y marcarlos con tenedor si querés el clásico. La forma se la da la harina de afuera, no la de adentro: por eso la mesada va generosa y la masa no.',
      'Para la salsa, escurrir los frutos secos y licuarlos con agua limpia, agregándola de a poco, hasta una crema lisa y espesa que caiga de la cuchara.',
      'Sofreír en una sartén con las 2 cucharadas de aceite de oliva la cebolla, la cebolla de verdeo y el morrón —mitad rojo, mitad verde— picados, hasta que la cebolla esté transparente. Unir con la crema de frutos secos, salpimentar y mantener a fuego mínimo.',
      'Hervir los ñoquis en abundante agua con sal, en tandas: cuando flotan, están listos. Si alguno queda pegado al fondo, despegarlo con cuchara antes de que retome el hervor. Servirlos enseguida con la salsa por encima.',
    ],
  },

  p16: {
    base: 'prosa de recetas-personales.md ("el agua de remojo de los hongos vuelve al final"); funcion de cada línea (hongos = remojar; EL AGUA SE GUARDA, pimentón = + sal, pimienta, ajo en polvo); pasos viejos (saltear con ajo + vino + soja hasta secar, ~¼ taza del agua colada); técnica estándar: escurrir apretando, señal de transparencia',
    flag_gate: true,
    pasos: [
      'Hidratar los 100 g de soja texturizada en agua caliente y, en otro bol, remojar la media taza de hongos de pino secos. EL AGUA SE GUARDA: colada, es puro sabor concentrado y vuelve al final de la receta.',
      'Escurrir la texturizada apretándola bien con las manos y saltearla en una sartén con un chorro de aceite a fuego medio-alto, junto con el diente de ajo picado, el chorro de salsa de soja y —si lo usás— el chorro de vino tinto, hasta que se seque y tome color. Reservar.',
      'En la misma sartén, sofreír la cebolla picada hasta que se vea transparente y sumar los hongos remojados y picados un par de minutos más, hasta que larguen perfume.',
      'Volver la texturizada a la sartén, unir todo y condimentar con la cucharadita de pimentón ahumado, sal, pimienta y ajo en polvo.',
      'Verter un cuarto de taza del agua de remojo de los hongos, colada, y cocinar revolviendo hasta que el relleno quede jugoso pero no aguado. Probar, corregir, y listo: este relleno después arma tartas, empanadas, canelones o el pastel de papas.',
    ],
  },

  p17: {
    base: 'prosa de recetas-personales.md ("remolacha y papa cruda ralladas (jugosidad + color meat)", "freezar y cocinar congeladas = la anti-desarme", "15 unidades: batch total"); funcion de cada línea (papa = jugosidad, remolacha = color meat + dulzor, harina de garbanzo = liga proteica, avena = liga, pimentón = + sal, pimienta, ajo/cebolla en polvo, orégano); técnica estándar: escurrido a mano de la texturizada',
    flag_gate: true,
    nota: 'La cocción declarada es 0 porque el batch termina congelado en placa: la cocción real es al momento de comerlas, siempre desde el freezer.',
    pasos: [
      'Hidratar los 200 g de soja texturizada en agua caliente, escurrirla y apretarla bien con las manos: cuanta menos agua le quede, mejor liga después.',
      'Saltear la cebolla grande picada en una sartén con un chorro de aceite hasta que se vea transparente, sumar la texturizada escurrida y —si lo usás— un chorro de salsa de soja, y cocinar revolviendo hasta que se seque y tome color.',
      'Rallar la papa grande y la remolacha CRUDAS, sin cocción previa, y ponerlas en un bol amplio. La papa cruda es la jugosidad de la hamburguesa; la remolacha pone el color a carne y un toque dulce.',
      'Sumar al bol la texturizada salteada, los 100 g de harina de garbanzo, los 100 g de avena instantánea, la cucharadita de pimentón ahumado, sal, pimienta, ajo y cebolla en polvo y orégano. Si las sumás, las 2 cucharadas de chía ayudan a ligar. Mezclar con las manos hasta integrar.',
      'Dejar reposar la mezcla 20 minutos en la heladera. Va a seguir estando chirla y no es un problema: la avena y la harina absorben durante el reposo, y del resto se encarga el frío.',
      'Formar las hamburguesas —salen unas 15, el lote entero del mes— y llevarlas al freezer en una placa, con separadores para que no se peguen entre sí.',
      'Cocinarlas SIEMPRE CONGELADAS, directo del freezer a la sartén o al horno: es durante esa cocción que se aglutinan y quedan enteras. Descongeladas antes, se desarman.',
    ],
  },

  p18: {
    base: 'prosa de recetas-personales.md ("11 min mínimo + 15 s fuerte + 10 min reposo sin destapar; sushizu 80/20 alcohol/manzana", "relleno criollo tuyo (tomate seco + shiitake)"); funcion de cada línea (arroz = lavado hasta agua transparente, agua = regla: por kilo, 1200 ml, vinagre = 80% alcohol + 20% manzana); pasos viejos (OLLA TAPADA SIEMPRE, sin pispear, nori brillante abajo, 2 cm libres); técnica estándar: armado del roll',
    flag_gate: true,
    pasos: [
      'Lavar los 250 g de arroz doble carolina cambiándole el agua las veces que haga falta, hasta que salga transparente: sin ese lavado, el almidón suelto hace engrudo.',
      'Poner el arroz en una olla con los 300 ml de agua —un 20 % más de agua que de arroz; si escalás, van 1200 ml por kilo— y tapar. La olla queda TAPADA SIEMPRE, de acá hasta el final: cada levantada de tapa deja escapar el vapor que cocina el arroz.',
      'Llevar a hervor a fuego fuerte y, apenas rompe, bajar a fuego minimísimo y contar 11 minutos exactos por reloj. Sin pispear.',
      'Cumplidos los 11 minutos, subir a fuego fuerte 15 segundos y apagar: ese golpe final evapora el agua que queda en el fondo, y es la diferencia entre un arroz suelto y uno apelmazado.',
      'Dejar reposar 10 minutos con el fuego apagado y la olla todavía tapada. Recién ahí se puede destapar.',
      'Mientras el arroz se cocina, preparar el sushizu: batir los 50 ml de vinagre —80 % de alcohol y 20 % de manzana—, los 25 g de azúcar y la cucharadita de sal entre 5 y 10 minutos, hasta que no quede un solo grano sin disolver.',
      'Volcar el sushizu sobre el arroz EN CALIENTE, mezclando con movimientos envolventes y sin aplastar los granos: caliente absorbe el aliño, aplastado se hace pasta.',
      'Armar los rolls recién cuando el arroz esté frío: la hoja de nori con el lado brillante hacia abajo, una capa fina de arroz dejando 2 cm libres en el borde de arriba para poder cerrar, y el relleno al medio — si los sumás: tomates secos, los shiitake remojados, bastones de pepino, zanahoria en juliana o champiñones. Salen 3 rolls.',
    ],
  },

  p19: {
    base: 'prosa de recetas-personales.md ("capa de queso de maní P04 al medio", "el limón al final del relleno es tu firma (R1, además)", "gratinar fuerte"); funcion de cada línea (papa = puré con aceite + levadura + nuez moscada, limón = levanta el relleno (y R1), maní = capa de muzza de maní al medio); pasos viejos (puré maleable pero consistente, 10 min fuego bajo); técnica estándar: señal de gratinado y reposo',
    flag_gate: true,
    pasos: [
      'Hervir el kilo de papas hasta que un cuchillo entre sin esfuerzo y hacer un puré con un chorro de aceite, las 3 cucharadas de levadura nutricional, nuez moscada y sal. Tiene que quedar maleable pero consistente: que conserve la forma en el plato, no que se desparrame.',
      'Hidratar los 250 g de soja texturizada en agua caliente y escurrirla apretándola bien con las manos.',
      'Saltear en una sartén amplia con un chorro de aceite la cebolla grande, el morrón rojo y los 2 dientes de ajo picados, hasta que la cebolla se vea transparente. Sumar la texturizada, el chorrito de salsa de soja y —si lo usás— el chorrito de vino tinto, y dejar que evapore.',
      'Agregar las 4 cucharadas de puré de tomate y la cucharadita colmada de pimentón ahumado, y cocinar 10 minutos a fuego bajo, hasta que el relleno quede jugoso y con la salsa apenas espesa.',
      'Apagar el fuego y recién ahí exprimir la cucharada de jugo de limón sobre el relleno. El limón va AL FINAL y fuera del fuego: así conserva la chispa que levanta todo el relleno, y de paso ayuda a que el hierro se absorba.',
      'Armar en una fuente de 28 × 22: una base de puré, el relleno completo y —si lo usás— el queso de maní repartido en una capa pareja por el medio. Tapar con el resto del puré.',
      'Llevar a horno moderado hasta que la superficie gratine y tome color dorado. Dejarlo reposar un buen rato antes de cortar — y si llega al día siguiente, corta perfecto y hasta gana en sabor.',
    ],
  },

  p20: {
    base: 'prosa de recetas-personales.md ("la salsita picante de verdeo+pimentón+ají con seitán aparte", "zapallo que se deshace", remojo 24 h, "cocción total ~2 h"); funcion de cada línea (calabaza = "se deshace = la crema del locro", hongos = "contra el final", nori = "ablanda legumbres", 4 cda de coco = "salsita picante"); técnica estándar: agua nueva tras el remojo, pimentón fuera del fuego',
    flag_gate: true,
    pasos: [
      'Remojar las 2 tazas de maíz blanco partido y la taza de porotos pallares en abundante agua fría desde la víspera: necesitan 24 horas. Tirar el agua del remojo antes de cocinar.',
      'Poner maíz y pallares en una olla grande con agua nueva que los cubra por cuatro dedos y llevar a hervor. Si lo usás, el puñado de algas nori entra acá —o una cucharadita de bicarbonato—, para que las legumbres se ablanden bien. Bajar a fuego moderado y cocinar más o menos una hora.',
      'Pasada esa hora, sumar los 750 g de calabaza —cabutia o zapallo plomo— en cubos grandes, la batata en cubos, la cebolla y el puerro picados y la cucharada de aceite de coco. Condimentar con la cucharadita de sal y pimienta.',
      'Seguir a fuego moderado, revolviendo cada tanto y raspando el fondo para que no se pegue. En la última media hora sumar los 100 g de hongos secos, de pino.',
      'Esperar a que la calabaza se deshaga por completo y el caldo quede espeso y anaranjado: esa es la señal. Recién ahí sumar la cucharada de pimentón y la cucharadita de comino, revolver y apagar.',
      'La salsita se hace aparte: calentar las 4 cucharadas de aceite de coco en una sartén a fuego medio y rehogar las 2 cebollas de verdeo picadas con los 200 g de bifecitos de seitán en cubos y los 2 dientes de ajo picados, hasta que el verdeo esté tierno y el seitán dorado.',
      'Retirar la sartén del fuego y recién entonces sumar la cucharada de pimentón con ají molido y una pizca de sal: fuera del fuego, porque el pimentón se quema en segundos y amarga.',
      'Servir el locro bien caliente con la salsita en un bol aparte, para que cada uno le ponga el picante que quiera.',
    ],
  },

  p21: {
    base: 'funcion de cada línea (lino = "huevo vegano", avena = aglutinante, pan = "ajustar consistencia", pimentón ahumado = "parrilla", aduki = "pisados parcial: textura"); pasos viejos (rehogado, reposo 20-30 min en heladera, sartén 3-4 min por lado u horno 200°); técnica estándar: gel del lino, señal de dorado',
    flag_gate: true,
    nota: 'Los 10 minutos de cocción del encabezado son los de la sartén: la alternativa al horno tarda 20-25 y queda como opción.',
    pasos: [
      'Preparar el huevo de lino: mezclar las 2 cucharadas de lino molido con 5 de agua y dejarlo descansar mientras seguís con el resto, hasta que tome consistencia de gel. Es lo que va a ligar la masa.',
      'Rehogar en una sartén con un poco de aceite la cebolla picada, los 2 dientes de ajo y el medio morrón rojo en cubitos, a fuego medio hasta que la cebolla esté transparente. Sumar la zanahoria rallada fina, darle 2 minutos más y dejar entibiar.',
      'Pisar las 2 tazas de porotos aduki cocidos con un tenedor, dejando una parte de los porotos enteros: ese pisado a medias es lo que da la textura.',
      'Mezclar todo junto y A MANO en un bol grande: los aduki, el sofrito, la media taza de avena arrollada fina, el huevo de lino, la cucharada de salsa de soja, la cucharadita de pimentón ahumado —el gusto a parrilla sale de acá— y la cucharadita de comino.',
      'Ajustar la consistencia con la media taza de pan integral rallado hasta lograr una masa húmeda que no se desarme, con más pan o más avena si hace falta. Si los usás, acá entran también la cucharada de levadura nutricional, el chorrito de limón y el perejil o cilantro picado.',
      'Formar los 6 a 8 medallones y llevarlos a la heladera entre 20 y 30 minutos: fríos se afirman y no se abren al cocinarlos.',
      'Cocinarlos en una sartén apenas aceitada a fuego medio, 3 a 4 minutos por lado, o al horno a 200° entre 20 y 25 minutos dándolos vuelta a la mitad. Están cuando la costra quedó dorada y firme.',
    ],
  },

  p22: {
    base: 'prosa de recetas-personales.md ("el tofu desmenuzado + levadura + fécula = ricota", usa masa P07); funcion de cada línea (tofu = "la ricota", fécula = liga); técnica estándar: evaporar el agua de los zapallitos, fondo pinchado, señal de horno',
    flag_gate: true,
    nota: 'El paso viejo tiraba "semillas por encima" que no existen como línea de la receta: se sacan.',
    pasos: [
      'Precalentar el horno a 180°. Forrar un molde de tarta aceitado con la masa integral para tartas y pinchar el fondo con un tenedor para que no se infle.',
      'Saltear la cebolla picada y el diente de ajo en las 2 cucharadas de aceite de oliva a fuego medio, hasta que la cebolla esté transparente.',
      'Sumar los 3 zapallitos redondos en cubos chicos y cocinar 5 a 7 minutos: primero sueltan el agua y hay que seguir hasta que se evapore, o la tarta sale aguachenta. Agregar la zanahoria rallada, darle 3 minutos más y apagar.',
      'Hacer la ricota: desmenuzar los 200 g de tofu firme con las manos y mezclarlo con las 2 cucharadas de fécula de maíz, la cucharada de jugo de limón —o de vinagre de manzana— y, si las usás, las 2 cucharadas de levadura nutricional y la cucharadita de cúrcuma. La fécula liga y el limón pone el acidito de ricota. Si quedó seca, aflojar con una o dos cucharadas de agua.',
      'Unir las verduras con la ricota y probar: rectificar de sal y pimienta y, si los usás, sumar la cucharadita de orégano y una rallada de nuez moscada.',
      'Volcar el relleno sobre la masa, emparejar y hornear a 180° entre 35 y 40 minutos, hasta que esté firme al centro y con los bordes dorados. Dejarla entibiar antes de cortar, que asentada corta mejor.',
    ],
  },

  p23: {
    base: 'prosa de recetas-personales.md (gluten:harina 2:1, "amasado 2 min MAX", "cocción 60 min SIN hervir", "enfriado en el caldo", miso = "microdetalle marino"); funcion de cada línea (caldo = "NO sal en la masa", mostaza = estructura, alcaparras = "el carácter tonnato"); técnica estándar: film flojo porque crece, fetas con el seitán bien frío',
    flag_gate: true,
    pasos: [
      'Mezclar en un bol la taza y media de gluten de trigo con los tres cuartos de taza de harina 000 y, si la usás, las 2 cucharadas de levadura nutricional. Nada de sal acá: la va a poner el caldo. Dos partes de gluten por una de harina es la proporción del falso peceto suave.',
      'Mezclar aparte los líquidos: los tres cuartos de taza de caldo de verduras frío, las 2 cucharadas de salsa de soja, la cucharadita de mostaza suave —que ayuda a la estructura de la masa— y la cucharada de aceite neutro. Volcar sobre los secos e integrar.',
      'Amasar DOS MINUTOS como máximo, apenas hasta que quede parejo: si seguís, el gluten se tensa y el seitán sale de goma. Dejar descansar 20 minutos y formar un cilindro envuelto en film apto cocción o en una gasa, atado flojo, porque crece al cocinarse.',
      'Poner a hervir 2 litros de caldo con 2 cucharadas más de salsa de soja en una olla donde el cilindro entre acostado. Cuando rompa el hervor, bajar el fuego al MÍNIMO, meter el seitán y cocinarlo 60 minutos SIN hervir: el caldo apenas se tiene que mover. Si hierve, se esponja y pierde la textura de peceto.',
      'Apagar y dejarlo enfriar DENTRO del caldo. Después, heladera de 6 a 12 horas: bien frío es la única forma de cortarlo en fetas finas sin que se rompa.',
      'La tonnata: poner en la procesadora la taza de mayonesa vegana, la media taza de tofu firme, las 2 cucharadas de alcaparras lavadas, la cucharada colmada de mostaza de Dijon, la cucharada de jugo de limón y la cucharadita de vinagre de vino blanco. Si lo usás, la cucharadita de miso blanco entra acá: el detalle que le pone recuerdo a mar. Procesar hasta que quede lisa, espesa pero fluida.',
      'Probar la tonnata y ajustar: más limón si la querés más viva —el ácido le corta la grasa a la mayonesa y hace lucir las alcaparras—, un chorrito de aceite si se pasó de ácida.',
      'Cortar el seitán en fetas finas, acomodarlas apenas superpuestas en una fuente y cubrirlas con una capa generosa de salsa. Volver a la heladera de 6 a 24 horas —ahí el plato se termina de hacer— y al servir terminar con alcaparras enteras, el perejil picado si lo usás, un hilo de aceite de oliva y pimienta.',
    ],
  },

  p25: {
    base: 'prosa de recetas-personales.md ("remolacha + banana pisada + limón + comino", "la curiosa del doc"); unidad de cada línea (hervida_en_cubitos, pisada); técnica estándar: hervir con piel, señal del cuchillo',
    flag_gate: true,
    nota: 'El paso viejo arrancaba con la remolacha ya hervida y el encabezado declara 20 minutos de cocción: el hervor ahora es un paso.',
    pasos: [
      'Hervir la remolacha entera y con piel hasta que un cuchillo la atraviese sin esfuerzo: unos 20 minutos si es chica. Dejarla entibiar, pelarla —la piel sale casi sola— y cortarla en cubitos.',
      'Pisar la banana con un tenedor en un bol, hasta un puré rústico con algún pedacito entero.',
      'Sumar la remolacha en cubitos, el chorrito de limón, la media cucharadita de comino y una pizca de sal, y mezclar. El limón es el que amarra lo dulce de la banana con lo terroso de la remolacha.',
      'Servir fresca y comerla en el día, que la banana pisada no espera a nadie. Sí, es la ensalada más rara del recetario: por eso está.',
    ],
  },

  p26: {
    base: 'funcion de cada línea ("calientes = más sedoso", "más coco = más sólida al enfriar") y sustitutos (dátiles, mitad girasol); paso viejo (agua de cocción para aflojar); técnica estándar: bajar las paredes, envasar',
    flag_gate: true,
    pasos: [
      'Partir de las 2 tazas de porotos negros cocidos y todavía calientes —van igual de bien los aduki o los blancos—: calientes se licúan a una crema mucho más sedosa que fríos.',
      'Licuar los porotos con la media taza de cacao amargo, la taza de azúcar mascabo —o menos, o reemplazada por una taza de dátiles—, la media taza de aceite de coco y la pizca de sal.',
      'Sumar, si las usás, la cucharadita de esencia de vainilla y la media cucharadita de canela, con un golpe más de licuadora.',
      'Seguir licuando, parando a bajar lo que sube por las paredes, hasta que quede tersa y no se sienta el poroto. Si a la licuadora le cuesta, aflojar con un chorrito del agua de cocción.',
      'Pasar a un frasco y a la heladera: al enfriarse se endurece por el aceite de coco. Con más coco sale firme, para cortar. Con mitad de girasol, más blanda de untar.',
    ],
  },

  p28: {
    base: 'prosa de recetas-personales.md ("3 ingredientes licuados", el reposo de la mezcla); pasos viejos (2-3 cdas por panqueque, burbujitas = dar vuelta); técnica estándar: sartén apenas aceitada a fuego medio',
    flag_gate: true,
    pasos: [
      'Licuar la media taza de avena con la media banana —o una chica entera— y el cuarto de taza de bebida de soja o de agua, hasta que no queden grumos. Si la mezcla quedó muy espesa, un chorrito más de líquido.',
      'Agregar, si los usás, la cucharadita de lino o chía, la cucharada de cacao amargo, las gotas de esencia de vainilla y la cucharadita de azúcar mascabo, y dar otro golpe de licuadora para integrar.',
      'Dejar descansar la mezcla 5 minutos en el vaso de la licuadora: en ese rato la avena se hidrata y después los panqueques se dan vuelta enteros, sin quebrarse.',
      'Calentar una sartén o panquequera a fuego medio con unas gotas de aceite y verter 2 o 3 cucharadas de mezcla por panqueque. Cuando la superficie se llene de burbujitas, dar vuelta y dorar el otro lado un minuto. Salen 4.',
    ],
  },

  p29: {
    base: 'pasos viejos (puré con los húmedos, secos aparte, "integrar suave SIN batir", horno bajo 40 min, palillo seco, enfriar antes de desmoldar); técnica estándar: por qué no se bate (gluten), 160° como horno bajo',
    flag_gate: true,
    nota: 'La cucharada de esencia de vainilla, imprescindible en la lista, no aparecía en ningún paso.',
    pasos: [
      'Precalentar el horno bien bajo (160°) y aceitar la budinera.',
      'Pisar las 2 bananas maduras hasta hacer un puré y mezclarlo con la taza de azúcar, la media taza de aceite neutro —girasol va bien—, los dos tercios de taza de bebida vegetal y la cucharada de esencia de vainilla, hasta que quede parejo.',
      'Mezclar aparte los secos: la taza de harina integral superfina y la taza de harina leudante. Si lo usás, la media taza de coco rallado va con ellos.',
      'Volcar los secos sobre los húmedos e integrar con espátula, con movimientos envolventes y SIN batir: apenas deja de verse harina, listo. Batir de más desarrolla el gluten y el budín sale gomoso en vez de esponjoso.',
      'Verter en la budinera y hornear a horno bajo unos 40 minutos, hasta que un palillo clavado en el centro salga seco.',
      'Dejarlo enfriar en el molde antes de desmoldar: caliente todavía está frágil y se quiebra.',
    ],
  },

  p30: {
    base: 'prosa de recetas-personales.md ("sin aceite casi — 1 cda de coco", harina de avena); funcion de la línea de aceite ("única grasa: liviana"); pasos viejos (horno moderado 20-30 min); técnica estándar: secos y húmedos aparte, palillo, enfriar antes de desmoldar',
    flag_gate: true,
    nota: 'Dos pasos para diez ingredientes: el azúcar, la vainilla, el polvo de hornear y las nueces no aparecían en ninguno.',
    pasos: [
      'Precalentar el horno a temperatura moderada (180°) y aceitar la budinera.',
      'Rallar las 2 zanahorias y mezclarlas en un bol con la taza de agua, la cucharada de aceite de coco derretido, la media taza de azúcar y la cucharadita de esencia de vainilla. Esa única cucharada de aceite es toda la grasa de la torta: de ahí lo de liviana.',
      'Mezclar aparte los secos: la taza de harina de avena, la media taza de harina integral, el tercio de taza de coco rallado y la cucharada de polvo de hornear.',
      'Unir los secos con los húmedos con movimientos envolventes hasta que no quede harina seca, y sumar al final los 40 g de nueces trituradas.',
      'Volcar en la budinera y hornear entre 20 y 30 minutos, hasta que la superficie esté dorada y un palillo salga seco del centro.',
      'Dejarla enfriar en el molde antes de desmoldar: recién fría corta prolijo.',
    ],
  },

  p31: {
    base: 'prosa de recetas-personales.md ("Membrillo aflojado con agua caliente para esparcir", "200° 25-30 min"); sustitutos de la línea (manteca vegana P03 preferible); técnica estándar: reservar masa para el enrejado, gotas de agua fría si la masa se quiebra, enfriar antes de cortar',
    flag_gate: true,
    pasos: [
      'Batir los 250 g de margarina a temperatura ambiente —o mejor todavía, de manteca vegana casera— con la taza de azúcar impalpable y la ralladura de la cáscara de un limón, hasta formar una pasta pareja.',
      'Sumar de a poco las 2 tazas de harina y la taza de fécula de maíz, integrando sin amasar de más, hasta que se forme un bollo tierno. Si quedó seco y se quiebra, alcanzan unas gotas de agua fría.',
      'Dejar descansar el bollo 10 minutos en la heladera. Después reservar una parte para el enrejado y forrar con el resto un molde de 22 a 25 cm, base y bordes, emparejando con los dedos.',
      'Aflojar los 500 g de dulce de membrillo en una ollita a fuego bajo con un chorrito de agua caliente, pisándolo hasta que quede untable y se pueda esparcir sin romper la masa. Rellenar la base con esa mezcla.',
      'Estirar la masa reservada, cortarla en tiras y armar el enrejado sobre el membrillo.',
      'Hornear a 200° entre 25 y 30 minutos, hasta que el enrejado y los bordes estén dorados. Dejar enfriar antes de cortar: el membrillo sale hirviendo y la masa se asienta al entibiarse.',
    ],
  },

  p32: {
    base: 'pasos viejos ("HÚMEDO" en mayúsculas, enfriar antes de cortar); sustitutos de la avena (harina de arroz/sarraceno/garbanzo: sin gluten); unidades de las líneas (dátiles "taza_remojados", avena "taza_harina"); técnica estándar: el brownie se saca húmedo, palillo con migas',
    flag_gate: true,
    nota: 'La línea de aceite dice oliva en el id pero "taza_girasol" en la unidad: se escribió "de girasol o de oliva" para no contradecir ninguna de las dos.',
    pasos: [
      'Remojar la taza de dátiles descarozados en agua caliente hasta que estén bien blandos, y escurrirlos. Son el único endulzante de estos brownies, así que no escatimar.',
      'Poner en la procesadora las 2 tazas de porotos aduki cocidos, la taza de harina de avena —si la querés sin gluten, va igual de bien con harina de arroz, de sarraceno o de garbanzo—, los dátiles remojados, la media taza de cacao amargo, el cuarto de taza de aceite —de girasol o de oliva—, la taza de agua y la cucharadita de polvo de hornear.',
      'Procesar hasta obtener una pasta homogénea, sin que se adivine ningún pedazo de poroto. Parar y bajar con espátula lo que sube por las paredes si hace falta.',
      'Si los sumás, integrar con cuchara las 2 cucharadas de nibs de cacao y los 30 g de nueces picadas, para que queden enteros y no molidos.',
      'Volcar en una placa forrada con papel manteca, emparejar y hornear a 180° unos 20 minutos. La señal es la contraria a la de una torta: bordes firmes y centro todavía HÚMEDO, con el palillo saliendo con migas mojadas. Si sale seco, se pasó.',
      'Dejar enfriar por completo en la placa antes de cortar: calientes se desarman, fríos se afirman.',
    ],
  },

  p33: {
    base: 'funcion de la línea de girasol ("textura fudge"); pasos viejos (agua de a poco hasta consistencia de mezcla de budín, placa aceitada espolvoreada con cacao); secretos reescritos de cero con otras palabras (el girasol hace de harina y de grasa, el cacao evita el borde blanco); técnica estándar: señal de bordes firmes y palillo con migas',
    flag_gate: true,
    pasos: [
      'Remojar la taza de semillas de girasol —un par de horas alcanza, toda la noche mejor— y escurrirlas bien. Remojadas hacen el trabajo de la harina y de buena parte de la materia grasa: son las que dan la textura fudge, densa, de estos brownies.',
      'Procesar el girasol escurrido con la taza de porotos negros cocidos, el cuarto de taza de aceite de oliva, el cuarto de taza de cacao amargo, los dos tercios de taza de azúcar y la pizca de sal, hasta una pasta lisa. Todavía sin el agua.',
      'Sumar el agua de a chorritos, procesando entre uno y otro, hasta que tome la consistencia de una mezcla de budín: espesa, pero que cae de la cuchara.',
      'Aceitar una placa y espolvorearla con cacao en vez de harina: cumple la misma función y los brownies no quedan con los bordes pintados de blanco.',
      'Volcar la mezcla, emparejar y hornear a 180° entre 20 y 30 minutos, hasta que los bordes estén firmes y el centro apenas húmedo: el palillo tiene que salir con migas, ni limpio ni chorreando.',
      'Dejar entibiar en la placa antes de cortar, que recién salidos no tienen estructura.',
    ],
  },

  p34: {
    base: 'unidad y funcion de la línea de porotos ("taza_de_crema_P26_sin_aceite_coco", "la crema chocoporotos hecha con girasol"); funcion del azúcar ("corteza crocante"); pasos viejos (pisar banana e integrar, 190°); técnica estándar: palillo con migas húmedas',
    flag_gate: true,
    nota: 'Los pasos viejos daban 190° 20-40 min "según molde" y el encabezado declara 25: se dejó 25 como referencia para el molde chico de la receta, el rango como aviso y la señal del palillo mandando.',
    pasos: [
      'Precalentar el horno a 190° y aceitar un molde chico.',
      'Pisar con tenedor la media banana madura —o una chica entera— hasta hacerla puré.',
      'Integrar la banana a la taza de crema chocoporotos —la de porotos negros y cacao, acá en su versión hecha con girasol y sin aceite de coco—. Mezclar hasta que no queden vetas.',
      'Sumar las 2 cucharadas de pasta de maní y la cucharada de polvo de hornear y mezclar hasta una masa pareja. Si los sumás, acá entran los 30 g de nueces picadas y los 30 g de chips de chocolate amargo.',
      'Volcar al molde y, si querés que arriba se forme una costra crocante, espolvorear la cucharada de azúcar sobre la superficie antes de hornear.',
      'Hornear a 190° unos 25 minutos, aunque según el molde puede ir de 20 a 40: la señal que manda es la superficie firme y un palillo que sale con migas húmedas. Es brownie, no budín: seco del todo quiere decir que se pasó.',
    ],
  },

  p35: {
    base: 'prosa de recetas-personales.md ("pre-hervir el arroz 10 min en agua y colar", "leche de coco en dos tiempos"); funcion de cada línea ("que largue almidón", "en dos tiempos"); pasos viejos (agua 2:1, calor residual, leche fría al final); técnica estándar: retirar cáscaras y rama antes de enfriar',
    flag_gate: true,
    pasos: [
      'Pre-hervir los 200 g de arroz —doble carolina, elegido justamente porque suelta mucho almidón— durante 10 minutos en el doble de agua, revolviendo, y colarlo. Ese hervor previo deja buena parte del almidón en el agua, y es lo que después evita que la leche de coco se corte.',
      'Poner en una olla los 500 ml de leche de coco con los 100 g de azúcar, la pizca de sal y las 3 tiras de cáscara de limón, peladas sin nada de la parte blanca, que es la que amarga. Si la usás, sumar la canela: la rama entera o la media cucharadita molida. Llevar a hervor a fuego medio.',
      'Cuando rompe el hervor, sumar el arroz colado y cocinar a fuego bajo, revolviendo cada tanto, hasta que el grano esté tierno. Si la leche reduce demasiado antes de que el arroz llegue, apagar y tapar: termina de cocinarse con el calor residual, sin seguir secándose.',
      'Fuera del fuego, retirar las cáscaras y la rama de canela y, si la usás, perfumar con la cucharadita de esencia de vainilla.',
      'Dejar enfriar y, ya frío, incorporar revolviendo los 150 ml de leche de coco restantes: ese agregado en frío es lo que lo deja cremoso y fresco en vez de apelmazado. A la heladera hasta servir.',
    ],
  },

  p37: {
    base: 'pasos viejos (secos mezclados, margarina derretida con ralladura y jugo, fuente aceitada y enharinada, horno bajo ~30 min); sustitutos de la línea (manteca vegana); técnica estándar: 160° como lectura de "horno bajo", no sobrebatir, señal de bordes que se despegan y centro húmedo',
    flag_gate: true,
    pasos: [
      'Precalentar el horno a temperatura baja, unos 160°, y aceitar y enharinar una fuente chica.',
      'Mezclar en un bol los secos: la taza de azúcar, la taza y media de harina 0000, las 2 cucharadas de fécula de maíz y la cucharada de polvo de hornear.',
      'Derretir los 80 g de margarina —o de manteca vegana, si tenés hecha— y mezclarla con la ralladura y el jugo del limón.',
      'Unir lo húmedo con los secos hasta que no queden restos de harina seca, sin batir de más. Queda una masa espesa, y está bien que así sea.',
      'Volcar en la fuente, emparejar y hornear unos 30 minutos. La señal: bordes dorados que se despegan de la fuente y centro firme al tacto pero todavía húmedo adentro, con el palillo saliendo con migas. Es pariente del brownie, no un bizcochuelo: seco del todo pierde la gracia.',
      'Dejar enfriar en la fuente antes de cortar en cuadrados, que tibios se desarman.',
    ],
  },

  p38: {
    base: 'prosa de recetas-personales.md ("el aceite de coco es lo que les da la mordida de bombón helado"); funcion y sustitutos de la línea de aceite ("girasol u oliva: más blandos"); pasos viejos (freezer 1-1.5 h, "sólidos pero blandos", sacar unos minutos antes); técnica estándar: derretir el coco para que se integre',
    flag_gate: true,
    pasos: [
      'Procesar las 3 bananas maduras con la media taza de cacao amargo y la media taza de aceite de coco —derretido si está sólido, para que se integre— hasta obtener una crema lisa. Si la usás, la cucharadita de esencia de vainilla entra acá.',
      'Si los sumás, incorporar con cuchara los 30 g de nueces picadas y los 30 g de pasas, para que queden repartidos y enteros.',
      'Volcar en un molde de silicona o en una fuente forrada con papel manteca, en una capa pareja.',
      'Llevar al freezer entre 1 hora y 1 hora y media. La señal: sólidos pero todavía blandos, que un cuchillo entre sin astillarlos. El aceite de coco es el que endurece con el frío y les da la mordida de bombón helado. Con girasol u oliva también salen, pero más blandos.',
      'Cortar en bocaditos y guardarlos en el freezer. Sacarlos unos minutos antes de comer, que directo del frío están demasiado duros.',
    ],
  },

  p39: {
    base: 'pasos viejos (sablée con 30 min de frío, crumble a granulado grueso con reposo en freezer, poco crumble en la base "absorbe jugo", crema "sin exceso: humedad", horno suave-moderado ~30 min); usa_preparados P03 y P27 nombrados por su nombre; secreto del horneado en una tanda reescrito de cero; técnica estándar: 170° como lectura de suave-moderado, manzana tierna al pincharla',
    flag_gate: true,
    nota: 'El paso viejo de la masa ("manteca pomada + impalpable + vainilla + harina") omitía los 50 g de fécula que la lista asigna a la masa: se incorporaron ahí.',
    pasos: [
      'Para la masa sablée, trabajar los 125 g de margarina pomada —o de manteca vegana, que es la que usa la receta— con los 75 g de azúcar impalpable y las gotas de esencia de vainilla. Sumar los 150 g de harina y los 50 g de fécula de maíz y unir apenas, sin amasar: cuanto menos se trabaja, más arenosa queda. Envolver en film y llevar 30 minutos a la heladera.',
      'Para el crumble, desgranar con la punta de los dedos los 150 g de margarina bien fría con los 150 g de azúcar y los otros 150 g de harina, hasta un granulado grueso con pedazos. También sale en procesadora, de a pulsos y con todo frío. Guardarlo en el freezer mientras se arma el resto.',
      'Cortar las 3 manzanas verdes en rodajas bien finas, para que se cocinen parejas en el horno.',
      'Forrar el molde de 28 cm con la masa sablée y esparcir sobre la base un puñado del crumble: absorbe el jugo que suelta la manzana y la base no se empapa.',
      'Armar capas de manzana y untar entre capa y capa la crema de vainilegumbres —los 200 g de porotos alubia hechos crema dulce—, sin pasarse, porque de más aporta humedad.',
      'Cubrir con el resto del crumble y hornear a horno suave a moderado —unos 170°— alrededor de 30 minutos, hasta que el crumble esté dorado y la manzana se sienta tierna al pincharla. Va todo al horno en una sola tanda, con la masa cruda abajo: así sale cocida sin resecarse.',
      'Dejar entibiar en el molde antes de cortar, que recién salido el crumble se desarma.',
    ],
  },

  p40: {
    base: 'pasos viejos ("semillas al fondo = enemigo", tapar, noche en heladera, toppings al servir); técnica estándar del pudding de chía: segundo removido a los 10-15 minutos, señal de cuajado que no se vuelca',
    flag_gate: true,
    pasos: [
      'Poner en un frasco las 3 cucharadas de chía, las 2 cucharaditas de cacao amargo y la cucharadita de esencia de vainilla. Si lo endulzás, sumar la cucharadita de azúcar mascabo o unas gotas de stevia.',
      'Verter el vaso de bebida de soja —u otra vegetal— y revolver a conciencia, despegando lo que se asienta: las semillas que se van al fondo son el enemigo.',
      'Tapar y llevar a la heladera toda la noche. A los 10 o 15 minutos vale la pena un segundo removido, antes de que la chía decida quedarse toda abajo. La señal a la mañana: cuajado parejo, con textura de pudding que no se vuelca al inclinar el frasco.',
      'Al servir, coronar con los toppings si los sumás: la media taza de frutillas, la cucharada de nibs de cacao y la cucharada de coco rallado.',
    ],
  },

  p41: {
    base: 'prosa de recetas-personales.md ("indulgente simple de un bowl; banana opcional documentada"); pasos viejos ("ajustar líquido: cada harina absorbe distinto", "palillo seco"); técnica estándar: molde aceitado y enharinado, señal del palillo',
    flag_gate: true,
    pasos: [
      'Encender el horno a 180° y preparar la budinera: aceitada y enharinada, para que el budín después se despegue solo.',
      'Mezclar en un bol la taza y media de harina leudante, la taza de coco rallado y la media taza de azúcar.',
      'Sumar el tercio de taza de aceite y la taza de agua —o de leche vegetal, si preferís— y batir unos minutos, hasta que quede una masa pareja y sin grumos de harina.',
      'Mirar la textura antes de seguir: tiene que caer espesa de la cuchara. Cada harina absorbe distinto, así que si quedó dura se corrige con un chorrito más de líquido.',
      'Si la usás, pisar la banana madura con un tenedor e integrarla a la masa.',
      'Volcar en la budinera y hornear unos 40 minutos a 180°, hasta que un palillo pinchado en el centro salga seco.',
    ],
  },

  p42: {
    base: 'prosa de recetas-personales.md ("curd de limón con agar-agar + maicena", "cúrcuma para el amarillo", "base horneada a mínima + relleno cocido aparte"); funcion de cada línea (agar = gelificante vegetal, cúrcuma = el amarillo); técnica estándar: frío antes del horno para que la masa no se encoja, el agar necesita hervir para gelificar, ralladura fuera del fuego',
    flag_gate: true,
    pasos: [
      'Arrancar por la base: mezclar en un bol la taza y tres cuartos de harina, los dos tercios de taza de azúcar y el cuarto de taza de fécula de maíz. Sumar la taza de aceite de coco y deshacerlo con la punta de los dedos hasta que quede un granulado fino, como arena mojada.',
      'Compactar ese granulado en el molde, subiéndolo apenas para formar un borde que contenga el relleno, y llevarlo a la heladera 30 minutos: la masa fría entra al horno sin deformarse.',
      'Hornear la base a horno mínimo unos 35 minutos, hasta que se vea sequita y apenas dorada en los bordes. Dejarla enfriar por completo antes de seguir: el relleno va siempre sobre base fría.',
      'Para el relleno, poner en una olla los dos tercios de taza de jugo de limón, la taza y un tercio de agua, la taza y cuarto de azúcar, las 3 cucharadas de fécula, la cucharadita de agar agar y la pizca de cúrcuma, que es la que pone el color sin que se note en el sabor.',
      'Llevar a fuego suave revolviendo sin parar hasta que rompa el hervor y espese. No cortar antes de tiempo: el agar recién gelifica cuando hierve.',
      'Sumar el cuarto de taza de bebida vegetal, cocinar 2 minutos más revolviendo y apagar. Fuera del fuego, agregar la cucharada de ralladura de limón: así conserva todo el perfume.',
      'Volcar el relleno caliente sobre la base fría, alisar la superficie y llevar a la heladera 3 horas como mínimo, hasta que esté firme al tacto. Cortar en 12 cuadrados y, si la usás, terminarlos con la cucharada de azúcar impalpable.',
    ],
  },

  p43: {
    base: 'prosa de recetas-personales.md ("integral + harina de garbanzo 1:1", "leudado 1 h"); funcion de cada línea (harina de garbanzo = legumbre en el pan: lisina + hierro, levadura = activar con azúcar y agua tibia 15 min, calabaza = puré, azúcar = alimento de levadura); pasos viejos ("ni seca ni acuosa"); técnica estándar: espuma como señal de levadura activa, doblar el volumen, sonido hueco en la base',
    flag_gate: true,
    nota: 'El levado de 1 hora y los 15 minutos de activación del original no entran ni en prep (20) ni en cocción (25): se mantienen con su señal, porque sin ellos no hay pan.',
    pasos: [
      'Disolver la cucharadita de levadura con la cucharadita de azúcar en un poco del agua tibia y dejarla 15 minutos: cuando la superficie se llena de espuma, está activa y se puede seguir.',
      'Mezclar en un bol la taza de harina integral superfina, la taza de harina de garbanzo y la cucharadita de sal. La harina de garbanzo es una legumbre metida adentro del pan: aporta lisina y hierro.',
      'Hacer un puré con las 4 rodajas de calabaza cocidas y sumarlo al bol junto con la levadura ya espumada y la cucharada y media de aceite. Integrar todo.',
      'Agregar el resto del agua de a poco mientras amasás, hasta lograr una masa que no se pegue a las manos pero siga blanda: ni seca ni acuosa. Si las usás, los 30 g de nueces picadas se amasan adentro al final.',
      'Tapar el bol y dejar levar una hora, hasta que la masa doble su volumen.',
      'Desgasificar apenas, acomodar la masa en una budinera engrasada —o formar bollitos— y hornear a 160-180° entre 20 y 25 minutos, hasta que esté dorado y la base suene hueca al golpearla.',
    ],
  },

  p44: {
    base: 'prosa de recetas-personales.md ("mezcla sin amasar + noche entera de heladera", "fermentación fría = sabor + digestibilidad + menos fitatos", "5 bollos"); funcion de la sémola (el crocante); sustitutos de la línea de masa madre (levadura fresca 10 g, seca 3 g); técnica estándar: burbujas como señal de fermentación, relajar los bollos antes de estirar',
    flag_gate: true,
    pasos: [
      'Mezclar en un bol grande los 500 g de harina integral, los 300 g de harina 000 y los 200 g de sémola fina con las 4 cucharaditas de sal. La sémola no es relleno: es la que después hace el crocante de la base.',
      'Agregar los 50 g de masa madre —si no tenés, valen 10 g de levadura fresca o 3 g de la seca—, los 650 ml de agua y los 50 ml de aceite de oliva, y mezclar apenas hasta que no quede harina seca. NO amasar: queda un engrudo desprolijo y así tiene que quedar.',
      'Tapar el bol con film y llevarlo a la heladera hasta el día siguiente, unas 12 horas. En ese frío pasa todo: la fermentación lenta desarrolla el gluten sin que amases, deja la masa más sabrosa y fácil de digerir, y de paso baja los fitatos de la harina integral, que traban la absorción de sus minerales.',
      'A la mañana la masa tiene que verse crecida y llena de burbujas: esa es la señal de que la fermentación hizo su parte. Si está igual que anoche, dejarla un rato a temperatura ambiente hasta que arranque.',
      'Volcar la masa sobre la mesada enharinada y dividirla en 5 bollos. Antes de estirarlos, dejarlos tapados hasta que pierdan el frío y se estiren sin encogerse de vuelta: esa resistencia que cede es la señal de que están listos.',
    ],
  },

  p45: {
    base: 'prosa de recetas-personales.md ("el destino noble del descarte", "estirar a 2 mm, marcar cuadrícula sin cortar", "horno 180-200° hasta crocante + secado con horno apagado"); funcion de cada línea (aceite = de a poco al final); pasos viejos ("algo seca es normal", "cuchillo sin filo"); técnica estándar: reposo que hidrata la harina, frasco recién cuando enfrían',
    flag_gate: true,
    pasos: [
      'Mezclar en un bol los 500 g de masa madre —el descarte que venís juntando es perfecto para esto— con los 250 g de harina integral y los 15 g de sal. Si las usás, las 2 cucharadas de chía o de mix de semillas entran acá.',
      'Integrar hasta tener una masa homogénea. Si la sentís algo seca, es normal: dejarla reposar 5 a 10 minutos para que la harina termine de hidratarse.',
      'Sumar los 50 g de aceite de oliva de a poco, amasando entre chorro y chorro, hasta que la masa lo absorba todo y quede lisa y maleable.',
      'Estirarla bien finita, a 2 mm: de ese espesor sale el crocante. Marcar una cuadrícula apretando con un cuchillo SIN filo, sin llegar a cortar: al hornearse, la plancha después se quiebra prolija siguiendo esas líneas.',
      'Hornear a 180-200° hasta que estén dorados y crocantes, unos 20 a 25 minutos según el horno.',
      'Apagar el horno y dejarlos adentro un rato más: ese secado final es el que les da el crocante que aguanta. Guardarlos en un frasco bien cerrado recién cuando estén fríos del todo.',
    ],
  },

  r01: {
    base: 'prosa de recetas.md ("bloom 45 s", "tostarlo 1-2 min revolviendo hasta que oscurezca", "hervir suave 20-25 min hasta que se deshagan"); funcion de cada línea (aceite = vehículo del bloom, limón = ácido final que activa el hierro R1, lentejas = cremosidad sin licuar, extracto = umami y color TOSTAR, zanahoria = dulzor de fondo); técnica estándar: enjuagar hasta agua clara, señales del sofrito',
    flag_gate: true,
    pasos: [
      'Picar la cebolla grande y las 2 zanahorias, y sofreírlas en las 3 cucharadas de aceite de oliva a fuego medio, 6 a 8 minutos, hasta que doren apenas: esa base dulce es el piso de la sopa.',
      'Sumar los 4 dientes de ajo picados, las 2 cucharaditas de comino y —si lo usás— la cucharadita de pimentón, y revolver unos 45 segundos, hasta que perfumen: las especias despiertan en el aceite caliente, no en el caldo.',
      'Agregar las 2 cucharadas de extracto de tomate y tostarlo uno o dos minutos revolviendo, hasta que tome un color más profundo: ese tostado le da a la sopa su fondo de sabor.',
      'Enjuagar la taza y media de lentejas turcas hasta que el agua salga clara, sumarlas a la olla con los 1200 ml de caldo de verduras y llevar a hervor.',
      'Bajar a hervor suave y cocinar 20 a 25 minutos, hasta que las lentejas se deshagan solas y la sopa espese: esa cremosidad sin pasar por la licuadora es la gracia del plato.',
      'Rectificar la sal, apagar el fuego y recién entonces exprimir el jugo del limón: el ácido, lejos de la hornalla, es lo que activa la absorción del hierro de las lentejas. Servir con las 2 cucharadas de perejil picado por encima, si lo usás.',
    ],
  },

  r02: {
    base: 'prosa de recetas.md ("no apurar: acá vive el sabor", "hasta que la grasa corte la salsa", "espinaca en tandas hasta que colapse"); funcion de cada línea (pimienta = piperina activa la curcumina R8, espinaca = hierro/folato entra al final, limón = balance final + vitamina C, leche de coco = grasa que absorbe especias); técnica estándar: el acompañamiento declarado al principio',
    flag_gate: true,
    pasos: [
      'Si lo vas a acompañar con arroz, ponerlo a cocinar primero: la taza de arroz blanco llega justo para cuando el curry está listo.',
      'Picar la cebolla grande y dorarla en un fondo de aceite a fuego medio, 8 a 10 minutos, sin apurarla: tiene que quedar bien dorada, porque en ese dorado vive buena parte del sabor del curry.',
      'Sumar los 4 dientes de ajo y las 2 cucharadas de jengibre rallado, y revolver un minuto. Agregar la cucharada y media de curry, la cucharadita de cúrcuma y la media cucharadita de pimienta negra, y tostarlas 30 a 60 segundos, hasta que perfumen. La pimienta no es un detalle: sin ella, la curcumina de la cúrcuma casi no se absorbe.',
      'Agregar los 400 g de tomate triturado y cocinar unos 5 minutos revolviendo, hasta que la salsa se vea cortada, con la grasa separándose del tomate: esa es la señal de que la base del curry está hecha.',
      'Sumar los garbanzos de las 2 latas, escurridos, y los 400 ml de leche de coco. Cocinar 10 minutos a fuego suave, hasta que la salsa espese apenas y los garbanzos tomen el sabor del curry.',
      'Agregar el paquete de espinaca en tandas, revolviendo hasta que cada tanda pierda volumen y se integre: dos minutos y ya está. Va al final a propósito, para que no se recocine y conserve el folato que trae al plato.',
      'Apagar el fuego, exprimir el jugo del medio limón y rectificar la sal. El ácido final equilibra la leche de coco, y su vitamina C ayuda a absorber el hierro de garbanzos y espinaca.',
    ],
  },

  r03: {
    base: 'prosa de recetas.md ("hasta que se deshagan al apretarlos", "se forma una pasta clara", "procesar 3-4 min (sí, minutos)", "agua helada de a chorros hasta textura de mousse"); funcion de cada línea (bicarbonato = ablanda pieles, agua helada = emulsión que vuelve el tahini sedoso); técnica estándar: los garbanzos calientes se procesan mejor que fríos',
    flag_gate: true,
    pasos: [
      'Poner los 400 g de garbanzos ya cocidos en una olla con agua limpia y la media cucharadita de bicarbonato, y hervirlos 15 a 20 minutos más. Están cuando un garbanzo se deshace apenas lo apretás entre dos dedos: el bicarbonato ablanda las pieles, y de esa sobrecocción sale la cremosidad.',
      'Procesar primero la media taza de tahini con el jugo de un limón y medio y los 2 dientes de ajo, hasta que la mezcla aclare y quede una crema lisa. El orden importa: el tahini batido con el ácido antes que nada es la base sedosa del hummus.',
      'Escurrir los garbanzos y sumarlos al vaso todavía calientes, porque calientes se procesan mucho mejor que fríos. Procesar 3 a 4 minutos seguidos, parando solo para raspar los bordes: es más tiempo del que parece necesario, y es a propósito.',
      'Con el motor andando, agregar los 90 ml de agua helada de a chorritos y seguir hasta que el hummus aclare y tome textura de mousse, aireado y sedoso: el agua bien fría es la que emulsiona el tahini.',
      'Salar, sumar la media cucharadita de comino si lo usás, y probar para ajustar sal y limón. Servir con la cucharada de aceite de oliva por encima, si la usás.',
    ],
  },

  r04: {
    base: 'prosa de recetas.md ("soffritto a fuego medio 10 min", "desglasar con vino, reducir a la mitad", "600 ml de agua/caldo", "reposar 10 min"); funcion de cada línea (nueces = textura granulada + grasa + ALA, extracto = umami tostar, salsa de soja = segunda fuente de umami, levadura nutricional = queso umami final); técnica estándar: rectificar la sal después de la soja, señal de ragú',
    flag_gate: true,
    nota: 'Los pasos viejos pedían 600 ml de caldo que no existe como línea de la receta: queda como agua —o caldo, si hay—, con el agua de despensa.',
    pasos: [
      'Picar fino la cebolla, la zanahoria y la rama de apio, y sofreírlos en un fondo de aceite a fuego medio unos 10 minutos, hasta que estén blandos y apenas dorados: ese sofrito es la base de toda boloñesa.',
      'Sumar los 3 dientes de ajo picados y revolver un minuto. Agregar las 2 cucharadas de extracto de tomate y tostarlo un par de minutos, hasta que oscurezca y se agarre apenas al fondo: ahí concentra su umami.',
      'Si lo usás, desglasar con los 100 ml de vino tinto raspando el fondo de la olla, y dejarlo reducir a la mitad.',
      'Agregar los 250 g de lentejas enjuagadas, los 60 g de nueces picadas finas, los 800 g de tomate triturado, la hoja de laurel si la usás y 600 ml de agua —o caldo, si tenés— y llevar a hervor suave.',
      'Cocinar a fuego bajo 30 a 40 minutos, revolviendo cada tanto, hasta que las lentejas estén tiernas y la salsa tome cuerpo de ragú. Las nueces van desde el principio: sueltan su grasa y dan esa textura granulada de picada.',
      'Sumar la cucharada y media de salsa de soja y, si lo usás, la cucharadita de orégano. Probar y rectificar la sal recién ahora, porque la soja ya sala.',
      'Apagar y dejar reposar 10 minutos antes de servir, para que la salsa asiente y termine de espesar. Si la usás, la levadura nutricional va por encima en el plato, como un queso rallado.',
    ],
  },

  r05: {
    base: 'prosa de recetas.md ("a mano en trozos irregulares: no picar prolijo, la irregularidad es la gracia", "sin revolver de más, que agarre color", "apagar el fuego y AHÍ el kala namak"); funcion de cada línea (kala namak = gusto sulfuroso a huevo al final fuera del fuego, cúrcuma = color huevo, levadura = umami cremoso); técnica estándar: aceite antes del relleno',
    flag_gate: true,
    pasos: [
      'Desmenuzar el bloque de tofu firme A MANO, en trozos irregulares y sin buscar prolijidad: justamente esa irregularidad es lo que lo hace parecer huevo revuelto.',
      'Calentar la cucharada y media de aceite de oliva en una sartén a fuego medio y, si los usás, sofreír la media cebolla y el medio morrón rojo picados hasta que ablanden.',
      'Sumar el tofu y dorarlo 5 a 6 minutos revolviendo lo justo: si lo movés todo el tiempo, no llega a tomar color.',
      'Agregar la media cucharadita de cúrcuma, las 2 cucharadas de levadura nutricional y —si la usás— las 2 cucharadas de bebida vegetal, y revolver un minuto, hasta que el amarillo quede parejo: la cúrcuma pinta de huevo, no cambia el gusto.',
      'Apagar el fuego y recién entonces mezclar la media cucharadita de kala namak: es la sal que le da el gusto a huevo, y ese efecto no sobrevive a la sartén caliente.',
    ],
  },

  r06: {
    base: 'prosa de recetas.md ("el secreto anti-hamburguesa-pastosa", "ENFRIAR 30 min", "sin toquetear"); funcion de cada línea (avena = liga seca, lino = "huevo" de liga húmeda hidratado 5 min, cebolla = cruda suelta agua, comino y pimentón = perfil parrilla); técnica estándar: señal para dar vuelta dicha con otras palabras que el secreto',
    flag_gate: true,
    pasos: [
      'Poner los 400 g de porotos negros cocidos y bien escurridos en una placa y secarlos 10 minutos en horno a 150°. Es el paso que separa una hamburguesa firme de una pastosa: el poroto húmedo nunca liga.',
      'Hidratar la cucharada de lino molido en 3 cucharadas de agua y dejarlo reposar 5 minutos, hasta que espese como un gel: ese "huevo" de lino es lo que va a mantener unida la mezcla.',
      'Sofreír la cebolla chica picada en un chorrito de aceite hasta que quede transparente y dulce. Va siempre cocida: cruda suelta agua adentro de la hamburguesa.',
      'Pisar los porotos tibios en un bol grande, dejando trozos enteros: buscás textura, no un puré liso.',
      'Sumar los 80 g de avena procesada, los 60 g de nueces tostadas y molidas, la cebolla sofrita, la cucharadita de comino, la de pimentón ahumado y el gel de lino, con la cucharada de salsa de soja si la usás. Mezclar hasta poder formar una bola que no se pegotea en las manos.',
      'Formar 6 hamburguesas y llevarlas a la heladera 30 minutos: frías mantienen la forma sobre el fuego.',
      'Cocinarlas en plancha o sartén bien caliente con aceite, 4 a 5 minutos por lado, sin toquetearlas: se giran una sola vez, cuando la base formó costra y se suelta sin esfuerzo. En horno bien fuerte también salen, unos 10 minutos por lado.',
    ],
  },

  r07: {
    base: 'prosa de recetas.md ("secados con repasador", "primero espesa, después se suelta: es normal", "reposo tapada 5"); funcion de cada línea (limón = corta el tahini y activa el hierro, batata = dulzor asado, pimentón y comino = costra de sabor); técnica estándar: anillito blanco de la quinoa, señal del garbanzo crocante',
    flag_gate: true,
    pasos: [
      'Prender el horno a 210°. Cortar las 2 batatas en cubos, mezclarlas con un chorrito de aceite y sal, y hornearlas 25 a 30 minutos, hasta que estén tiernas por dentro y doradas en los bordes.',
      'Secar a conciencia los 250 g de garbanzos cocidos con un repasador, mezclarlos con aceite, la cucharadita de comino y la de pimentón ahumado, y hornearlos 20 a 25 minutos en una placa donde queden desparramados, sin tocarse entre sí. Están cuando suenan secos al sacudir la placa y crujen al morderlos.',
      'Enjuagar la taza de quinoa bajo el chorro hasta que el agua salga clara — se lleva el amargor natural de la cáscara — y cocinarla con una taza y tres cuartos de agua: llevar a hervor, bajar el fuego y tapar 15 minutos, más 5 de reposo sin destapar. Está lista cuando cada grano muestra su anillito blanco.',
      'Para la salsa, mezclar las 3 cucharadas de tahini con el jugo del limón y el diente chico de ajo rallado, y agregar agua de a cucharadas revolviendo: primero se pone más espesa y parece arruinada, y de golpe se afloja hasta quedar cremosa. Es así, no falla.',
      'Armar los bowls sobre la base de quinoa: los cubos de batata a un lado, los garbanzos crocantes al otro, y las hojas verdes si las usás.',
      'Regar con la salsa y terminar con la cucharada de semillas de zapallo si las sumás. El limón de la salsa no es solo sabor: es lo que hace que el hierro del plato se absorba.',
    ],
  },

  r08: {
    base: 'prosa de recetas.md ("boca abajo", "ajos en camisa los últimos 20", "hasta seda"); funcion de cada línea (jengibre = chispa que corta el dulzor, leche de coco = grasa para absorber carotenos, ajo asado = dulce); técnica estándar: señal del cuchillo en la calabaza',
    flag_gate: true,
    nota: 'Los pasos viejos rectificaban con "gotas de limón", que no existe como línea de ingrediente: se saca.',
    pasos: [
      'Cortar la calabaza al medio a lo largo, sacarle las semillas y asarla boca abajo en una placa aceitada a 200° durante 40 minutos, hasta que un cuchillo la atraviese sin resistencia. Asada y no hervida es la gracia: el horno le concentra el dulzor y le tuesta los bordes.',
      'A los 20 minutos de horno, sumar a la placa los 3 dientes de ajo enteros y sin pelar: asados en camisa no se queman y quedan dulces.',
      'Sofreír la cebolla picada en la olla con un chorrito de aceite a fuego medio hasta que esté transparente, y sumar la cucharada de jengibre rallado un minuto más, hasta que perfume. El jengibre es la chispa que corta tanto dulzor.',
      'Agregar la pulpa de la calabaza, los ajos ya pelados y los 750 ml de caldo de verduras, y hervir 10 minutos a fuego medio para que los sabores se junten.',
      'Licuar con los 200 ml de leche de coco hasta que quede lisa como una seda, sin un solo grumo. La grasa del coco no es capricho: es la que permite absorber la vitamina A de la calabaza.',
      'Rectificar de sal y pimienta y servir. Si las usás, las 2 cucharadas de semillas de zapallo tostadas van por encima, para el contraste crocante.',
    ],
  },

  r09: {
    base: 'prosa de recetas.md ("hasta bien dorado", "fuera del fuego 30 s (se quema fácil y amarga)", "dorada aparte en sartén"); funcion de cada línea (pimentón = "chorizo fantasma", salsa de soja = umami de fondo, texturizada = mordida cárnica, verdeo = frescura); técnica estándar: señal de lenteja y de papa',
    flag_gate: true,
    nota: 'Los pasos viejos cocinaban con "caldo", que no existe como línea de ingrediente: se usa agua hirviendo — la salsa de soja ya pone el fondo de sabor.',
    pasos: [
      'Hacer el sofrito criollo en una olla grande: la cebolla, el morrón rojo y los 4 dientes de ajo picados, a fuego medio con aceite, hasta que todo esté bien dorado — no apenas transparente: dorado, que ahí vive el sabor del guiso.',
      'Apagar el fuego y recién ahí sumar las 2 cucharaditas de pimentón ahumado, revolviendo 30 segundos con el calor de la olla. Sobre la hornalla se quema y amarga, y este pimentón es el chorizo fantasma del guiso: el que pone el ahumado.',
      'Volver la olla al fuego y agregar los 400 g de lentejas, las 2 zanahorias en rodajas, las hojas de laurel, la cucharadita de comino y la de orégano, y cubrir con agua hirviendo. Cocinar 30 minutos a fuego medio, hasta que a la lenteja le falte poco: tierna por fuera, apenas firme al centro.',
      'Sumar los 400 g de tomate triturado, la papa y la batata en cubos, y las 2 cucharadas de salsa de soja, que ponen el umami de fondo. Cocinar 20 minutos más, hasta que papa y batata se pinchen sin resistencia. El tomate entra recién ahora a propósito: su acidez pone dura la lenteja si va desde el principio.',
      'Si la usás, hidratar la soja texturizada 10 minutos en agua caliente con un chorrito de salsa de soja, escurrirla apretando bien, dorarla en una sartén con aceite hasta que tome color y sumarla al guiso al final: es la mordida del plato.',
      'Apagar y dejar reposar 15 minutos con la olla tapada: el guiso se asienta y espesa solo.',
      'Servir bien caliente, con el verdeo picado por encima si lo sumás: esa frescura le corta la contundencia.',
    ],
  },

  r10: {
    base: 'prosa de recetas.md ("Revolver OTRA VEZ a los 10 min (evita el bloque de chía en el fondo)", "mínimo 4 h"); funcion de cada línea (bebida = elegir CON calcio agregado, chía = gelifica, kiwi = vitamina C al servir); técnica estándar: señal de cuchara parada, fitatos dichos con otras palabras que el secreto',
    flag_gate: true,
    pasos: [
      'Mezclar en un frasco o bol los 80 g de avena con las 3 cucharadas de chía y, si la usás, la cucharadita de canela.',
      'Verter los 400 ml de bebida vegetal fortificada — fijate que el envase diga calcio agregado, que para eso está elegida — y revolver bien hasta que no quede nada seco. Si la sumás, la banana pisada entra acá y endulza todo.',
      'Esperar 10 minutos y revolver OTRA VEZ: la chía ya empezó a largar su gel y, sin esa segunda pasada, se hunde toda y arma un ladrillo en el fondo.',
      'Tapar y dejar en la heladera toda la noche, mínimo 4 horas. A la mañana tiene que estar firme y cremoso, de cuchara parada. El reposo largo además desarma los fitatos, y eso deja los minerales de la avena más disponibles.',
      'Servir con la fruta fresca por encima si la usás: la taza de kiwi en rodajas suma la vitamina C. Frío de la heladera está en su punto justo.',
    ],
  },

  r11: {
    base: 'prosa de recetas-set2.md ("dorar en tandas", "salteado con chorrito de agua tapado", "1 minuto hasta que espese"); funcion de cada línea (fécula = costra del tofu y liga de la salsa, vinagre y azúcar = balance agridulce, sésamo = remate tostado); técnica estándar: prensado del tofu, señal del brócoli y del arroz',
    flag_gate: true,
    nota: 'El arroz integral tarda más que los 20 minutos de cocción declarados: se pone a cocinar primero y el salteado se hace mientras — el encabezado cuenta solo el wok.',
    pasos: [
      'Poner a cocinar la taza de arroz integral en abundante agua con sal: es lo que más tarda, unos 35 a 40 minutos, y todo el resto se hace mientras. Está listo cuando el grano se muerde tierno pero entero.',
      'Prensar los 400 g de tofu firme: envolverlo en un repasador limpio y apoyarle un peso encima — una tabla con algo arriba — 15 minutos. Cuanta más agua suelta acá, mejor dora después. Cortarlo en cubos.',
      'Mezclar los cubos de tofu con la cucharada de fécula de maíz y sal hasta que queden apenas empolvados, y dorarlos en el wok con aceite a fuego fuerte, en tandas para que no se amontonen, hasta que las caras estén doradas y crujientes. Reservar. Esa película de fécula es la que arma el crocante.',
      'Cocinar el brócoli en ramitos al vapor 3 minutos, o en la sartén tapada con un chorrito de agua, hasta que esté verde intenso y apenas tierno: tiene que llegar al wok casi hecho, porque adentro no se cocina, se barniza.',
      'Mezclar la salsa en un vasito: las 3 cucharadas de salsa de soja, los 3 dientes de ajo picados, la cucharada de jengibre rallado y, si los usás, la cucharada de vinagre de arroz y la cucharadita de azúcar.',
      'Volver todo al wok a fuego máximo — tofu, brócoli y la salsa — y saltear un minuto, hasta que la salsa espese y se pegue brillante a los cubos. No más que eso: es un golpe de fuego, no una cocción.',
      'Apagar, lloverle por encima las 2 cucharadas de sésamo integral — mejor si antes lo pasás un momento por una sartén seca hasta que perfume — y servir sobre el arroz.',
    ],
  },

  r12: {
    base: 'prosa de recetas-set2.md ("2-3 min hasta que oscurezca y ablande", "aliñar al momento de servir"); funcion de cada línea (aceite = masajeado que ablanda la hoja, naranja = vitamina C que activa el hierro de los garbanzos, palta = cremosidad); técnica estándar: gajos pelados a fondo, aliño a último momento',
    flag_gate: true,
    nota: 'La receta entera eran tres pasos telegráficos: se despliega el armado.',
    pasos: [
      'Sacarle los tallos al atado de kale, cortar las hojas en trozos de bocado y ponerlas en un bol amplio con la cucharada de aceite de oliva y una pizca de sal.',
      'Masajear el kale con las dos manos 2 a 3 minutos, apretando de verdad, como quien amasa, hasta que las hojas se oscurezcan, pierdan volumen y se ablanden. Las manos hacen acá el trabajo de la cocción: quiebran la fibra y la hoja cruda se vuelve tierna.',
      'Pelar la naranja y cortarla en gajos sobre el bol, para no perder el jugo. Si además le sacás la telita blanca a cada gajo, el plato sube de categoría.',
      'Sumar los 250 g de garbanzos cocidos y, si los usás, la media palta en cubos y las 2 cucharadas de semillas de zapallo tostadas.',
      'Aliñar recién al servir con el jugo del medio limón y mezclar. El cítrico no es solo aliño: la vitamina C de la naranja y el limón hace que el hierro de los garbanzos se aproveche.',
    ],
  },

  r14: {
    base: 'prosa de recetas-set2.md ("(se oxida y amarga)", "oliva en hilo", "mezclar FUERA del fuego"); funcion de cada línea (levadura nutricional = el "parmesano" umami, nueces = rol del piñón, limón = frescura y anti-oxidación, tomate asado = dulzor ácido); técnica estándar: agua de pasta reservada, señal del cherry asado',
    flag_gate: true,
    pasos: [
      'Si los sumás, poner primero los 300 g de tomates cherry en una placa con un chorro de oliva y sal, a horno fuerte 20 a 25 minutos, hasta que se arruguen y empiecen a reventarse: ese dulzor asado corona el plato.',
      'Procesar las 2 tazas de albahaca con los 60 g de nueces, los 2 dientes de ajo, las 3 cucharadas de levadura nutricional — que acá hace de parmesano — y el jugo del medio limón, hasta tener una pasta gruesa.',
      'Con el motor andando, sumar los 80 ml de aceite de oliva en un hilo fino, hasta que el pesto quede cremoso pero con textura, no una crema lisa. Probar y salar.',
      'Hervir los 400 g de fideos en abundante agua con sal hasta que estén al dente. Antes de colar, sacar una taza del agua de la olla y guardarla.',
      'Mezclar los fideos con el pesto FUERA del fuego, en un bol o en la olla ya apagada: el calor directo lo oxida y lo pone amargo, y con la temperatura de la pasta alcanza y sobra.',
      'Aflojar con el agua reservada de a chorritos mientras revolvés, hasta que la salsa quede fluida y pegada al fideo — el almidón de esa agua es el que la une. Servir con los tomates asados por encima.',
    ],
  },

  r15: {
    base: 'prosa de recetas-set2.md ("sofrito bien dorado", "especias en bloom 30 s", "35-40 a fuego bajo"); funcion de cada línea (cacao = profundidad del chili serio, limón = frescura y hierro, texturizada = mordida, choclo = dulzor); técnica estándar: señal del fondo de la olla, espesado pisando porotos dicho con otras palabras que el secreto',
    flag_gate: true,
    nota: 'Los pasos viejos servían "con palta", que no existe como línea de ingrediente: se saca.',
    pasos: [
      'Sofreír la cebolla, el morrón rojo y los 4 dientes de ajo picados en una olla de fondo grueso con aceite, a fuego medio, hasta que estén bien dorados, no apenas blandos: ese dorado es la base de sabor del chili.',
      'Sumar las 2 cucharaditas de comino y las 2 de pimentón ahumado y revolver 30 segundos, hasta que perfumen: las especias despiertan en la grasa caliente, pero de ahí a quemarse hay un paso.',
      'Agregar los 800 g de tomate triturado, los porotos negros y colorados — 250 g de cada uno —, la cucharada de cacao amargo y, si los usás, la soja texturizada hidratada 10 minutos en agua caliente y escurrida, y la taza de choclo. El cacao no va a endulzar nada: pone fondo y color oscuro, el mismo truco del mole.',
      'Cocinar 35 a 40 minutos a fuego bajo, destapado, revolviendo cada tanto, hasta que espese: al pasar la cuchara se tiene que ver el fondo de la olla un segundo antes de que la salsa vuelva a cerrarse.',
      'Si lo querés más espeso todavía, aplastar unos cuantos porotos contra la pared de la olla con el cucharón y revolver.',
      'Apagar y dejar reposar 15 minutos: el chili se asienta y los sabores se terminan de juntar. Servir con gajos de limón para exprimir en el plato — el ácido refresca y de paso ayuda a absorber el hierro de los porotos.',
    ],
  },

  r16: {
    base: 'prosa de recetas-set2.md ("(hidrata y evita gusto a crudo)" reescrito, "doblar cuando el borde se despega solo", utensilio antiadherente CRÍTICO); funcion de cada línea (kala namak al final = efecto huevo, cúrcuma = color, comino = calidez); técnica estándar: superficie sin brillo húmedo como señal, kala namak fuera del fuego',
    flag_gate: true,
    pasos: [
      'Batir en un bol la taza de harina de garbanzo con la taza de agua, el cuarto de cucharadita de cúrcuma, la media cucharadita de comino y sal, hasta que no queden grumos.',
      'Dejar reposar el batido 10 minutos: la harina se hidrata del todo y desaparece el sabor harinoso. Mientras, picar el relleno si lo usás: el verdeo, el tomate y la espinaca.',
      'Calentar una sartén antiadherente de verdad — o de hierro bien curada: en una sartén que se pega este plato no tiene salvación — a fuego medio con una cucharada del aceite de oliva.',
      'Verter la mitad del batido en una capa fina, desparramar la mitad del relleno por encima y tapar 3 a 4 minutos, hasta que la superficie pierda el brillo húmedo y los bordes se despeguen solos.',
      'Doblar recién entonces, con espátula y sin apuro, y darle un minuto más. Repetir con otra cucharada de aceite y el resto del batido. El fuego se queda en medio todo el tiempo: si lo subís, se dora afuera y queda crudo adentro.',
      'Si la usás, espolvorear la pizca de kala namak ya en el plato, fuera del fuego: el calor le borra el gusto a huevo, así que va siempre al final.',
    ],
  },

  r17: {
    base: 'prosa de recetas-set2.md ("soffritto 10 min", "poco: no es guiso rojo", "pisando un tercio", "oliva cruda encima al servir"); funcion de cada línea (oliva al servir = el toque toscano, pan con ajo = la versión completa, tomate = fondo); técnica estándar: soffritto sin dorar, señal del kale',
    flag_gate: true,
    pasos: [
      'Picar fino la cebolla, la zanahoria y la rama de apio, y sofreírlos en la olla con un chorro de aceite a fuego medio-bajo unos 10 minutos, hasta que estén blandos y dulces, sin que lleguen a dorarse: es el soffritto, la base silenciosa de todo guiso toscano.',
      'Sumar los 4 dientes de ajo picados y, al minuto, los 200 g de tomate triturado. Cocinar 5 minutos, hasta que el tomate pierda el olor a crudo. Es poco tomate a propósito: no es un guiso rojo, es un guiso pálido con rubor.',
      'Agregar los 500 g de porotos alubia cocidos y los 750 ml de caldo de verduras, y cocinar 15 minutos a fuego medio con la olla destapada, para que el caldo tome cuerpo.',
      'A mitad de esa cocción, aplastar con el cucharón un tercio de los porotos contra el fondo, sin sacarlos de la olla: eso vuelve el caldo cremoso sin una gota de crema.',
      'En los últimos 5 minutos, sumar el atado de kale sin tallos y en trozos, con la cucharadita de orégano si lo usás. El kale está cuando bajó de volumen y quedó verde oscuro pero entero.',
      'Servir y terminar cada plato con las 3 cucharadas de aceite de oliva repartidas en crudo por encima — acá el aceite no adorna: es el ingrediente que hace toscano al guiso. Si lo sumás, al costado va el pan integral tostado y frotado con ajo, que convierte la sopa en comida completa.',
    ],
  },

  r19: {
    base: 'prosa de recetas-set2.md ("cocida y FRÍA", "plato fresco de verano", "no escatimar hierbas" dicho con otras palabras); funcion de cada línea (perejil = verdura no adorno, menta = la frescura que define el tabule, limón+oliva = aliño abundante); técnica estándar: enjuague de saponina, enfriado extendido, reposo en frío',
    flag_gate: true,
    pasos: [
      'Enjuagar la taza de quinoa en un colador fino hasta que el agua salga clara —así se va el amargor de la saponina— y cocinarla en agua hirviendo con sal unos 15 minutos, hasta que el grano se abra y muestre su anillito blanco.',
      'Extender la quinoa cocida en una placa o fuente amplia y dejar que se enfríe del todo: apilada y caliente se apelmaza; abierta, queda suelta, que es como la necesita el tabule.',
      'Picar bien chico la taza de perejil y la media taza de menta. Acá el perejil no es adorno: es una verdura más del plato — y la menta es la frescura que lo define.',
      'Cortar en cubitos los 2 tomates y el pepino y, si la usás, picar bien fina el cuarto de cebolla morada.',
      'Juntar en un bol grande la quinoa ya FRÍA, las hierbas, los tomates y el pepino, y aliñar con el jugo de un limón y medio, las 4 cucharadas de aceite de oliva y sal: el aliño va abundante, que para eso es tabule.',
      'Llevar 30 minutos a la heladera antes de servir: el frío termina de casar los sabores, y el tabule se come fresco o no es tabule.',
    ],
  },

  r20: {
    base: 'prosa de recetas-set2.md ("wok, fuego máximo", "sueltan agua: esperar que evapore", "aplastando contra el wok"); funcion de cada línea (arroz = requisito innegociable del día anterior, champiñones = dorar sin apurar, soja = por los bordes, verdeo = frescura final, sésamo = remate); técnica estándar: salteado por tandas, aromáticos 30 segundos',
    flag_gate: true,
    pasos: [
      'Empezar con las 3 tazas de arroz integral cocido y FRÍO, idealmente del día anterior: desgranarlo con las manos o con un tenedor antes de prender el fuego. Es el requisito innegociable del plato — recién hecho se apelmaza y no hay salteado que lo salve.',
      'Calentar el wok o una sartén grande a fuego fuerte con una cucharada del aceite de oliva y saltear los 200 g de champiñones laminados solos, sin revolver de más: primero largan agua, y recién cuando evapora empiezan a dorarse. Esperar ese dorado, que es donde está el sabor.',
      'Correr los champiñones a un costado, sumar el resto del aceite, los 3 dientes de ajo picados y la cucharada de jengibre rallado, y revolver apenas 30 segundos, hasta que perfumen sin quemarse.',
      'Agregar el arroz frío desgranado y aplastarlo contra el wok con la cuchara, dejándolo quieto por tandas para que tueste. Ahí está la gracia del plato: granos sueltos y tostados, no un revuelto húmedo.',
      'Verter las 3 cucharadas de salsa de soja por los bordes del wok y no sobre el arroz: al tocar el metal caliente se carameliza y perfuma todo el salteado.',
      'Sumar al final los 200 g de edamame, las 3 cebollas de verdeo en rodajas y los 40 g de maní tostado, y saltear un minuto más, lo justo para que el edamame se caliente sin perder color. Si lo usás, rematar con la cucharada de sésamo integral por encima.',
    ],
  },

  r21: {
    base: 'prosa de recetas-set3.md (Libro #37: prensado de 20 min aparte del horno, "pincelar ambas caras", horno 200 con vuelta); funcion de cada línea (harina de garbanzo = el "huevo" que liga, levadura nutricional = el "queso"/umami de milanesa, aceite pincelado = dorado al horno, limón = el clásico al servir); técnica estándar: doble estación de rebozado, presionar para fijar la costra',
    flag_gate: true,
    pasos: [
      'Prensar los 2 bloques de tofu firme unos 20 minutos entre dos tablas con peso encima, para que larguen el agua: cuanta más suelten ahora, más crocante sale la milanesa. Después cortarlos en láminas de 1 cm.',
      'Preparar el batido en un plato hondo: los 60 ml de bebida vegetal, las 2 cucharadas de harina de garbanzo —que acá hace de huevo y liga el rebozado—, la cucharada de salsa de soja y la cucharadita de ajo y la de cebolla en polvo. Si la usás, la media cucharadita de cúrcuma le da color. Batir hasta que no queden grumos.',
      'Armar el empanado en otro plato: los 150 g de pan integral rallado, los 50 g de levadura nutricional —que acá hace de queso y aporta el umami de milanesa—, las 2 cucharaditas de orégano, la de tomillo y la de pimentón ahumado.',
      'Pasar cada lámina primero por el batido y después por el empanado, presionando con los dedos para que la costra se pegue bien y no se caiga en el horno.',
      'Acomodar las milanesas en una placa con papel de horno y pincelar las dos caras con las 3 cucharadas de aceite de oliva: ese pincelado es lo que las dora sin freírlas.',
      'Hornear a 200° unos 15 minutos, dar vuelta y seguir 10 a 15 minutos más, hasta que la costra esté dorada y crocante. Servir con gajos de limón si los usás — el clásico de toda milanesa.',
    ],
  },

  r22: {
    base: 'prosa de recetas-set3.md (Libro #22: crema a la heladera, "sartén seca", relleno espeso, armado final); funcion de cada línea (extracto = umami: tostar, repollo = crocante crudo + color, limón = acidez en rol de la lima, yogur = crema de limón con ajo y cilantro); técnica estándar: sofrito, señal del surco en el relleno, vitamina C sobre el hierro dicha con palabras',
    flag_gate: true,
    nota: 'La receta lista los 2 dientes de ajo "para el sofrito", pero la crema también pide ajo: se reparte un diente para cada lado.',
    pasos: [
      'Arrancar por la crema: mezclar los 200 g de yogur vegano con el jugo y la ralladura de medio limón, un diente de ajo rallado y, si lo usás, una cucharada de cilantro picado. Guardarla en la heladera hasta el armado: va bien fría.',
      'Picar la cebolla, el morrón rojo y el otro diente de ajo, rallar la zanahoria, y sofreír todo en una sartén amplia con un fondo de aceite a fuego medio unos 4 minutos, hasta que la cebolla esté transparente.',
      'Sumar las 2 cucharadas de extracto de tomate junto con las 2 cucharaditas de comino y la de pimentón ahumado, y tostar todo un minuto revolviendo: ahí el extracto suelta su umami y las especias despiertan.',
      'Agregar los 400 g de lentejas cocidas y los 200 ml de salsa de tomate y cocinar 5 a 7 minutos, hasta que el relleno espese y la cuchara deje un surco al pasar por el fondo: tiene que sostenerse en la tortilla sin escurrirse.',
      'Fuera del fuego, exprimir el limón restante sobre el relleno y sumar más cilantro picado si lo usás. El limón no es un detalle: su vitamina C ayuda a absorber el hierro de las lentejas.',
      'Calentar las 12 tortillas de maíz de a una en una sartén seca bien caliente, unos segundos por lado, y llevarlas a la mesa tapadas con un repasador para que no se enfríen.',
      'Armar cada taco: una base de relleno caliente, la palta en láminas, un puñado del repollo colorado cortado bien fino, los rabanitos en láminas si los sumás, y una cucharada generosa de la crema fría por encima. El taco se come apenas armado.',
    ],
  },

  r23: {
    base: 'prosa de recetas-set3.md (Libro #36: arroz al limón con cilantro, "pisando parte de los porotos", "doblar los laterales y enrollar apretado"); funcion de cada línea (caldo = cocción del relleno, palta/choclo/tomate/hojas = frescos del armado, limón = arroz + relleno); técnica estándar: tortilla entibiada para que flexione, cierre hacia abajo, vitamina C sobre el hierro dicha con palabras',
    flag_gate: true,
    pasos: [
      'Cocinar los 200 g de arroz integral en abundante agua con sal unos 30 minutos, hasta que esté tierno pero entero. Fuera del fuego, mezclarlo con la ralladura y el jugo de un limón y, si lo usás, la mitad del cilantro picado: ese es el arroz al limón que le da nombre al plato.',
      'Picar la cebolla, el morrón rojo y los 2 dientes de ajo, y sofreírlos en una olla con un fondo de aceite a fuego medio hasta que la cebolla se ablande. Sumar la cucharadita de pimentón, la de comino y la media de orégano y revolver 30 segundos, para que las especias despierten en la olla caliente.',
      'Agregar los 500 g de porotos negros cocidos y los 200 ml de caldo de verduras y cocinar 10 minutos, PISANDO parte de los porotos contra la olla: ese puré parcial es lo que liga el relleno y hace que el burrito no se abra al comerlo.',
      'Fuera del fuego, exprimir el otro limón sobre los porotos y sumar el resto del cilantro si lo usás. El limón acá también trabaja: su vitamina C mejora la absorción del hierro de los porotos.',
      'Preparar los frescos: la palta en láminas, los 200 g de choclo desgranado, el tomate en cubitos y, si las sumás, las hojas verdes.',
      'Entibiar las tortillas integrales de a una en una sartén seca hasta que se vuelvan flexibles. Poner en el centro de cada una una capa de arroz, otra de porotos y los frescos por encima, sin llenarla de más: tiene que poder cerrarse.',
      'Doblar los laterales hacia adentro y enrollar apretado desde abajo, y apoyar cada burrito con el cierre hacia abajo para que no se abra.',
    ],
  },

  r24: {
    base: 'prosa de recetas-set3.md (Libro #18: marinada completa con aceto, "2 h (ideal: noche)", horno 200 con vuelta a mitad); funcion de cada línea (tofu = marinado + horneado crocante, girasol = rol de los piñones, albahaca/perejil = hierbas en cantidad); el aderezo con la marinada sobrante viene del secreto, reescrito por completo; técnica estándar: prensado previo, quinoa en caldo',
    flag_gate: true,
    pasos: [
      'Prensar los 400 g de tofu firme unos 20 minutos con peso encima y cortarlo en cubos: sin prensar, el tofu viene tan cargado de agua que la marinada no tiene por dónde entrar.',
      'Armar la marinada en un bol: las 3 cucharadas de aceite de oliva, las 2 cucharadas de jugo de limón, la cucharada de vinagre —aceto si tenés—, los 2 dientes de ajo picados, la cucharadita de orégano, la de tomillo, el cuarto de cucharadita de pimentón ahumado y, si lo usás, la media cucharadita de romero. Sumergir los cubos de tofu y dejarlos tomar sabor al menos 2 horas, mejor toda la noche en la heladera.',
      'Escurrir el tofu —guardar la marinada, que todavía tiene trabajo— y hornearlo a 200° en una placa unos 20 a 25 minutos, dándolo vuelta a mitad de camino, hasta que los cubos estén dorados y firmes por fuera.',
      'Mientras, cocinar los 200 g de quinoa en caldo unos 15 minutos, hasta que el grano se abra y muestre su anillito blanco, y extenderla para que se enfríe.',
      'Cortar el pepino en cubitos, los 300 g de tomates cherry al medio, el morrón rojo en cubitos y la media cebolla morada en pluma fina. Juntarlos en un bol grande con la quinoa fría, los 100 g de aceitunas negras y, si las usás, las alcaparras.',
      'Aliñar con lo que quedó de la marinada: ese jugo con ajo y hierbas es el aderezo del plato, no se tira.',
      'Recién al final sumar los 40 g de albahaca y los 40 g de perejil apenas cortados, el tofu horneado y, si las usás, las semillas de girasol tostadas. Mezclar suave y servir: el tofu entra último para seguir crocante.',
    ],
  },

  r25: {
    base: 'prosa de recetas-set3.md (Libro #11: "placa amplia (garbanzos y verduras CON espacio)", ajos en camisa, aliño con oliva 3 cdas, emulsionar); funcion de cada línea (ajo asado = crema dulce del aliño, canela = la firma árabe, tahini = cremosidad, limón = aliño con su vitamina C); técnica estándar: asar con espacio para que no hierva, quinoa en caldo',
    flag_gate: true,
    nota: 'Los pasos viejos nunca ubicaban los garbanzos; la prosa pide placa amplia para "garbanzos y verduras CON espacio", así que se asan juntos. El comino figuraba a la vez en el asado y en el aliño: se reparte, con una pizca reservada para el aliño.',
    pasos: [
      'Cortar en trozos parejos la berenjena, los 2 morrones rojos y el zucchini, y la cebolla morada en gajos. Repartirlos en una placa amplia con los 400 g de garbanzos cocidos bien escurridos y los 3 dientes de ajo enteros, con su piel: asados adentro de la camisa se vuelven una crema dulce.',
      'Rociar con 3 cucharadas del aceite de oliva y espolvorear la cucharadita de comino —reservando una pizca para el aliño—, la de pimentón ahumado y la media de canela, que acá es la firma árabe del plato. Asar a 200° unos 25 a 30 minutos, hasta que las verduras tengan los bordes dorados y los garbanzos estén crocantes. Que todo quede con espacio: amontonado se hierve en vez de asarse.',
      'Mientras, cocinar los 200 g de quinoa en caldo unos 15 minutos, hasta que el grano se abra y muestre su anillito blanco, y dejarla reposar tapada unos minutos.',
      'Preparar el aliño: pelar los ajos asados, pisarlos con un tenedor hasta hacer una pasta y batirlos con el jugo y la ralladura del limón, las otras 3 cucharadas de aceite de oliva, la cucharada de tahini, la pizca de comino reservada y, si la usás, la cucharadita de azúcar mascabo. Emulsionar hasta que quede cremoso.',
      'Juntar en una fuente la quinoa, los garbanzos y las verduras asadas todavía tibias y bañar con el aliño. El limón no es solo gusto: su vitamina C ayuda a que el hierro de garbanzos y quinoa se absorba.',
      'Terminar con lo fresco que quieras sumar: las hojas verdes, las aceitunas, el perejil y la menta picados, y los pistachos tostados por encima. El contraste entre lo tibio y lo fresco es el plato.',
    ],
  },

  r26: {
    base: 'pasos aprobados por Facu en el piloto, verificados contra el JSON; prosa de recetas-set3.md (Libro #26: "bloom", "15-18 tapado fuego bajo", canela = la firma); funcion de cada línea (cebolla/ajo/zanahoria/apio = sofrito, espinaca = verde final, limón = levantada final); técnica estándar: saponina de la quinoa, bloom de especias, vitamina C sobre el hierro dicha con palabras',
    flag_gate: true,
    pasos: [
      'Poner la quinoa en un colador fino y enjuagarla bajo la canilla hasta que el agua salga clara: es lo que le saca el amargor de la saponina. Dejarla escurriendo.',
      'Picar la cebolla, los 3 dientes de ajo, las 2 zanahorias y las 2 ramas de apio. Calentar un fondo de aceite en una olla grande a fuego medio y sofreírlos 5 minutos, hasta que la cebolla se vea transparente.',
      'Cortar en cubos el morrón rojo, la berenjena y el zucchini. Sumar primero el morrón y la berenjena y cocinar 5 minutos; después el zucchini, 5 minutos más, revolviendo para que nada se dore de más.',
      'Abrir un hueco en el centro de la olla, tirar ahí las 2 cucharaditas de comino, el pimentón ahumado y la media cucharadita de canela, y revolver un minuto hasta que perfumen: ese "bloom" en la olla caliente es lo que despierta las especias. La canela es la firma del plato: no la saltees.',
      'Incorporar la quinoa enjuagada, los 400 g de garbanzos cocidos y escurridos, el tomate triturado, los 750 ml de caldo caliente y las 2 hojas de laurel. Llevar a hervor.',
      'Bajar a fuego bajo, tapar y cocinar 15 a 18 minutos, hasta que la quinoa muestre el anillito blanco del grano abierto y el guiso espese. Si se seca antes de tiempo, aflojar con un chorro de caldo.',
      'Sacar el laurel, sumar los 100 g de espinaca y revolver un minuto, hasta que colapse con el calor del guiso.',
      'Fuera del fuego, exprimir el jugo del limón y sumar el perejil picado, y la menta si la usás. El limón no es adorno: su vitamina C es lo que hace que el hierro de garbanzos y quinoa se absorba. Servir con las almendras tostadas por encima, si las usás.',
    ],
  },

  r27: {
    base: 'prosa de recetas-set3.md (Libro #16: "enfriar extendido", vapor 3 min + agua fría, aliño a frasco, 30 min de heladera); funcion de cada línea (naranja = el diferencial del aliño con C doble sobre el hierro, mostaza = emulsiona, brócoli = verde firme al vapor, perejil = hierba en cantidad); técnica estándar: shock frío del brócoli, arroz extendido para enfriar',
    flag_gate: true,
    pasos: [
      'Cocinar los 250 g de arroz integral en caldo 35 a 40 minutos, hasta que el grano esté tierno pero siga entero, y extenderlo en una fuente para que se enfríe rápido y quede suelto.',
      'Cocinar el brócoli al vapor apenas 3 minutos y pasarlo enseguida por agua bien fría: el corte de calor lo deja verde brillante y firme, no gris y blando.',
      'Picar en cubitos chicos el zucchini crudo y el morrón rojo, rallar la zanahoria y cortar las 4 cebollas de verdeo en rodajitas finas.',
      'Armar el aliño en un frasco con tapa: el jugo y la ralladura de la naranja, el jugo del limón, las 3 cucharadas de aceite de oliva, la cucharadita de mostaza, la de jengibre rallado, el diente de ajo rallado y, si la usás, la cucharadita de azúcar mascabo. Cerrar y agitar fuerte hasta que emulsione: la mostaza es la que mantiene todo unido.',
      'Juntar en un bol grande el arroz frío, los 400 g de lentejas cocidas, el brócoli y los crudos, sumar las pasas si las usás, y bañar con el aliño. La naranja no es un capricho: entre su vitamina C y la del limón, el hierro de las lentejas se absorbe mucho mejor.',
      'Terminar con los 40 g de perejil picado y, si las sumás, las almendras tostadas por encima, y darle media hora de heladera antes de servir para que los sabores se asienten.',
    ],
  },

  r29: {
    base: 'prosa de recetas-set3.md (Libro #15: aliño agitado en frasco, reposo 10-15 min a temperatura ambiente, el chiste del guacamole que trae la versión larga del secreto); funcion de cada línea (comino = especia central, limón = dos limones sobre el hierro, palta = al final); técnica estándar: emulsión en frasco, mezcla envolvente para la palta',
    flag_gate: true,
    pasos: [
      'Poner en un bol grande los 500 g de garbanzos cocidos y escurridos, los 300 g de tomates cherry al medio, el pepino y el morrón rojo en cubitos, la media cebolla morada en pluma fina y los 60 g de aceitunas.',
      'Armar el aliño en un frasco con tapa: el jugo de los 2 limones, las 4 cucharadas de aceite de oliva, el diente de ajo rallado, la cucharadita de comino —la especia que manda acá—, la media de pimentón, la media de cúrcuma y, si la usás, la cucharadita de azúcar mascabo. Agitar fuerte hasta que emulsione.',
      'Volcar el aliño sobre el bol y mezclar bien. Tanto limón no es exageración: su vitamina C es la que hace aprovechable el hierro de los garbanzos.',
      'Recién al final sumar las 2 paltas en cubos y, si las usás, el cilantro y la menta picados. Envolver con cuidado y pocas vueltas: palta pisada de más y esto se vuelve guacamole con garbanzos — rico, pero otro plato.',
      'Dejar reposar 10 a 15 minutos a temperatura ambiente antes de servir, para que los garbanzos tomen el aliño.',
    ],
  },
};

// ---------- T10: qué es y por qué importa cada nutriente ----------

/**
 * La ficha mostraba dosis, ajuste vegano y fuentes, pero nunca decía qué es el
 * nutriente ni por qué está en el catálogo — y "Proteína (lisina)" quedaba sin
 * explicar. El dataset no trae este texto: su prosa es la señal vegana, no el
 * rol. El rol fisiológico sale de las fichas NIH ODS que el dataset ya cita
 * como fuentes; la señal vegana, de la sección de `nutrientes-veganos.md` que
 * `base` indica. Sin dosis nuevas: los números viven en la RDA y las notas.
 */

export interface NutrientDescription {
  texto: string;
  base: string;
}

export const NUTRIENT_DESCRIPTIONS: Record<string, NutrientDescription> = {
  b12: {
    texto:
      'Mantiene las neuronas y fabrica los glóbulos rojos; su falta sostenida daña los nervios, a veces sin vuelta atrás. Ningún vegetal la aporta de forma confiable: en una dieta vegana viene sí o sí de un suplemento o de alimentos fortificados.',
    base: 'rol: NIH ODS Vitamin B12 [1]; señal vegana: A1 (sin fuente vegetal confiable, IC 8)',
  },
  vitd: {
    texto:
      'Regula la absorción del calcio y participa en el sistema inmune y el músculo. Se obtiene del sol más que de la comida — casi ningún alimento vegetal la trae, y en el invierno porteño la síntesis cutánea cae fuerte.',
    base: 'rol: NIH ODS Vitamin D [5]; señal vegana: A2 (síntesis solar, lat. ~34°S)',
  },
  hierro: {
    texto:
      'Transporta el oxígeno en la sangre; su falta es la carencia nutricional más común. El hierro vegetal se absorbe menos que el animal y depende de la compañía: la vitamina C en la misma comida lo multiplica; el mate, el té y el café lo bloquean.',
    base: 'rol: NIH ODS Iron [6]; señal vegana: A3 (no-hemo, potenciadores e inhibidores)',
  },
  zinc: {
    texto:
      'Hace falta para las defensas, la cicatrización y el gusto. Los fitatos de granos y legumbres —los mismos alimentos que lo aportan— frenan su absorción: remojar, fermentar o tostar la mejora.',
    base: 'rol: NIH ODS Zinc [13]; señal vegana: A4 (fitatos y técnicas que los desactivan)',
  },
  calcio: {
    texto:
      'Forma huesos y dientes e interviene en el músculo y los nervios. Cuánto se absorbe depende del vegetal: las crucíferas lo entregan bien; el de espinaca y acelga casi no cuenta, por sus oxalatos.',
    base: 'rol: NIH ODS Calcium [11]; señal vegana: A5 (biodisponibilidad por vegetal)',
  },
  yodo: {
    texto:
      'Materia prima de las hormonas tiroideas, que marcan el ritmo del metabolismo entero. Sin pescado ni lácteos, la fuente vegana confiable es la sal yodada — las sales marinas y rosadas generalmente no lo están.',
    base: 'rol: NIH ODS Iodine [17]; señal vegana: A6 (sal yodada por ley, sales premium sin yodar)',
  },
  selenio: {
    texto:
      'Antioxidante y parte de las enzimas que activan la hormona tiroidea. En los vegetales depende del selenio del suelo, así que las tablas son poco confiables; las castañas de Pará lo concentran tanto que una o dos por día alcanzan — y conviene no pasarse.',
    base: 'rol: NIH ODS Selenium [20] (verificado 2026-08); señal vegana: A7 (suelo variable, castañas)',
  },
  omega3: {
    texto:
      'Grasas esenciales para el cerebro, la vista y el corazón. El cuerpo convierte mal el ALA vegetal (lino, chía, nueces) en EPA y DHA, por eso la referencia vegana duplica la ingesta; el exceso de aceite de girasol o maíz compite con esa conversión.',
    base: 'rol: NASEM [22]; señal vegana: A8 (conversión pobre, competencia del omega-6)',
  },
  proteina: {
    texto:
      'Acá se mide la proteína total, en gramos. La lisina del nombre no es lo que se mide: es el aminoácido que suele quedar corto en una dieta vegana —abunda en legumbres, soja y quinoa, escasea en cereales— y sirve de termómetro: cubierta la lisina, el resto del perfil se acomoda solo.',
    base: 'qué se mide: clave prot_g de la semilla; lisina como limitante práctico: A9 (IC 7, AND 2016)',
  },
  vitc: {
    texto:
      'Antioxidante y necesaria para fabricar colágeno. Una dieta vegana la cubre con holgura; su rol estratégico acá es multiplicar la absorción del hierro cuando comparten la comida. Se pierde con el hervor largo.',
    base: 'rol: NIH ODS Vitamin C [27]; señal vegana: B1 (potenciador de hierro)',
  },
  vita: {
    texto:
      'Hace falta para la vista, la piel y las defensas. En una dieta vegana viene entera de los carotenoides de zanahoria, calabaza, batata y hojas oscuras — que necesitan algo de grasa en la comida para absorberse.',
    base: 'rol: NIH ODS Vitamin A [9]; señal vegana: B2 (provitamina A + grasa)',
  },
  folato: {
    texto:
      'Fabrica ADN y glóbulos rojos: importa donde el cuerpo produce células nuevas. Legumbres y hojas verdes lo cubren de sobra en una dieta vegana; el hervor largo se lo lleva.',
    base: 'rol: NIH ODS Folate [28]; señal vegana: B3',
  },
  b2: {
    texto:
      'Pieza central de las enzimas que convierten la comida en energía. La fuente omnívora principal son los lácteos: sin ellos, la aportan almendras, hongos y levadura nutricional.',
    base: 'rol: NIH ODS Riboflavin [29] (verificado 2026-08); señal vegana: B4',
  },
  vite: {
    texto:
      'Antioxidante que protege las membranas de las células. Girasol, almendras, palta y oliva la cubren sin esfuerzo en una dieta vegana.',
    base: 'rol: NIH ODS Vitamin E [30]; señal vegana: B5',
  },
  vitk: {
    texto:
      'Sin ella la sangre no coagula, y participa en la salud del hueso. Las hojas verdes la cubren de sobra; es liposoluble: mejor con algo de grasa.',
    base: 'rol: NIH ODS Vitamin K [31] (verificado 2026-08); señal vegana: B6',
  },
  b6: {
    texto:
      'Interviene en el metabolismo de las proteínas y en fabricar neurotransmisores. Banana, papa y garbanzos la aportan; rara vez falta en una dieta variada.',
    base: 'rol: NIH ODS Vitamin B6 [29]; señal vegana: B7',
  },
  magnesio: {
    texto:
      'Participa en cientos de reacciones: músculo, nervios, energía, hueso. La dieta vegana suele ser rica — semillas, cacao, almendras, legumbres e integrales.',
    base: 'rol: NIH ODS Magnesium [32]; señal vegana: B8',
  },
  potasio: {
    texto:
      'Regula la presión arterial y el equilibrio de líquidos. Papa, batata, banana, legumbres y palta hacen que la dieta vegana tienda a ser alta — y eso juega a favor.',
    base: 'rol: NIH ODS Potassium / NASEM 2019 [33]; señal vegana: B9',
  },
  fibra: {
    texto:
      'Más que un nutriente a buscar, es el efecto colateral bueno de comer plantas: alimenta la flora intestinal, regula el tránsito y ayuda con el colesterol. Una dieta vegana suele superarla sin proponérselo.',
    base: 'rol: NASEM [22]; señal vegana: B10 (la mediana vegana supera la AI)',
  },
  colina: {
    texto:
      'Materia prima de las membranas celulares y de la acetilcolina, un neurotransmisor de la memoria y el músculo; el hígado la necesita para mover grasas. La fuente omnívora principal es el huevo: acá la aportan soja, maní, quinoa y brócoli. La evidencia de deficiencia real en veganos es limitada.',
    base: 'rol: NIH ODS Choline [35] (verificado 2026-08); señal vegana: B11 (emergente, IC 5)',
  },
};
