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
      'Enjuagar las lentejas turcas hasta que el agua salga clara y ponerlas en una olla con 900 ml de agua fría, la cucharadita de cúrcuma y la media cucharadita de pimienta negra. La pimienta no es condimento acá: es lo que hace que la curcumina se absorba (regla R8).',
      'Llevar a hervor, bajar a fuego medio-bajo y cocinar 20 a 25 minutos destapado, revolviendo cada tanto para que no se pegue al fondo. Están listas cuando se deshacen solas y ya no se distingue el grano.',
      'Batir el dal con batidor o cuchara de madera hasta que quede cremoso y parejo. Si quedó muy espeso, aflojar con un chorrito de agua caliente: tiene que caer de la cuchara, no quedarse pegado.',
      'Si vas a acompañar con arroz, poner ahora la taza de arroz blanco a cocinar: llega justo con el dal.',
      'El tadka se hace aparte, en una sartencita, nunca en la olla del dal. Calentar las 3 cucharadas de aceite de oliva a fuego medio-alto, tirar la cucharadita de comino en grano y esperar a que crepite, unos 30 segundos.',
      'Sumar los 4 dientes de ajo laminados y la cucharada de jengibre, y revolver SEGUNDOS, hasta que el ajo apenas tome color. Si lo usás, el tomate picado entra acá y se saltea 30 segundos más.',
      'Volcar el tadka hirviendo sobre el dal — el "tsss" es el plato — y revolver una sola vez, para que quede veteado y no uniforme.',
      'Apagar el fuego, exprimir el jugo del limón y salar. El limón va al final y fuera del fuego: es lo que activa la absorción del hierro (regla R1).',
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
      'Licuar la mandioca rallada con la media banana madura, los 200 ml de bebida de soja, las 6 cucharadas de aceite neutro y los 50 g de margarina —o manteca vegana P03— hasta obtener una crema lisa. Lleva su tiempo y hay que parar a bajar lo que sube por las paredes: la mandioca es fibrosa y cuesta.',
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
      'Preparar el guacamole pisando la palta con limón y sal. Si sumás hummus (R03), queso de maní (P04) o quesofu (P05), es el momento de sacarlos de la heladera: los untables van a temperatura ambiente, fríos no saben a nada.',
      'Cortar los crudos: la zanahoria y el morrón rojo en bastones, y los 150 g de tomates cherry enteros.',
      'Escurrir los 200 g de berenjenas en escabeche y, si sumás seitán salteado (P08) o garbanzos crocantes (R07), dorarlos ahora para que lleguen tibios a la mesa.',
      'Armar la tabla repartiendo por zonas y no en pilas, y chequear que estén las cuatro patas: crocante (los bastones al horno, el pan, los garbanzos), untable (guacamole, hummus, quesos), ácido (las berenjenas en escabeche) y proteico (las nueces, los cajús, el seitán).',
      'Los bastones al horno y el pan van a la mesa recién salidos: es lo único de la picada que no espera.',
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
