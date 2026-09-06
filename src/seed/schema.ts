import { z } from 'zod';

/**
 * Esquema Zod de la semilla canónica: única fuente de tipos compartida entre
 * el pipeline build-seed (que la produce y valida) y la app (que la consume).
 * Los nombres de campo conservan el castellano del dataset: son datos, no código.
 */

// ---------- valores nutricionales ----------

export const intervalSchema = z
  .strictObject({ min: z.number(), max: z.number() })
  .refine((i) => i.min <= i.max, { message: 'intervalo con min > max' });
export type Interval = z.infer<typeof intervalSchema>;

export const nutrientValueSchema = z.strictObject({
  intervalo: intervalSchema,
  nota: z.string().optional(),
});
export type NutrientValue = z.infer<typeof nutrientValueSchema>;

/** Claves de nutriente admitidas en ingredientes (21 reales + vitk_ug documentada). */
export const INGREDIENT_NUTRIENT_KEYS = [
  'prot_g',
  'fibra_g',
  'hierro_mg',
  'calcio_mg',
  'zinc_mg',
  'magnesio_mg',
  'potasio_mg',
  'sodio_mg',
  'selenio_ug',
  'yodo_ug',
  'folato_ug',
  'vitc_mg',
  'vita_ug_rae',
  'vitk_ug',
  'vite_mg',
  'vitd_ug',
  'b2_mg',
  'b6_mg',
  'b12_ug',
  'colina_mg',
  'ala_g',
  'grasa_saturada_g',
] as const;
export type IngredientNutrientKey = (typeof INGREDIENT_NUTRIENT_KEYS)[number];

export const INGREDIENT_CATEGORIES = [
  'aceite',
  'alga',
  'cereal',
  'condimento',
  'crucifera',
  'derivado_soja',
  'especia',
  'fortificado',
  'fruta',
  'fruta_seca',
  'fruto_seco',
  'hongo',
  'legumbre',
  'otro',
  'pseudocereal',
  'semilla',
  'verdura',
  'verdura_hoja',
] as const;
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

// ---------- ingredientes ----------

export const ingredientSchema = z.strictObject({
  id: z.string().min(1),
  nombre: z.string().min(1),
  sinonimos: z.array(z.string()),
  categoria: z.enum(INGREDIENT_CATEGORIES),
  base: z.string().optional(),
  kcal: nutrientValueSchema.optional(),
  nutrientes: z.partialRecord(z.enum(INGREDIENT_NUTRIENT_KEYS), nutrientValueSchema),
  /**
   * El ingrediente aporta cero de verdad (agua), no "no tenemos el dato": su
   * masa cuenta como cubierta en el cálculo en vez de bajar la cobertura.
   */
  aporte_nulo: z.literal(true).optional(),
  destacados: z.array(z.string()).optional(),
  ic: z.int().min(1).max(10),
  fuentes: z.array(z.string()),
  notas: z.string().optional(),
  origen: z.string().optional(),
  sustituto_local: z.string().optional(),
});
export type Ingredient = z.infer<typeof ingredientSchema>;

// ---------- nutrientes (catálogo de 20) ----------

export const rdaEntrySchema = z.strictObject({
  sexo: z.enum(['masculino', 'femenino']).optional(),
  edad_min: z.int(),
  edad_max: z.int(),
  valor: z.number(),
  por_kg: z.literal(true).optional(),
});
export type RdaEntry = z.infer<typeof rdaEntrySchema>;

