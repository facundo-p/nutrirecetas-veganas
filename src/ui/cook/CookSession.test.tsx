// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { routeHash } from '../../app/router';
import { useSession } from '../../app/store';
import { db } from '../../db/db';
import { saveOverlay } from '../../db/repos';
import { CookSession } from './CookSession';

/**
 * El ciclo que define la Fase 2: personalizar → cocinar → registrar, y que lo
 * registrado sea exactamente lo que se comió.
 */

/**
 * `registrar` escribe en la base y recién después navega. Esperar solo la
 * escritura deja la navegación corriendo después del fin del test, contra un
 * jsdom ya desmontado: unhandled rejection que rompe el CI de forma intermitente.
 */
const esperarQueTermineElRegistro = () =>
  waitFor(() => expect(window.location.hash).toBe(routeHash({ screen: 'diary' })));

const enPersonalizar = async () => {
  render(<CookSession recetaId="r01" />);
  await waitFor(() => screen.getByRole('heading', { name: 'Qué va a la olla' }));
};

const empezarACocinar = () => fireEvent.click(screen.getByRole('button', { name: 'Empezar a cocinar' }));

const cocinarHastaElFinal = () => {
  empezarACocinar();
  while (screen.queryByRole('button', { name: 'Listo, el que sigue' })) {
    fireEvent.click(screen.getByRole('button', { name: 'Listo, el que sigue' }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Terminé' }));
};

const saltarAlPaso = (numero: number) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${numero} `) }));

const pasoAbierto = () => within(screen.getByRole('listitem', { current: 'step' }));

const desmarcar = (nombre: RegExp) =>
  fireEvent.click(screen.getByText(nombre).closest('label')!.querySelector('input')!);

beforeEach(async () => {
  // limpiar en vez de borrar: cerrar la base deja colgadas las queries en vuelo
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
  useSession.getState().terminar();
  window.location.hash = '';
});

describe('sesión de cocina', () => {
  test('arranca en personalizar con todos los ingredientes de la receta', async () => {
    await enPersonalizar();
    const checks = screen.getAllByRole('checkbox');
    expect(checks.length).toBeGreaterThan(3);
    expect(checks.every((c) => (c as HTMLInputElement).checked)).toBe(true);
  });

  test('desmarcar un imprescindible pide confirmación citando su función', async () => {
    await enPersonalizar();

    // las lentejas son la proteína del plato en r01
    const lentejas = screen.getByText(/Lentejas/).closest('label')!.querySelector('input')!;
    fireEvent.click(lentejas);

    expect(screen.getByRole('alertdialog')).toBeDefined();
    expect(screen.getByText(/imprescindible/)).toBeDefined();
    expect((lentejas as HTMLInputElement).checked).toBe(true); // todavía no se sacó

    fireEvent.click(screen.getByRole('button', { name: 'Sacarlo igual' }));
    expect((lentejas as HTMLInputElement).checked).toBe(false);
  });

  test('la nutrición en vivo baja al sacar un ingrediente', async () => {
    await enPersonalizar();
    const leerKcal = () => Number(/(\d+) kcal/.exec(screen.getByText(/kcal/).textContent ?? '')?.[1] ?? 0);
    const antes = leerKcal();

    desmarcar(/Lentejas/);
    fireEvent.click(screen.getByRole('button', { name: 'Sacarlo igual' }));

    await waitFor(() => expect(leerKcal()).toBeLessThan(antes));
  });

  test('registrar guarda la cocción con lo que rindió, y no pregunta cuánto comiste', async () => {
    await enPersonalizar();
    cocinarHastaElFinal();

    const rendidas = screen.getByLabelText(/Porciones que rindió/);
    fireEvent.change(rendidas, { target: { value: '4' } });
    expect(screen.queryByLabelText(/Porciones que comiste ahora/)).toBeNull();
    expect(screen.queryByText(/de sobra/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Registrar la cocción' }));

    await waitFor(async () => {
      const cocciones = await db.cocciones.toArray();
      expect(cocciones).toHaveLength(1);
      expect(cocciones[0]!.porciones_rendidas).toBe(4);
      expect(cocciones[0]!.receta_id).toBe('r01');
    });
    await esperarQueTermineElRegistro();
  });

  test('el registro guarda las variaciones que se hicieron', async () => {
    await enPersonalizar();
    desmarcar(/Perejil/); // no es imprescindible: sale sin confirmación

    cocinarHastaElFinal();
    expect(screen.getByText(/sin Perejil/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Registrar la cocción' }));
    await waitFor(async () => {
      const cocciones = await db.cocciones.toArray();
      expect(cocciones[0]!.variaciones).toContainEqual({ tipo: 'desmarcado', nombre: 'Perejil' });
    });
    await esperarQueTermineElRegistro();
  });

  test('registrar una cocción marca la receta como probada (issue #145)', async () => {
    await enPersonalizar();
    cocinarHastaElFinal();

    fireEvent.click(screen.getByRole('button', { name: 'Registrar la cocción' }));
    await waitFor(async () => {
      expect((await db.overlays.get('r01'))?.estado).toBe('probada');
    });
    await esperarQueTermineElRegistro();
  });

  test('cocinar una favorita no la degrada a probada (issue #145)', async () => {
    await saveOverlay('r01', { estado: 'favorita' });

    await enPersonalizar();
    cocinarHastaElFinal();

    fireEvent.click(screen.getByRole('button', { name: 'Registrar la cocción' }));
    await waitFor(async () => expect(await db.cocciones.count()).toBe(1));
    expect((await db.overlays.get('r01'))?.estado).toBe('favorita');
    await esperarQueTermineElRegistro();
  });
});

/** r01 tiene seis pasos; en el quinto, el hervor, no entra nada. */
describe('la mesada (issue #164)', () => {
  test('la receta entera a la vista, con el paso actual abierto y lo que entra en él', async () => {
    await enPersonalizar();
    empezarACocinar();

    expect(screen.getByText('Paso 1 de 6')).toBeDefined();
    const abierto = pasoAbierto();
    for (const nombre of ['Cebolla', 'Zanahoria', 'Aceite de oliva virgen']) {
      expect(abierto.getByText(nombre)).toBeDefined();
    }
    expect(abierto.queryByText('Lentejas turcas')).toBeNull();
    expect(screen.getAllByRole('button', { name: /^[2-6] / })).toHaveLength(5);
  });

  test('tocar un paso salta a ese paso', async () => {
    await enPersonalizar();
    empezarACocinar();
    saltarAlPaso(4);

    expect(screen.getByText('Paso 4 de 6')).toBeDefined();
    expect(pasoAbierto().getByText('Lentejas turcas')).toBeDefined();
    expect(pasoAbierto().getByText('Caldo de verduras')).toBeDefined();
    expect(screen.getByRole('button', { name: /^1 / })).toBeDefined();
  });

  test('lo que se sacó no aparece en su paso', async () => {
    await enPersonalizar();
    desmarcar(/Perejil/);
    empezarACocinar();
    saltarAlPaso(6);

    expect(pasoAbierto().getByText('Limón (jugo)')).toBeDefined();
    expect(pasoAbierto().queryByText('Perejil')).toBeNull();
  });

  test('los secretos del chef van todos juntos en el primer paso', async () => {
    await enPersonalizar();
    empezarACocinar();
    expect(pasoAbierto().getByText('Secretos del chef')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Listo, el que sigue' }));
    expect(screen.queryByText('Secretos del chef')).toBeNull();
  });

  test('el paso tiñe la pantalla con su nutriente; sin ingredientes, el papel de siempre', async () => {
    await enPersonalizar();
    empezarACocinar();
    const mesada = screen.getByRole('article', { name: /Sopa de lentejas/ });

    saltarAlPaso(4);
    expect(mesada.getAttribute('data-nut')).toBe('folato'); // el de las lentejas

    saltarAlPaso(5);
    expect(mesada.hasAttribute('data-nut')).toBe(false);
  });

  test('en el primer paso no hay atrás, y los ingredientes vuelven a personalizar', async () => {
    await enPersonalizar();
    empezarACocinar();
    expect((screen.getByRole('button', { name: 'Atrás' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: '‹ Ingredientes' }));
    expect(screen.getByRole('heading', { name: 'Qué va a la olla' })).toBeDefined();
  });
});

/**
 * El factor se elegía en la ficha y se perdía al entrar: `CookSession` lo leía
 * de `location.search`, que en un router de hash nunca tiene nada.
 */
describe('el factor de la ficha llega a la mesada (issue #201)', () => {
  test('cocinar al doble arranca la sesión al doble', async () => {
    render(<CookSession recetaId="r01" factor={2} />);
    await waitFor(() => screen.getByRole('heading', { name: 'Qué va a la olla' }));
    expect(useSession.getState().porciones).toBe(8); // r01 rinde 4
    const lentejas = useSession.getState().lineas.find((l) => l.ref.id === 'lentejas_turcas')!;
    expect(lentejas.g_aprox).toBe(600);
  });

  test('sin factor se cocina la receta como es', async () => {
    await enPersonalizar();
    expect(useSession.getState().porciones).toBe(4);
  });

  test('volver a la ficha y cambiar las porciones rearma la sesión', async () => {
    const { rerender } = render(<CookSession recetaId="r01" />);
    await waitFor(() => expect(useSession.getState().porciones).toBe(4));
    rerender(<CookSession recetaId="r01" factor={2} />);
    await waitFor(() => expect(useSession.getState().porciones).toBe(8));
  });
});
