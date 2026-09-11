// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { getSeedIndex } from '../../seed';
import { computeNutrition, perPortion } from '../../domain/nutrition';
import { RecipeDetail } from './RecipeDetail';

const verNotas = () => fireEvent.click(screen.getByRole('button', { name: 'ver notas y sustitutos' }));

describe('Detalle de receta', () => {
  test('p19 muestra la alerta B12, el enlace al queso de maní y nutrición por porción', () => {
    render(<RecipeDetail id="p19" />);
    expect(screen.getByRole('heading', { name: /Pastel de papas/ })).toBeDefined();
    expect(screen.getByText(/no están fortificadas/)).toBeDefined();
    expect(screen.getByRole('link', { name: /Queso de maní/ })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Qué aporta una porción/ })).toBeDefined();
  });

  test('los ingredientes no son links; el preparado sí (issue #137)', () => {
    const { container } = render(<RecipeDetail id="p19" />);
    const lineas = [...container.querySelectorAll('.linea-nombre')];
    expect(lineas.length).toBeGreaterThan(1);
    const conLink = lineas.filter((n) => n.querySelector('a') !== null);
    // p19 tiene 11 ingredientes y un preparado (queso de maní): solo ese linkea.
    expect(conLink).toHaveLength(1);
    expect(conLink[0]!.textContent).toMatch(/Queso de maní/);
    expect(screen.getByText('Papa')).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Papa' })).toBeNull();
  });

  test('tocar un sustituto lo cambia en la receta y mueve la nutrición (issue #150)', () => {
    // r07 tiene quinoa con dos sustitutos resolubles: arroz integral y trigo burgol
    const { container } = render(<RecipeDetail id="r07" />);
    const kcal = () => container.querySelector('.panel-aporte-kcal .cifra')!.textContent;
    const antes = kcal();
    expect(screen.getByText('Quinoa')).toBeDefined();
    verNotas();

    const chip = screen.getByRole('button', { name: /Arroz integral/ });
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(chip);

    expect(screen.getByRole('button', { name: /Arroz integral/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/en vez de Quinoa/)).toBeDefined();
    expect(screen.queryByText('Quinoa')).toBeNull();
    expect(kcal()).not.toBe(antes);
  });

  test('despresionar el sustituto devuelve la receta a como es (issue #150)', () => {
    const { container } = render(<RecipeDetail id="r07" />);
    const kcal = () => container.querySelector('.panel-aporte-kcal .cifra')!.textContent;
    const antes = kcal();
    verNotas();

    fireEvent.click(screen.getByRole('button', { name: /Arroz integral/ }));
    // cambiar de un sustituto al otro sin volver al original en el medio
    fireEvent.click(screen.getByRole('button', { name: /Trigo burgol/ }));
    expect(screen.getByText(/en vez de Quinoa/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Trigo burgol/ }));
    expect(screen.getByText('Quinoa')).toBeDefined();
    expect(screen.queryByText(/en vez de/)).toBeNull();
    expect(kcal()).toBe(antes);
  });

  test('la fuente se lee, no es un código (issue #149)', () => {
    render(<RecipeDetail id="r05" />);
    const link = screen.getByRole('link', { name: 'Minimalist Baker (Dana Shultz)' });
    expect(link.getAttribute('href')).toBe('https://minimalistbaker.com/');
    expect(screen.queryByText(/Fuente: mb/)).toBeNull();
    // la credencial es lo que hace útil el origen, y va visible
    expect(screen.getByText('referente vegano; miles de valoraciones por receta')).toBeDefined();
    expect(screen.getByText(/Southwest Tofu Scramble/)).toBeDefined();
  });

  test('una fuente sin sitio no inventa un link', () => {
    render(<RecipeDetail id="p19" />);
    expect(screen.getByText(/Recetario personal de Facu/)).toBeDefined();
    expect(screen.queryByRole('link', { name: /Recetario personal/ })).toBeNull();
  });

  test('p04 (preparado) muestra nutrición por 100 g y quién lo consume', () => {
    render(<RecipeDetail id="p04" />);
    expect(screen.getByRole('heading', { name: /Qué aporta cada 100 g/ })).toBeDefined();
    expect(screen.getByText(/Se usa en/)).toBeDefined();
    expect(screen.getByRole('link', { name: /Pastel de papas/ })).toBeDefined();
  });

  test('bajar una porción no deja cantidades con decimales infinitos (issue #46)', () => {
    const { container } = render(<RecipeDetail id="r04" />); // 6 porciones
    fireEvent.click(screen.getByRole('button', { name: 'Menos porciones' }));
    const cantidades = [...container.querySelectorAll('.linea-cantidad')].map((n) => n.textContent);
    expect(cantidades.length).toBeGreaterThan(0);
    for (const texto of cantidades) expect(texto).not.toMatch(/[.,]\d\d/);
    expect(cantidades.some((t) => t?.includes('¾'))).toBe(true);
  });

  describe('qué aporta una porción (#162)', () => {
    const abrir = () => fireEvent.click(screen.getByRole('button', { name: /Qué aporta una porción/ }));
    const filaDe = (nombre: string) => screen.getByText(nombre, { selector: '.fila-aporte-nombre' }).closest('li')!;

    test('arranca cerrado, pero las kcal con su intervalo se ven igual (issue #59)', () => {
      const { container } = render(<RecipeDetail id="p19" />);
      expect(screen.getByRole('button', { name: /Qué aporta una porción/ }).getAttribute('aria-expanded')).toBe('false');
      expect(container.querySelector('.panel-aporte-kcal')!.textContent).toMatch(/kcal por porción/);
      expect(container.querySelector('.fila-aporte')).toBeNull();
    });

    test('escalar no cambia lo que aporta una porción: el redondeo de cocina no es nutrición', () => {
      // p28 a un cuarto: las cantidades redondeadas daban 300 kcal por porción en vez de 147
      const { container } = render(<RecipeDetail id="p28" />);
      const kcal = () => container.querySelector('.panel-aporte-kcal')!.textContent;
      const antes = kcal();
      const menos = screen.getByRole('button', { name: 'Menos porciones' }) as HTMLButtonElement;
      while (!menos.disabled) fireEvent.click(menos);
      expect(kcal()).toBe(antes);
    });

    test('las kcal dicen su intervalo cuando lo tienen: es parte del dato', () => {
      const idx = getSeedIndex();
      const conBanda = idx.seed.recetas.find((r) => {
        const porcion = perPortion(computeNutrition(r.id, idx));
        return porcion !== null && porcion.kcal.intervalo.max - porcion.kcal.intervalo.min > 1;
      })!;
      const { container } = render(<RecipeDetail id={conBanda.id} />);
      expect(container.querySelector('.panel-aporte-kcal')!.textContent).toMatch(/entre \d+ y \d+/);
    });

    test('un preparado dice que es cada 100 g', () => {
      const { container } = render(<RecipeDetail id="p04" />);
      expect(screen.getByRole('button', { name: /Qué aporta cada 100 g/ })).toBeDefined();
      expect(container.querySelector('.panel-aporte-kcal')!.textContent).toMatch(/kcal cada 100 g/);
    });

    test('abierto, los agrupa en minerales, vitaminas y macro y grasas', () => {
      render(<RecipeDetail id="p19" />);
      abrir();
      for (const grupo of ['Minerales', 'Vitaminas', 'Macro y grasas']) {
        expect(screen.getByRole('heading', { name: grupo })).toBeDefined();
      }
    });

    test('cada nutriente con dato dice cuánto del día cubre, y contra qué referencia', () => {
      render(<RecipeDetail id="p19" />);
      abrir();
      expect(filaDe('hierro').querySelector('.fila-aporte-pct')!.textContent).toMatch(/^[\d,]+ %$/);
      expect(screen.getByText('referencia adulta genérica')).toBeDefined();
    });

    test('los nutrientes sin dato quedan detrás de un contador, y no se esconden (invariante 5)', () => {
      render(<RecipeDetail id="p19" />);
      abrir();
      expect(screen.queryByText('vitamina K', { selector: '.fila-aporte-nombre' })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: /nutrientes? sin dato/ }));
      const vitk = filaDe('vitamina K');
      expect(vitk.textContent).toMatch(/sin dato/);
      expect(vitk.querySelector('.fila-aporte-pct')!.textContent).toBe('—');
    });

    test('una B12 que va de cero a algo no da porcentaje: sin la banda a la vista diría de más', () => {
      render(<RecipeDetail id="p19" />);
      abrir();
      expect(filaDe('vitamina B12').querySelector('.fila-aporte-pct')!.textContent).toBe('—');
    });

    test('al tocar una fila se ve la banda, sobre cuánto del peso se calculó y quién lo trae', () => {
      render(<RecipeDetail id="r01" />);
      abrir();
      fireEvent.click(within(filaDe('hierro')).getByRole('button'));
      expect(filaDe('hierro').textContent).toMatch(/Calculado sobre el \d+ % del peso/);
      expect(filaDe('hierro').textContent).toMatch(/Lo aportan: Lentejas turcas/);
    });

    test('se abre una fila por vez', () => {
      render(<RecipeDetail id="r01" />);
      abrir();
      const boton = (nombre: string) => within(filaDe(nombre)).getByRole('button');
      fireEvent.click(boton('hierro'));
      fireEvent.click(boton('proteína'));
      expect(boton('hierro').getAttribute('aria-expanded')).toBe('false');
      expect(boton('proteína').getAttribute('aria-expanded')).toBe('true');
    });

    test('los que entran a las barras llevan su color; los otros, cuadrado hueco', () => {
      render(<RecipeDetail id="r01" />);
      abrir();
      const proteina = filaDe('proteína').querySelector('.cuadrado-nutriente')!;
      expect(proteina.getAttribute('data-nut')).toBe('proteina');
      expect(proteina.className).not.toMatch(/\bhueco\b/);
      expect(filaDe('potasio').querySelector('.cuadrado-nutriente')!.className).toMatch(/\bhueco\b/);
    });

    test('va al final: primero todo lo que sirve para cocinar', () => {
      const { container } = render(<RecipeDetail id="p19" />);
      const titulos = [...container.querySelectorAll('h2')].map((h) => h.textContent ?? '');
      const pasos = titulos.findIndex((t) => t.includes('Pasos'));
      expect(pasos).toBeGreaterThanOrEqual(0);
      expect(titulos.findIndex((t) => t.includes('Qué aporta'))).toBeGreaterThan(pasos);
    });
  });

  describe('encabezado, escalador y lista de ingredientes (#160)', () => {
    test('las notas y los sustitutos arrancan apagados, y se prenden todos juntos', () => {
      render(<RecipeDetail id="r07" />);
      expect(screen.queryByRole('button', { name: /Arroz integral/ })).toBeNull();
      verNotas();
      expect(screen.getByRole('button', { name: /Arroz integral/ })).toBeDefined();
      expect(screen.getByRole('button', { name: 'ocultar notas' }).getAttribute('aria-pressed')).toBe('true');
    });

    test('la línea sustituida dice de qué viene aunque las notas se apaguen', () => {
      render(<RecipeDetail id="r07" />);
      verNotas();
      fireEvent.click(screen.getByRole('button', { name: /Arroz integral/ }));
      fireEvent.click(screen.getByRole('button', { name: 'ocultar notas' }));
      expect(screen.getByText(/en vez de Quinoa/)).toBeDefined();
    });

    test('cada ingrediente lleva su punto', () => {
      const { container } = render(<RecipeDetail id="p19" />);
      const lineas = container.querySelectorAll('.linea-ingrediente');
      expect(lineas.length).toBeGreaterThan(0);
      expect(container.querySelectorAll('.linea-ingrediente .punto-nutriente')).toHaveLength(lineas.length);
    });

    const puntoDe = (container: HTMLElement, nombre: RegExp) =>
      [...container.querySelectorAll('.linea-ingrediente')]
        .find((li) => nombre.test(li.querySelector('.linea-nombre')?.textContent ?? ''))
        ?.querySelector('.punto-nutriente')
        ?.getAttribute('data-nut');

    test('la levadura nutricional va con punto hueco, y la nota dice lo de la B12', () => {
      const { container } = render(<RecipeDetail id="p19" />);
      expect(puntoDe(container, /levadura/i)).toBe('condicional');
      expect(screen.getByText(/trae B12 solo si la marca está fortificada/)).toBeDefined();
    });

    test('también cuando la trae un preparado: la pastafrola la lleva dentro de la manteca vegana', () => {
      const { container } = render(<RecipeDetail id="p31" />);
      // p31 no tiene levadura como línea propia: la trae p03
      const nombres = [...container.querySelectorAll('.linea-nombre')].map((n) => n.textContent ?? '');
      expect(nombres.length).toBeGreaterThan(0);
      expect(nombres.some((n) => /levadura/i.test(n))).toBe(false);
      expect(puntoDe(container, /Manteca vegana/)).toBe('condicional');
      expect(screen.getByText(/trae B12 solo si la marca está fortificada/)).toBeDefined();
    });

    test('una receta sin levadura no habla de B12', () => {
      render(<RecipeDetail id="r07" />);
      expect(screen.queryByText(/trae B12 solo si/)).toBeNull();
    });

    test('el escalador dice cuánto hay en la olla, y lo recalcula', () => {
      const { container } = render(<RecipeDetail id="r04" />);
      const masa = () => container.querySelector('.escalador-masa')!.textContent;
      const antes = masa();
      expect(antes).toMatch(/g en la olla$/);
      fireEvent.click(screen.getByRole('button', { name: 'Más porciones' }));
      expect(masa()).not.toBe(antes);
      fireEvent.click(screen.getByRole('button', { name: /volver a/ }));
      expect(masa()).toBe(antes);
    });

    test('un nombre de más de 40 caracteres baja de tamaño; uno corto no', () => {
      const recetas = getSeedIndex().seed.recetas;
      const larga = recetas.find((r) => r.nombre.length > 40)!;
      const corta = recetas.find((r) => r.nombre.length <= 40)!;
      const { unmount } = render(<RecipeDetail id={larga.id} />);
      expect(screen.getByRole('heading', { level: 1 }).className).toMatch(/\blargo\b/);
      unmount();
      render(<RecipeDetail id={corta.id} />);
      expect(screen.getByRole('heading', { level: 1 }).className).not.toMatch(/\blargo\b/);
    });
  });

  describe('ajustar cantidades según un ingrediente (#161)', () => {
    const ajustar = () => fireEvent.click(screen.getByRole('button', { name: /Ajustar cantidades según un ingrediente/ }));
    const campos = (c: HTMLElement) => [...c.querySelectorAll<HTMLInputElement>('.linea-input')];

    test('convierte cada cantidad en un campo', () => {
      const { container } = render(<RecipeDetail id="r01" />);
      expect(campos(container)).toHaveLength(0);
      ajustar();
      expect(campos(container)).toHaveLength(container.querySelectorAll('.linea-ingrediente').length);
    });

    test('cambiar una cantidad acomoda las demás en proporción', () => {
      const { container } = render(<RecipeDetail id="r01" />);
      ajustar();
      // lentejas: 1½ taza; cebolla: 1 grande. Con 3 tazas la receta se duplica.
      fireEvent.change(campos(container)[0]!, { target: { value: '3' } });
      expect(campos(container)[1]!.value).toBe('2');
    });

    test('lo que no es un número no mueve nada', () => {
      const { container } = render(<RecipeDetail id="r01" />);
      ajustar();
      fireEvent.change(campos(container)[0]!, { target: { value: 'abc' } });
      expect(campos(container)[1]!.value).toBe('1');
    });

    test('lo que va a gusto dice cuánto pedía la receta, y una sola nota lo avisa', () => {
      const { container } = render(<RecipeDetail id="r01" />);
      ajustar();
      expect(screen.queryByText(/no escalan lineal/)).toBeNull();
      fireEvent.change(campos(container)[0]!, { target: { value: '3' } });
      expect(screen.getByText(/la receta decía 2 cdta/)).toBeDefined();
      expect(screen.getAllByText(/no escalan lineal/)).toHaveLength(1);
    });

    test('«volver a la receta» deshace el ajuste', () => {
      const { container } = render(<RecipeDetail id="r01" />);
      ajustar();
      fireEvent.change(campos(container)[0]!, { target: { value: '3' } });
      fireEvent.blur(campos(container)[0]!);
      fireEvent.click(screen.getByRole('button', { name: 'volver a la receta' }));
      expect(campos(container)[0]!.value).toBe('1,5');
      expect(campos(container)[1]!.value).toBe('1');
    });
  });

  test('una receta inexistente no rompe', () => {
    render(<RecipeDetail id="zzz" />);
    expect(screen.getByRole('heading', { name: /Receta no encontrada/ })).toBeDefined();
  });
});
