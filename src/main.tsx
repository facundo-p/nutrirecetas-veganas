import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/schibsted-grotesk';
import './styles/tokens.css';
import './styles/temas.css';
import './styles/base.css';
import './styles/app.css';
import './styles/screens.css';
import { App } from './app/App';
import { aplicarTema } from './app/tema';

aplicarTema();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