export const nutrientSchema = z.strictObject({
  id: z.string().min(1),
  nombre: z.string().min(1),
  /** Qué es y por qué importa en una dieta vegana. Curada en T10; obligatoria. */
  descripcion: z.string().min(1),
  /** El README decía A/B; los datos reales usan critico/importante. */
  grupo: z.enum(['critico', 'importante']),
  unidad: z.string(),
  /** Clave con la que este nutriente aparece en `ingrediente.nutrientes`. */
  clave_ingrediente: z.enum(INGREDIENT_NUTRIENT_KEYS),
  rda: z.array(rdaEntrySchema).min(1),
  ajuste_vegano: z
    .strictObject({
      factor: z.number().optional(),
      /** El factor no venía como número: se transcribió de la descripción (ver T8). */
      factor_de_prosa: z.literal(true).optional(),
      descripcion: z.string(),
      ic: z.int().min(1).max(10).optional(),
    })
    .optional(),
  ul: z.number().nullable(),
  ul_nota: z.string().optional(),
  ventana: z.enum(['dia', 'semana']),
  ventana_nota: z.string().optional(),
  ic: z.int().min(1).max(10),
  notas: z
    .array(z.strictObject({ texto: z.string(), ic: z.int().min(1).max(10).optional() }))
    .optional(),
});
export type Nutrient = z.infer<typeof nutrientSchema>;

// ---------- reglas de combinación (AST) ----------

export const predicateSchema = z.discriminatedUnion('tipo', [
  z.strictObject({
    tipo: z.literal('receta_rica_en'),
    nutrientes: z.array(z.string()).min(1),
    umbral_mg_porcion: z.number().optional(),
  }),
  z.strictObject({
    tipo: z.literal('contiene_nutriente_min'),
    clave: z.enum(INGREDIENT_NUTRIENT_KEYS),
    cantidad: z.number(),
  }),
  z.strictObject({ tipo: z.literal('sin_nutriente'), nutriente: z.string() }),
  z.strictObject({
    tipo: z.literal('contiene_ingrediente'),
    ids: z.array(z.string()).min(1),
    calificador: z.string().optional(),
  }),
  z.strictObject({ tipo: z.literal('sin_ingrediente'), ids: z.array(z.string()).min(1) }),
  z.strictObject({
    tipo: z.literal('contiene_categoria'),
    categorias: z.array(z.enum(INGREDIENT_CATEGORIES)).optional(),
    ids: z.array(z.string()).optional(),
  }),
  z.strictObject({ tipo: z.literal('sin_grasa_agregada') }),
  z.strictObject({ tipo: z.literal('calcio_simultaneo_mg'), mg: z.number() }),
  z.strictObject({
    tipo: z.literal('ingrediente_cantidad_mayor'),
    id: z.string(),
    unidades: z.number(),
  }),
  z.strictObject({ tipo: z.literal('suplementos_simultaneos'), nutrientes: z.array(z.string()) }),
  z.strictObject({ tipo: z.literal('suplemento'), nutriente: z.string() }),
  z.strictObject({ tipo: z.literal('uso_habitual_aceite'), aceites: z.array(z.string()) }),
]);
export type Predicate = z.infer<typeof predicateSchema>;

export const ruleSchema = z.strictObject({
  id: z.string().regex(/^R\d+$/),
  tipo: z.enum(['potenciador', 'inhibidor', 'sugerencia', 'tecnica', 'correccion', 'precaucion', 'dato']),
  predicados: z.array(predicateSchema).min(1),
  condicion_original: z.unknown(),
  mensaje: z.string().min(1),
  ic: z.int().min(1).max(10),
});
export type Rule = z.infer<typeof ruleSchema>;

// ---------- recetas ----------

export const lineRefSchema = z.discriminatedUnion('tipo', [
  z.strictObject({ tipo: z.literal('ingrediente'), id: z.string() }),
  z.strictObject({ tipo: z.literal('receta'), id: z.string() }),
]);
export type LineRef = z.infer<typeof lineRefSchema>;

export const lineSchema = z.strictObject({
  ref: lineRefSchema,
  cantidad: z.number(),
  unidad_display: z.string(),
  g_aprox: z.number().nonnegative(),
  funcion: z.string().optional(),
  imprescindible: z.boolean().optional(),
  sustitutos: z.array(z.strictObject({ tipo: z.enum(['id', 'texto']), valor: z.string() })),
  nota: z.string().optional(),
});
export type Line = z.infer<typeof lineSchema>;

