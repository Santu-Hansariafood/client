import axios from "axios";

const normalizeApiBaseUrl = (raw) => {
  if (!raw) return raw;
  const trimmed = String(raw).replace(/\/+$/, "");
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
};

const instance = axios.create({
  baseURL:
    normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL) ||
    (import.meta.env.DEV ? "/api" : "/api"),
  timeout: 15000
});

instance.interceptors.request.use((config) => {
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

export default instance;
