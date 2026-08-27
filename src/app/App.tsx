import { useEffect, useState } from 'react';
import { registerServiceWorker, requestPersistentStorage } from './pwa';
import { useRoute } from './router';
import { Nav } from './Nav';
import { RecipeList } from '../ui/recipes/RecipeList';
import { RecipeDetail } from '../ui/recipe-detail/RecipeDetail';
import { IngredientList } from '../ui/ingredients/IngredientList';
import { IngredientDetail } from '../ui/ingredients/IngredientDetail';
import { Glossary } from '../ui/glossary/Glossary';
import { TodayScreen } from '../ui/today/TodayScreen';
import { ProfileScreen } from '../ui/profile/ProfileScreen';
import { CookSession } from '../ui/cook/CookSession';
import { DiaryScreen } from '../ui/diary/DiaryScreen';
import { SettingsScreen } from '../ui/settings/SettingsScreen';
import { useMeta } from '../db/hooks';
import { hayQueRecordarBackup, posponerRecordatorioBackup } from '../db/backup';
import { marcarEsquemaVisto } from '../db/repos';
import { USER_SCHEMA_VERSION } from '../db/schema';
import { IconCerrar } from '../ui/icons/icons';
import { routeHash } from './router';

function Screen({ route }: { route: ReturnType<typeof useRoute> }) {
  switch (route.screen) {
    case 'today':
      return <TodayScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'cook':
      return <CookSession recetaId={route.id} />;
    case 'diary':
      return <DiaryScreen />;
    case 'settings':
      return <SettingsScreen />;
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

/**
 * Recordatorio de backup: insistente, pero se puede callar. Sin backend, un
 * borrado de sitio (o el ITP de Safari) se lleva todo, y el archivo exportado
 * es lo único que lo devuelve — así que la X no lo apaga, lo pospone, y vuelve
 * al vencer el plazo o al acumularse cambios nuevos.
 */
function BackupReminder() {
  const meta = useMeta();
  if (!meta || !hayQueRecordarBackup(meta)) return null;
  return (
    <div className="banner banner-backup" role="status">
      <span>
        Hace rato que no hacés una copia de tus datos, y ya hay {meta.cambios_desde_backup} cambios sin respaldar.
      </span>
      <a className="boton-chico" href={routeHash({ screen: 'settings' })}>
        Exportar
      </a>
      <button
        type="button"
        className="banner-cerrar"
        aria-label="Recordármelo más adelante"
        onClick={() => void posponerRecordatorioBackup()}
      >
        <IconCerrar />
      </button>
    </div>
  );
}

/**
 * La v3 borró los consumos, y borrar datos de alguien se avisa. `meta` solo
 * escribe `user_schema_version` al crear el registro, así que quien venía de
 * antes lo tiene en 2 y eso alcanza como marca — no hace falta un flag nuevo.
 * Una instalación nueva nace en la versión actual y no ve nada.
 */
function AvisoDeConsumos() {
  const meta = useMeta();
  if (!meta || meta.user_schema_version >= USER_SCHEMA_VERSION) return null;
  return (
    <div className="banner banner-migracion" role="status">
      <span>
        Esta versión dejó de llevar la cuenta de lo que comés: se borraron los registros de porciones comidas y, con
        ellos, las sobras. <strong>Lo que cocinaste, tus notas y tus favoritas están enteros.</strong>
      </span>
      <button type="button" className="banner-cerrar" aria-label="Entendido" onClick={() => void marcarEsquemaVisto()}>
        <IconCerrar />
      </button>
    </div>
  );
}

/**
 * main y staging se instalan como dos PWA en el mismo celular. El nombre del
 * manifest las distingue en la pantalla de inicio; esta banda las distingue una
 * vez adentro, que es donde importa: acá se cocina y se registra de verdad.
 */
function BandaDeStaging() {
  if (import.meta.env.VITE_ENTORNO !== 'staging') return null;
  return (
    <div className="banda-entorno" role="status">
      Estás en <strong>staging</strong>. Los datos que cargues acá no son los de tu app.
    </div>
  );
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
      <BandaDeStaging />
      <Nav route={route} />
      <AvisoDeConsumos />
      <BackupReminder />
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
