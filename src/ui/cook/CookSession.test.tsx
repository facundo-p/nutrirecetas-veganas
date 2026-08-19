// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { useSession } from '../../app/store';
import { db } from '../../db/db';
import { CookSession } from './CookSession';

/**
 * El ciclo que define la Fase 2: personalizar → cocinar → registrar, y que lo
 * registrado sea exactamente lo que se comió.
 */

beforeEach(async () => {
  // limpiar en vez de borrar: cerrar la base deja colgadas las queries en vuelo
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
  useSession.getState().terminar();
  window.location.hash = '';
});

describe('sesión de cocina', () => {
  test('arranca en personalizar con todos los ingredientes de la receta', async () => {
    render(<CookSession recetaId="r01" />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Qué va a la olla' })).toBeDefined());
    const checks = screen.getAllByRole('checkbox');
    expect(checks.length).toBeGreaterThan(3);
    expect(checks.every((c) => (c as HTMLInputElement).checked)).toBe(true);
  });

  test('desmarcar un imprescindible pide confirmación citando su función', async () => {
    render(<CookSession recetaId="r01" />);
    await waitFor(() => screen.getByRole('heading', { name: 'Qué va a la olla' }));

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
    render(<CookSession recetaId="r01" />);
    await waitFor(() => screen.getByRole('heading', { name: 'Qué va a la olla' }));
    const leerKcal = () => Number(/(\d+) kcal/.exec(screen.getByText(/kcal/).textContent ?? '')?.[1] ?? 0);
    const antes = leerKcal();

    const lentejas = screen.getByText(/Lentejas/).closest('label')!.querySelector('input')!;
    fireEvent.click(lentejas);
    fireEvent.click(screen.getByRole('button', { name: 'Sacarlo igual' }));

    await waitFor(() => expect(leerKcal()).toBeLessThan(antes));
  });

  test('registrar guarda la cocción, el consumo y deja las sobras', async () => {
    render(<CookSession recetaId="r01" />);
    await waitFor(() => screen.getByRole('heading', { name: 'Qué va a la olla' }));

    fireEvent.click(screen.getByRole('button', { name: 'Empezar a cocinar' }));
    // saltar al final de los pasos
    const irAlFinal = async () => {
      while (screen.queryByRole('button', { name: 'Siguiente' })) {
        fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
      }
    };
    await irAlFinal();
    fireEvent.click(screen.getByRole('button', { name: 'Terminé de cocinar' }));

    const rendidas = screen.getByLabelText(/Porciones que rindió/);
    const comidas = screen.getByLabelText(/Porciones que comiste ahora/);
    fireEvent.change(rendidas, { target: { value: '4' } });
    fireEvent.change(comidas, { target: { value: '2' } });
    expect(screen.getByText(/Quedan 2 porciones de sobra/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Registrar la cocción' }));

    await waitFor(async () => {
      const [cocciones, consumos] = await Promise.all([db.cocciones.toArray(), db.consumos.toArray()]);
      expect(cocciones).toHaveLength(1);
      expect(cocciones[0]!.porciones_rendidas).toBe(4);
      expect(cocciones[0]!.receta_id).toBe('r01');
      expect(consumos).toHaveLength(1);
      expect(consumos[0]!.porciones).toBe(2);
    });
  });

  test('el registro guarda las variaciones que se hicieron', async () => {
    render(<CookSession recetaId="r01" />);
    await waitFor(() => screen.getByRole('heading', { name: 'Qué va a la olla' }));

    const perejil = screen.getByText(/Perejil/).closest('label')!.querySelector('input')!;
    fireEvent.click(perejil); // no es imprescindible: sale sin confirmación

    fireEvent.click(screen.getByRole('button', { name: 'Empezar a cocinar' }));
    while (screen.queryByRole('button', { name: 'Siguiente' })) {
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Terminé de cocinar' }));
    expect(screen.getByText(/sin Perejil/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Registrar la cocción' }));
    await waitFor(async () => {
      const cocciones = await db.cocciones.toArray();
      expect(cocciones[0]!.variaciones).toContainEqual({ tipo: 'desmarcado', nombre: 'Perejil' });
    });
  });

  test('una receta por probar ofrece subirle la confianza al registrarla', async () => {
    render(<CookSession recetaId="r01" />);
    await waitFor(() => screen.getByRole('heading', { name: 'Qué va a la olla' }));
    fireEvent.click(screen.getByRole('button', { name: 'Empezar a cocinar' }));
    while (screen.queryByRole('button', { name: 'Siguiente' })) {
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Terminé de cocinar' }));
    expect(screen.getByText(/La probé y la apruebo/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Registrar la cocción' }));
    await waitFor(async () => {
      expect((await db.overlays.get('r01'))?.ic_usuario).toBe(8);
    });
  });
});
