// Entry point: global styles, the router, the session, and the app shell.
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import './styles/index.css';
import {SessionProvider} from './lib/api/session';
import {App} from './app/App';
import {PricesProvider} from './lib/prices';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <PricesProvider>
          <App />
        </PricesProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
