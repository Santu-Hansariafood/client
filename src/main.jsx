import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.jsx';
import Loading from './common/Loading/Loading';

import reportWebVitals from './reportWebVitals';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <HelmetProvider>
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    </HelmetProvider>
  </StrictMode>
);

reportWebVitals(console.log);
