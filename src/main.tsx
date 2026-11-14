import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource-variable/inter';
import '@fontsource/gelasio/400.css';
import '@fontsource/gelasio/400-italic.css';
import '@fontsource/gelasio/500.css';
import './styles.css';
import App from './App';

// Hash routing keeps deep links working on any static host, with no server rewrites.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
