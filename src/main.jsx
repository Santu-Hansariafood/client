import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import './index.css';
import App from './App.jsx';
import Loading from './common/Loading/Loading';

import reportWebVitals from './reportWebVitals';
import { registerSW } from 'virtual:pwa-register';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || "/api";
axios.defaults.timeout = 15000;
axios.interceptors.request.use((config) => {
  if (typeof config.url === "string" && config.url.startsWith("/") && !config.url.startsWith("//")) {
    config.url = config.url.startsWith("/api/") ? config.url.slice(5) : config.url.slice(1);
  }
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    config.headers["x-api-key"] = apiKey;
  }
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, r) {
    // no-op
  },
  onNeedRefresh() {},
  onOfflineReady() {}
});

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