export const recipeSourceSchema = z.strictObject({
  ref: z.string().optional(),
  ref_secundaria: z.string().optional(),
  titulo_original: z.string().optional(),
  receta_original_num: z.union([z.string(), z.number()]).optional(),
  pagina_pdf: z.union([z.string(), z.number()]).optional(),
  nota: z.string().optional(),
});

/**
 * El catálogo que traduce `fuente.ref` a algo legible. Sin él la ficha muestra
 * el código crudo del dataset, que no le dice nada a nadie.
 */
export const sourceCatalogEntrySchema = z.strictObject({
  nombre: z.string().min(1),
  url: z.string().min(1).optional(),
  credencial: z.string().min(1).optional(),
});
export type SourceCatalogEntry = z.infer<typeof sourceCatalogEntrySchema>;

export const DIFFICULTY_LEVELS = ['trivial', 'muy fácil', 'fácil', 'media', 'difícil'] as const;

export const recipeRuleRefSchema = z.strictObject({
  id: z.string().regex(/^[RU]\d+$/),
  calificador: z.string().optional(),
});

export const recipeUtensilSchema = z.discriminatedUnion('tipo', [
  z.strictObject({
    tipo: z.literal('regla_utensilio'),
    id: z.string().regex(/^U\d+$/),
    calificador: z.string().optional(),
  }),
  z.strictObject({ tipo: z.literal('equipo'), id: z.string() }),
  z.strictObject({ tipo: z.literal('equipo_libre'), nombre: z.string() }),
]);

export const recipeSchema = z.strictObject({
  id: z.string().min(1),
  nombre: z.string().min(1),
  // 'conserva' (fermentos, escabeches, encurtidos) todavía no tiene recetas en la
  // semilla: queda declarado para las que cargue el usuario.
  tipo: z.enum(['salada', 'dulce', 'preparado', 'combo', 'pan', 'conserva']),
  es_preparado: z.boolean(),
  rendimiento_g: z.number().positive().optional(),
  porciones_num: z.number().positive().nullable(),
  porciones_display: z.string().min(1),
  estado: z.enum(['probada', 'por-probar']),
  ic: z.int().min(1).max(10),
  fuente: recipeSourceSchema.optional(),
  set_origen: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal('P')]),
  familia: z.string().optional(),
  variante_de: z.string().optional(),
  usa_preparados: z.array(z.string()),
  indulgente: z.boolean().optional(),
  candidata_clasica: z.boolean().optional(),
  dificultad: z.enum(DIFFICULTY_LEVELS),
  tiempo_prep_min: z.number().nonnegative(),
  tiempo_coccion_min: z.number().nonnegative(),
  lineas: z.array(lineSchema).min(1),
  pasos: z.array(z.string()).min(1),
  secretos_chef: z.array(z.string()),
  guarda: z
    .strictObject({
      heladera_dias: z.number().optional(),
      freezer: z.boolean().optional(),
      /** El dataset a veces dice "solo el pesto": freezer=true + la salvedad acá. */
      freezer_nota: z.string().optional(),
    })
    .optional(),
  reglas: z.array(recipeRuleRefSchema),
  utensilios: z.array(recipeUtensilSchema),
  objetivo: z.string().optional(),
  nota: z.string().optional(),
});
export type Recipe = z.infer<typeof recipeSchema>;

// ---------- datos de apoyo ----------

export const seasonalitySchema = z.strictObject({
  ingrediente_id: z.string(),
  meses_pico: z.array(z.int().min(1).max(12)),
  disponible_todo_ano: z.boolean().optional(),
  ic: z.int().min(1).max(10),
  nota: z.string().optional(),
});
export type SeasonalityItem = z.infer<typeof seasonalitySchema>;

export const storageApplicabilitySchema = z.discriminatedUnion('tipo', [
  z.strictObject({ tipo: z.literal('ingrediente'), ids: z.array(z.string()).min(1) }),
  z.strictObject({ tipo: z.literal('categoria'), categorias: z.array(z.enum(INGREDIENT_CATEGORIES)).min(1) }),
  z.strictObject({ tipo: z.literal('estado'), descripcion: z.string() }),
]);

