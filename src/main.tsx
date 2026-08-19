import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/schibsted-grotesk';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';
import './styles/screens.css';
import './styles/tema-d.css';
import { App } from './app/App';

// TEMPORAL (Fase 1): permite ver la propuesta D con ?tema=d y volver con ?tema=c.
// La elección queda guardada para poder alternar sin reescribir la URL.
// Se elimina junto con tema-d.css cuando Facu decida entre C y D.
const temaPedido = new URLSearchParams(location.search).get('tema');
if (temaPedido) localStorage.setItem('tema', temaPedido);
const tema = temaPedido ?? localStorage.getItem('tema');
if (tema === 'd') document.documentElement.dataset.tema = 'd';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
