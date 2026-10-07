import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/syne';
import '@fontsource-variable/outfit';
import '@fontsource-variable/oxanium';
import './index.css';
import App from './App.tsx';
import { registerServiceWorker } from './lib/registerSw.ts';

registerServiceWorker();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
