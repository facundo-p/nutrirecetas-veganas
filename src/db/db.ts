import Dexie, { type EntityTable } from 'dexie';
import type { Coccion, Consumo, Meta, Overlay, Perfil } from './schema';

/**
 * Base local de datos de usuario. Todo lo que Facu genera vive acá y no sale
 * salvo por un export explícito; la semilla, al revés, nunca entra.
 *
 * Migraciones: cada cambio de forma agrega un `version(n).stores(...).upgrade(...)`
 * nuevo — jamás se edita una versión ya publicada, porque hay bases en la calle
 * que la usaron. Riesgo #2 del proyecto: una migración que corrompe se lleva
 * puesto el historial.
 */

export const DB_NAME = 'nutrirecetas_user';

export class UserDb extends Dexie {
  perfil!: EntityTable<Perfil, 'id'>;
  cocciones!: EntityTable<Coccion, 'id'>;
  consumos!: EntityTable<Consumo, 'id'>;
  overlays!: EntityTable<Overlay, 'receta_id'>;
  meta!: EntityTable<Meta, 'id'>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      perfil: 'id',
      cocciones: '++id, receta_id, fecha',
      consumos: '++id, coccion_id, fecha',
      overlays: 'receta_id',
      meta: 'id',
    });
  }
}

export const db = new UserDb();
