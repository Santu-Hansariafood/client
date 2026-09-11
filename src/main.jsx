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
axios.defaults.timeout = 30000;
axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    config.headers["x-api-key"] = apiKey;
  }

  if (config.headers && config.withCredentials !== false) {
    config.withCredentials = true;
  }

  if (config.headers && config.headers.Authorization) {
    delete config.headers.Authorization;
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

const handleLogout = () => {
  ["isAuthenticated", "mobile", "userRole", "token", "user", "loginDate"].forEach((key) => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore storage issues
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore storage issues
    }
  });
  window.location.href = "/login";
};

const authExemptPaths = [
  "/admin/login",
  "/employees/login",
  "/transporters/login",
  "/buyers/login",
  "/sellers/login",
  "/auth/refresh-token",
  "/auth/logout",
];

let refreshPromise = null;

const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post("auth/refresh-token", null, { skipAuthRefresh: true })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestConfig = error.config;
    const requestUrl = String(requestConfig?.url || "");
    const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true" || localStorage.getItem("isAuthenticated") === "true";
    const isAuthRequest = authExemptPaths.some((path) => requestUrl.includes(path));

    if (error.response?.status === 401 && isAuthenticated && !isAuthRequest && !requestConfig?.skipAuthRefresh) {
      if (!requestConfig?._authRetry) {
        requestConfig._authRetry = true;
        return refreshSession()
          .then(() => axios(requestConfig))
          .catch((refreshError) => {
            handleLogout();
            return Promise.reject(refreshError);
          });
      }

      handleLogout();
    }
    return Promise.reject(error);
  }
);

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
