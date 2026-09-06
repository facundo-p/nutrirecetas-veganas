import Dexie, { type EntityTable } from 'dexie';
import { migrarOverlayV4, migrarPerfilV1, migrarPerfilV3 } from './migrations';
import type { Coccion, Meta, Overlay, Perfil } from './schema';

/**
 * Base local de datos de usuario. Todo lo que Facu genera vive acá y no sale
 * salvo por un export explícito; la semilla, al revés, nunca entra.
 *
 * Migraciones: cada cambio de forma agrega un `version(n).stores(...).upgrade(...)`
 * nuevo — jamás se edita una versión ya publicada, porque hay bases en la calle
 * que la usaron. Riesgo #2 del proyecto: una migración que corrompe se lleva
 * puesto el historial.
 */

/**
 * main y staging comparten origen en GitHub Pages, e IndexedDB es por origen:
 * sin este sufijo, probar algo en staging escribiría sobre el historial real.
 * Solo `staging` se desvía — cualquier otro valor, incluido ninguno, usa la base
 * de siempre, así dev y tests siguen viendo los datos de siempre.
 */
const SUFIJO_DE_ENTORNO = import.meta.env.VITE_ENTORNO === 'staging' ? '_staging' : '';

export const DB_NAME = `nutrirecetas_user${SUFIJO_DE_ENTORNO}`;

export class UserDb extends Dexie {
  perfil!: EntityTable<Perfil, 'id'>;
  cocciones!: EntityTable<Coccion, 'id'>;
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
    // v2: el perfil guarda el nivel de entrenamiento elegido en vez del
    // multiplicador numérico. Los índices no cambian; sí la forma del registro.
    this.version(2)
      .stores({})
      .upgrade((tx) =>
        tx
          .table('perfil')
          .toCollection()
          .modify((perfil, ref) => {
            ref.value = migrarPerfilV1(perfil as Record<string, unknown>);
          }),
      );
    // v3: se va la tabla de consumos. Contaba porciones comidas para alimentar
    // el semáforo, que ya no existe. Es una pérdida de datos declarada: la app
    // avisa una vez qué se borró (ver `AvisoDeConsumos` en App.tsx).
    this.version(3).stores({ consumos: null });
    // v4: el perfil pierde suplementos y overrides. Los índices no cambian; sí
    // la forma del registro, y `profileDataSchema` es estricto: un campo de más
    // haría rebotar el próximo guardado.
    this.version(4)
      .stores({})
      .upgrade((tx) =>
        tx
          .table('perfil')
          .toCollection()
          .modify((perfil, ref) => {
            ref.value = migrarPerfilV3(perfil as Record<string, unknown>);
          }),
      );
    // v5: el overlay pierde `favorita` e `ic_usuario` y gana `estado`. Los
    // índices no cambian; sí la forma del registro, y `overlaySchema` es
    // estricto: un campo de más haría rebotar el próximo guardado.
    this.version(5)
      .stores({})
      .upgrade((tx) =>
        tx
          .table('overlays')
          .toCollection()
          .modify((overlay, ref) => {
            ref.value = migrarOverlayV4(overlay as Record<string, unknown>);
          }),
      );
  }
}

export const db = new UserDb();
