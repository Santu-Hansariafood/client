import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import App from "./App.jsx";
import Loading from "./common/Loading/Loading";

import reportWebVitals from "./reportWebVitals";
import { registerSW } from "virtual:pwa-register";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "/api";
const apiBaseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;

axios.defaults.baseURL = apiBaseURL;
axios.defaults.timeout = 5000;
axios.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    config.headers["x-api-key"] = apiKey;
  }
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  if (
    typeof config.url === "string" &&
    !config.url.startsWith("http") &&
    !config.url.startsWith("//")
  ) {
    if (config.url.startsWith("/api/")) {
      config.url = config.url.slice(5);
    } else if (config.url.startsWith("/")) {
      config.url = config.url.slice(1);
    }
  }

  return config;
});

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, r) {},
  onNeedRefresh() {},
  onOfflineReady() {},
});

root.render(
  <StrictMode>
    <HelmetProvider>
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    </HelmetProvider>
  </StrictMode>,
);

reportWebVitals(console.log);
