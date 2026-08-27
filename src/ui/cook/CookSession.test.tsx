// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { routeHash } from '../../app/router';
import { useSession } from '../../app/store';
import { db } from '../../db/db';
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
  waitFor(() => expect(window.location.hash).toBe(routeHash({ screen: 'today' })));

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

  test('registrar guarda la cocción con lo que rindió, y no pregunta cuánto comiste', async () => {
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
    await esperarQueTermineElRegistro();
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
    await esperarQueTermineElRegistro();
  });
});
