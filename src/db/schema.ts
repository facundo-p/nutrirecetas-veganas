import { z } from 'zod';
import { NIVELES_ENTRENAMIENTO } from '../domain/actividad';
import { intervalSchema } from '../seed/schema';

/**
 * Esquema Zod de los datos de usuario. Es la misma fuente de verdad para Dexie
 * y para el archivo de backup: si un backup viejo no valida, no entra.
 * Los campos van en castellano, como los de la semilla: son datos, no código.
 */

/**
 * v2: el perfil guarda `nivel_entrenamiento` en vez de `multiplicador_actividad`.
 * v3: se van los consumos. Contaban porciones comidas para alimentar el
 *     semáforo; sin semáforo no cuentan nada. El diario registra cocciones.
 */
export const USER_SCHEMA_VERSION = 3;

// ---------- perfil ----------

export const supplementSchema = z.strictObject({
  nutriente_id: z.string().min(1),
  dosis: z.number().positive(),
  unidad: z.string().min(1),
  frecuencia: z.enum(['diaria', '3x_semana', '2x_semana', 'semanal']),
  nota: z.string().optional(),
});
export type SuplementoDeclarado = z.infer<typeof supplementSchema>;

export const overrideSchema = z.strictObject({
  nutriente_id: z.string().min(1),
  objetivo: z.number().positive(),
  unidad: z.string().min(1),
  /** El dataset lo exige: un objetivo a mano sin motivo es un dato sin respaldo. */
  motivo: z.string().min(1),
});
export type ObjetivoManual = z.infer<typeof overrideSchema>;

export const profileDataSchema = z.strictObject({
  nombre: z.string().optional(),
  /** Parámetro fisiológico de las tablas RDA, no identidad (así lo declara el dataset). */
  sexo_para_requerimientos: z.enum(['masculino', 'femenino']),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  peso_kg: z.number().positive(),
  altura_cm: z.number().positive().optional(),
  /** La elección, no el número: el g/kg y su fuente viven en `domain/actividad`. */
  nivel_entrenamiento: z.enum(NIVELES_ENTRENAMIENTO),
  suplementos: z.array(supplementSchema),
  overrides: z.array(overrideSchema),
  nutrientes_destacados: z.array(z.string()),
});
export type ProfileData = z.infer<typeof profileDataSchema>;

export const profileSchema = profileDataSchema.extend({
  id: z.literal(1),
  creado_en: z.string(),
  actualizado_en: z.string(),
});
export type Perfil = z.infer<typeof profileSchema>;

// ---------- cocciones ----------

export const nutrientResultSchema = z.strictObject({
  intervalo: intervalSchema,
  cobertura_pct: z.number(),
  ic: z.number().nullable(),
});

export const nutritionSnapshotSchema = z.strictObject({
  masa_total_g: z.number(),
  kcal: nutrientResultSchema,
  por_nutriente: z.record(z.string(), nutrientResultSchema),
  alerta_b12: z.boolean(),
});
export type NutricionSnapshot = z.infer<typeof nutritionSnapshotSchema>;

export const cookedLineSchema = z.strictObject({
  ref: z.strictObject({ tipo: z.enum(['ingrediente', 'receta']), id: z.string() }),
  nombre: z.string(),
  g_aprox: z.number().nonnegative(),
  unidad_display: z.string(),
});
export type LineaCocinada = z.infer<typeof cookedLineSchema>;

export const variationSchema = z.strictObject({
  tipo: z.enum(['desmarcado', 'sustituido', 'agregado']),
  nombre: z.string(),
  detalle: z.string().optional(),
});
export type Variacion = z.infer<typeof variationSchema>;

/**
 * Snapshot denormalizado completo: el historial no depende de futuras versiones
 * de la semilla. Si mañana una receta cambia o se retira, lo cocinado sigue
 * contando exactamente lo que contaba.
 */
export const cookingDataSchema = z.strictObject({
  receta_id: z.string().min(1),
  receta_nombre: z.string().min(1),
  seed_version: z.string(),
  fecha: z.string(),
  porciones_rendidas: z.number().positive(),
  factor_escala: z.number().positive(),
  lineas: z.array(cookedLineSchema),
  variaciones: z.array(variationSchema),
  nota: z.string().optional(),
  nutricion_porcion: nutritionSnapshotSchema,
});
export type CoccionData = z.infer<typeof cookingDataSchema>;

export const cookingSchema = cookingDataSchema.extend({ id: z.number().int().positive() });
export type Coccion = z.infer<typeof cookingSchema>;

// ---------- overlays ----------

/** Lo que el usuario agrega sobre una receta de la semilla. La semilla jamás se muta. */
export const overlaySchema = z.strictObject({
  receta_id: z.string().min(1),
  ic_usuario: z.number().int().min(1).max(10).optional(),
  favorita: z.boolean().optional(),
  nota: z.string().optional(),
  actualizado_en: z.string(),
});
export type Overlay = z.infer<typeof overlaySchema>;

// ---------- meta ----------

export const metaSchema = z.strictObject({
  id: z.literal(1),
  user_schema_version: z.number().int().positive(),
  seed_version: z.string(),
  ultimo_backup: z.string().optional(),
  /** Cambios acumulados desde el último backup: alimenta el recordatorio. */
  cambios_desde_backup: z.number().int().nonnegative(),
  /** Hasta cuándo se calló el recordatorio. Vence por fecha o por cambios: lo que pase primero. */
  backup_pospuesto_hasta: z.string().optional(),
  /** Cuántos cambios había al posponer, para medir los que se acumularon desde entonces. */
  backup_pospuesto_en_cambios: z.number().int().nonnegative().optional(),
});
export type Meta = z.infer<typeof metaSchema>;

// ---------- archivo de backup ----------

export const backupSchema = z.strictObject({
  user_schema_version: z.number().int().positive(),
  seed_version: z.string(),
  exported_at: z.string(),
  data: z.strictObject({
    perfil: profileSchema.nullable(),
    cocciones: z.array(cookingSchema),
    overlays: z.array(overlaySchema),
  }),
});
export type Backup = z.infer<typeof backupSchema>;
