import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "/api";
const apiBaseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

const getCacheKey = (config) => {
  const { method, url, params } = config;
  return `${method?.toUpperCase()}:${url}:${JSON.stringify(params || {})}`;
};

const instance = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
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

  // Check cache for GET requests
  if (config.method?.toUpperCase() === "GET") {
    const key = getCacheKey(config);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Promise.reject({
        isCached: true,
        cachedData: cached.data,
        config,
      });
    }
  }

  return config;
});

instance.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (
      response.config?.method?.toUpperCase() === "GET" &&
      !response.config?.skipCache
    ) {
      const key = getCacheKey(response.config);
      cache.set(key, {
        data: response,
        timestamp: Date.now(),
      });
    }
    return response;
  },
  (error) => {
    // Return cached data if we intercepted a cache hit
    if (error.isCached) {
      return Promise.resolve(error.cachedData);
    }
    return Promise.reject(error);
  }
);

// Helper to clear cache (useful after mutations)
export const clearApiCache = () => {
  cache.clear();
};

export default instance;