export const storageItemSchema = z.strictObject({
  item: z.string(),
  aplica: storageApplicabilitySchema,
  despensa_dias: z.number().optional(),
  heladera_dias: z.number().optional(),
  freezer_dias: z.number().optional(),
  seguridad_critica: z.boolean().optional(),
  ic: z.int().min(1).max(10),
  nota: z.string().optional(),
});
export type StorageItem = z.infer<typeof storageItemSchema>;

export const equivalencesSchema = z.strictObject({
  volumen_ml: z.record(
    z.string(),
    z.strictObject({
      ml: z.number(),
      rango: z.tuple([z.number(), z.number()]).optional(),
      nota: z.string().optional(),
      confianza: z.number(),
    }),
  ),
  peso_por_volumen: z.array(
    z.strictObject({
      ingrediente_id: z.string(),
      medida: z.string(),
      g: z.number(),
      fuente: z.string().optional(),
      confianza: z.number(),
      nota: z.string().optional(),
    }),
  ),
  peso_por_unidad: z.array(
    z.strictObject({
      ingrediente_id: z.string(),
      tamano: z.string().optional(),
      unidad_real: z.string().optional(),
      g: z.number(),
      rango: z.tuple([z.number(), z.number()]).optional(),
      confianza: z.number(),
      nota: z.string().optional(),
    }),
  ),
  conversion_seco_cocido: z.array(
    z.strictObject({
      ingrediente_id: z.string(),
      factor_peso: z.number().optional(),
      rango: z.tuple([z.number(), z.number()]).optional(),
      volumen: z.string().optional(),
      confianza: z.number(),
      nota: z.string().optional(),
    }),
  ),
  envases_locales_ar: z.array(
    z.strictObject({
      nombre: z.string(),
      g_bruto: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
      g_escurrido: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
      equivalencia: z.string().optional(),
      confianza: z.number(),
    }),
  ),
  horno_celsius: z.array(
    z.strictObject({ nombre: z.string(), rango: z.tuple([z.number(), z.number()]), confianza: z.number() }),
  ),
});
export type Equivalences = z.infer<typeof equivalencesSchema>;

export const glossaryTermSchema = z.strictObject({
  id: z.string(),
  termino: z.string(),
  sinonimos: z.array(z.string()).optional(),
  categoria: z.enum(['tecnica_calor', 'concepto', 'corte', 'preparacion', 'sabor', 'mito']),
  definicion: z.string(),
  ic: z.int().min(1).max(10),
  nota: z.string().optional(),
});
export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;

export const utensilsSchema = z.strictObject({
  equipos: z.array(
    z.strictObject({
      id: z.string(),
      nombre: z.string(),
      para: z.string().optional(),
      nota: z.string().optional(),
      confianza: z.number(),
    }),
  ),
  reglas_utensilio: z.array(
    z.strictObject({
      id: z.string().regex(/^U\d+$/),
      condicion: z.string(),
      recomendacion: z.string(),
      confianza: z.number(),
    }),
  ),
});

// ---------- semilla completa ----------

export const seedSchema = z.strictObject({
  seed_schema_version: z.string(),
  dataset_version: z.string(),
  content_hash: z.string().length(64),
  ingredientes: z.array(ingredientSchema).min(1),
  nutrientes: z.array(nutrientSchema).min(1),
  reglas: z.array(ruleSchema).min(1),
  recetas: z.array(recipeSchema).min(1),
  fuentes: z.record(z.string(), sourceCatalogEntrySchema),
  equivalencias: equivalencesSchema,
  estacionalidad: z.array(seasonalitySchema),
  conservacion: z.array(storageItemSchema),
  glosario: z.array(glossaryTermSchema),
  utensilios: utensilsSchema,
});
export type Seed = z.infer<typeof seedSchema>;
