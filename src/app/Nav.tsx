import { IconCarta, IconLibro, IconZanahoria } from '../ui/icons/icons';
import { routeHash, type Route } from './router';

const ITEMS = [
  { label: 'Recetario', screens: ['recipes', 'recipe'], route: { screen: 'recipes' } as Route, Icon: IconCarta },
  {
    label: 'Ingredientes',
    screens: ['ingredients', 'ingredient'],
    route: { screen: 'ingredients' } as Route,
    Icon: IconZanahoria,
  },
  { label: 'Glosario', screens: ['glossary'], route: { screen: 'glossary' } as Route, Icon: IconLibro },
] as const;

export function Nav({ route }: { route: Route }) {
  return (
    <nav className="nav" aria-label="Secciones">
      <span className="nav-marca">Nutrirecetas</span>
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
