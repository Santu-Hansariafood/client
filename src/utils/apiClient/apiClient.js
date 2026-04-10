import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "/api";
const apiBaseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;

const instance = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000,
});

instance.interceptors.request.use((config) => {
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

export default instance;
