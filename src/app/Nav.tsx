import { IconCarta, IconHojaEntera, IconLibro, IconZanahoria } from '../ui/icons/icons';
import { routeHash, type Route } from './router';

/**
 * Cuatro secciones en la barra: Hoy es la respuesta a "¿cómo vengo y qué
 * cocino?", así que abre la app. Cuatro y no más porque a 390 px es lo que
 * entra con targets cómodos — el item "Más" que este comentario prometía nunca
 * se implementó y queda descartado. Ajustes se abre con el engranaje del
 * encabezado (`EncabezadoPantalla`) y Glosario desde Diario.
 */
const ITEMS = [
  { label: 'Hoy', screens: ['today'], route: { screen: 'today' } as Route, Icon: IconHojaEntera },
  { label: 'Recetario', screens: ['recipes', 'recipe', 'cook'], route: { screen: 'recipes' } as Route, Icon: IconCarta },
  {
    label: 'Ingredientes',
    screens: ['ingredients', 'ingredient'],
    route: { screen: 'ingredients' } as Route,
    Icon: IconZanahoria,
  },
  { label: 'Diario', screens: ['diary', 'glossary', 'profile', 'settings'], route: { screen: 'diary' } as Route, Icon: IconLibro },
] as const;

export function Nav({ route }: { route: Route }) {
  return (
    <nav className="nav" aria-label="Secciones">
      <a className="nav-marca" href={routeHash({ screen: 'today' })}>
        Nutrirecetas
      </a>
      {ITEMS.map(({ label, screens, route: target, Icon }) => (
        <a
          key={label}
          className="nav-item"
          href={routeHash(target)}
          aria-current={(screens as readonly string[]).includes(route.screen)}
        >
          <Icon />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
