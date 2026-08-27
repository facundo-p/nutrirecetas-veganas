import { IconCarta, IconLibro, IconZanahoria } from '../ui/icons/icons';
import { routeHash, type Route } from './router';

/**
 * El Recetario abre la app y va primero: esto es un recetario, y la nutrición
 * se consulta cuando interesa. A 390 px entran cuatro items con targets
 * cómodos; por ahora son tres. Ajustes se abre con el engranaje del encabezado
 * (`EncabezadoPantalla`) y Glosario desde Diario.
 */
const ITEMS = [
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
      <a className="nav-marca" href={routeHash({ screen: 'recipes' })}>
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
