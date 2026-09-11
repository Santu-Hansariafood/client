import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "/api";
const apiBaseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map();
const inFlightRequests = new Map();
const AUTH_EXEMPT_PATHS = [
  "/admin/login",
  "/employees/login",
  "/transporters/login",
  "/buyers/login",
  "/sellers/login",
  "/forgot-password",
  "/verify-otp",
  "/change-password-otp",
  "/reset-password",
  "/auth/refresh-token",
  "/auth/logout",
];

let refreshPromise = null;

const clearStoredAuth = () => {
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
};

const shouldHandleUnauthorized = (error) => {
  if (error.response?.status !== 401) {
    return false;
  }

  const isAuthenticated = (() => {
    try {
      return sessionStorage.getItem("isAuthenticated") === "true" || localStorage.getItem("isAuthenticated") === "true";
    } catch {
      return false;
    }
  })();

  if (!isAuthenticated) {
    return false;
  }

  const requestUrl = String(error.config?.url || "");
  return !AUTH_EXEMPT_PATHS.some((path) => requestUrl.includes(path));
};

const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = instance
      .post("/auth/refresh-token", null, { skipAuthRefresh: true })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const createPendingRequest = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const getCacheKey = (config) => {
  const { method, url, params } = config;
  return `${method?.toUpperCase()}:${url}:${JSON.stringify(params || {})}`;
};

const getRequestKey = (config) => {
  const { method, url, params, data } = config;
  return `${method?.toUpperCase()}:${url}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`;
};

const instance = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
  withCredentials: true,
});

instance.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    config.headers["x-api-key"] = apiKey;
  }

  config.withCredentials = true;
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

    const inFlightKey = getRequestKey(config);
    const pending = inFlightRequests.get(inFlightKey);
    if (pending) {
      return Promise.reject({
        isDuplicateRequest: true,
        duplicatePromise: pending.promise,
        config,
      });
    }

    const pendingRequest = createPendingRequest();
    inFlightRequests.set(inFlightKey, pendingRequest);
  }

  return config;
});

instance.interceptors.response.use(
  (response) => {
    if (response.config?.method?.toUpperCase() === "GET") {
      const requestKey = getRequestKey(response.config);
      const pendingRequest = inFlightRequests.get(requestKey);
      if (pendingRequest) {
        pendingRequest.resolve(response);
        inFlightRequests.delete(requestKey);
      }

      if (!response.config?.skipCache) {
        const key = getCacheKey(response.config);
        cache.set(key, {
          data: response,
          timestamp: Date.now(),
        });
      }
    }

    return response;
  },
  (error) => {
    if (error.isCached) {
      return Promise.resolve(error.cachedData);
    }

    if (error.isDuplicateRequest && error.duplicatePromise) {
      return error.duplicatePromise;
    }

    if (error.config?.method?.toUpperCase() === "GET") {
      const requestKey = getRequestKey(error.config);
      const pendingRequest = inFlightRequests.get(requestKey);
      if (pendingRequest) {
        pendingRequest.reject(error);
        inFlightRequests.delete(requestKey);
      }
    }

    if (shouldHandleUnauthorized(error) && !error.config?.skipAuthRefresh) {
      const requestConfig = error.config;

      if (!requestConfig?._authRetry) {
        requestConfig._authRetry = true;
        return refreshSession()
          .then(() => instance(requestConfig))
          .catch((refreshError) => {
            clearStoredAuth();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(refreshError);
          });
      }

      clearStoredAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const clearApiCache = () => {
  cache.clear();
};

export default instance;
