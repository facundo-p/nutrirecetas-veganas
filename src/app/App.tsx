import { useEffect, useState } from 'react';
import { registerServiceWorker, requestPersistentStorage } from './pwa';
import { useRoute } from './router';
import { Nav } from './Nav';
import { RecipeList } from '../ui/recipes/RecipeList';
import { RecipeDetail } from '../ui/recipe-detail/RecipeDetail';
import { IngredientList } from '../ui/ingredients/IngredientList';
import { IngredientDetail } from '../ui/ingredients/IngredientDetail';
import { Glossary } from '../ui/glossary/Glossary';

function Screen({ route }: { route: ReturnType<typeof useRoute> }) {
  switch (route.screen) {
    case 'recipes':
      return <RecipeList />;
    case 'recipe':
      return <RecipeDetail id={route.id} />;
    case 'ingredients':
      return <IngredientList />;
    case 'ingredient':
      return <IngredientDetail id={route.id} />;
    case 'glossary':
      return <Glossary />;
  }
}

export function App() {
  const route = useRoute();
  const [applyUpdate, setApplyUpdate] = useState<(() => void) | null>(null);

  useEffect(() => {
    requestPersistentStorage();
    void registerServiceWorker((apply) => setApplyUpdate(() => apply));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  return (
    <div className="app">
      <Nav route={route} />
      <main className="contenido">
        <Screen route={route} />
      </main>
      {applyUpdate && (
        <div className="toast-actualizacion tarjeta" role="status">
          <span>Hay una versión nueva de la app.</span>
          <button type="button" onClick={applyUpdate}>
            Actualizar
          </button>
        </div>
      )}
    </div>
  );
}
