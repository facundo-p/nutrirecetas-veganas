import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/petrona';
import '@fontsource-variable/archivo';
import './styles/index.css';
import { App } from './app/App';
import { aplicarTema } from './app/tema';

aplicarTema();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
