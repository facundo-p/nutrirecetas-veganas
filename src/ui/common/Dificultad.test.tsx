// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Dificultad, nivelDeDificultad } from './Dificultad';

describe('Dificultad', () => {
  test('trivial llena un casillero y difícil los cinco', () => {
    expect(nivelDeDificultad('trivial')).toBe(1);
    expect(nivelDeDificultad('difícil')).toBe(5);
  });

  test('el nivel va como atributo y el nombre, para el lector de pantalla', () => {
    render(<Dificultad dificultad="media" />);
    const icono = screen.getByRole('img', { name: 'dificultad media' });
    expect(icono.getAttribute('data-nivel')).toBe('4');
  });
});
