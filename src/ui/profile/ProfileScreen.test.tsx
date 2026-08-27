// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { db } from '../../db/db';
import { ProfileScreen } from './ProfileScreen';

beforeEach(async () => {
  // limpiar en vez de borrar: cerrar la base deja colgadas las queries en vuelo
  if (!db.isOpen()) await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

async function completarDatosMinimos() {
  fireEvent.click(screen.getByRole('radio', { name: 'Masculino' }));
  fireEvent.change(screen.getByLabelText(/Fecha de nacimiento/), { target: { value: '1990-01-01' } });
  fireEvent.change(screen.getByLabelText(/Peso/), { target: { value: '75' } });
}

describe('perfil', () => {
  test('arranca vacío: ningún placeholder del dataset', () => {
    render(<ProfileScreen />);
    expect((screen.getByLabelText(/Peso/) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Fecha de nacimiento/) as HTMLInputElement).value).toBe('');
    expect(screen.queryByDisplayValue('75')).toBeNull();
    expect(screen.queryByDisplayValue('1990-01-01')).toBeNull();
  });

  test('aclara que el sexo es un parámetro de las tablas, no identidad', () => {
    render(<ProfileScreen />);
    expect(screen.getByText(/no una pregunta sobre identidad/i)).toBeDefined();
  });

  test('no deja calcular objetivos hasta tener los datos mínimos', async () => {
    render(<ProfileScreen />);
    const boton = screen.getByRole('button', { name: /Calcular mis objetivos/ });
    expect((boton as HTMLButtonElement).disabled).toBe(true);
    await completarDatosMinimos();
    expect((boton as HTMLButtonElement).disabled).toBe(false);
  });

  test('guardar muestra los objetivos derivados del perfil', async () => {
    render(<ProfileScreen />);
    await completarDatosMinimos();
    fireEvent.click(screen.getByRole('button', { name: /Calcular mis objetivos/ }));

    await waitFor(() => expect(screen.getByText('Tus dosis diarias de referencia')).toBeDefined());
    // hierro: 8 mg × 1.8 = 14,4
    expect(screen.getByText('14,4 mg')).toBeDefined();
    // proteína: 0,8 g/kg × 1,25 × 75 kg = 75
    expect(screen.getByText('75 g')).toBeDefined();
  });

  test('ya no pregunta por suplementos: no hay exigencia que apagar', () => {
    render(<ProfileScreen />);
    expect(screen.queryByRole('button', { name: 'Agregar suplemento' })).toBeNull();
    expect(screen.queryByText(/cubierto por suplemento/)).toBeNull();
  });

  test('dice que es opcional y para qué sirve', () => {
    render(<ProfileScreen />);
    expect(screen.getByText(/Es opcional/)).toBeDefined();
    expect(screen.getByText(/no de una referencia adulta genérica/)).toBeDefined();
  });

  test('los nutrientes que te interesan se eligen y se guardan', async () => {
    render(<ProfileScreen />);
    await completarDatosMinimos();

    // viene marcado por defecto; destildarlo tiene que quedar guardado
    const hierro = screen.getByRole('checkbox', { name: 'Hierro' }) as HTMLInputElement;
    expect(hierro.checked).toBe(true);
    fireEvent.click(hierro);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Fibra' }));

    fireEvent.click(screen.getByRole('button', { name: /Calcular mis objetivos/ }));
    await waitFor(async () => {
      const destacados = (await db.perfil.get(1))!.nutrientes_destacados;
      expect(destacados).not.toContain('hierro');
      expect(destacados).toContain('fibra');
    });
  });

  test('el perfil guardado se puede volver a editar', async () => {
    render(<ProfileScreen />);
    await completarDatosMinimos();
    fireEvent.click(screen.getByRole('button', { name: /Calcular mis objetivos/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Guardar cambios/ })).toBeDefined());

    fireEvent.change(screen.getByLabelText(/Peso/), { target: { value: '80' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/ }));
    await waitFor(async () => expect((await db.perfil.get(1))!.peso_kg).toBe(80));
  });

  test('el selector pregunta por el entrenamiento, no por la edad', () => {
    render(<ProfileScreen />);
    expect(screen.getByRole('radio', { name: /Sedentario/ })).toBeDefined();
    expect(screen.getByRole('radio', { name: /Activo/ })).toBeDefined();
    expect(screen.getByRole('radio', { name: /Entrenás fuerza/ })).toBeDefined();
    expect(screen.getByRole('radio', { name: /Entrenamiento intenso/ })).toBeDefined();
    // la edad ya está en el perfil: pedirla de nuevo acá era pedir un dato dos veces
    expect(screen.queryByRole('radio', { name: /60/ })).toBeNull();
  });

  test('entrenamiento intenso lleva la proteína a 2 g/kg', async () => {
    render(<ProfileScreen />);
    await completarDatosMinimos();
    fireEvent.click(screen.getByRole('radio', { name: /Entrenamiento intenso/ }));
    fireEvent.click(screen.getByRole('button', { name: /Calcular mis objetivos/ }));

    await waitFor(() => expect(screen.getByText('Tus dosis diarias de referencia')).toBeDefined());
    expect(screen.getByText('150 g')).toBeDefined();
  });

  test('deja claro que la app informa y no diagnostica', () => {
    render(<ProfileScreen />);
    expect(screen.getByText(/informa, no diagnostica/i)).toBeDefined();
    expect(screen.getByText(/embarazo, lactancia/i)).toBeDefined();
  });
});
