import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import "react-toastify/dist/ReactToastify.css";

const getPrimaryStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getSecondaryStorage = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const readPersistedValue = (key, fallback = null) => {
  const primary = getPrimaryStorage();
  const primaryValue = primary?.getItem(key);
  if (primaryValue !== null && primaryValue !== undefined) {
    return primaryValue;
  }

  const secondary = getSecondaryStorage();
  try {
    const sessionValue = secondary?.getItem(key);
    if (sessionValue !== null && sessionValue !== undefined) {
      return sessionValue;
    }
  } catch {
    // ignore
  }

  return fallback;
};

const writePersistedValue = (key, value) => {
  const primary = getPrimaryStorage();
  try {
    if (primary) {
      if (value === null || value === undefined) {
        primary.removeItem(key);
      } else {
        primary.setItem(key, value);
      }
    }
  } catch {
    // ignore storage issues
  }

  const secondary = getSecondaryStorage();
  try {
    if (secondary) {
      if (value === null || value === undefined) {
        secondary.removeItem(key);
      } else {
        secondary.setItem(key, value);
      }
    }
  } catch {
    // ignore storage issues
  }
};

const removePersistedValue = (key) => {
  const primary = getPrimaryStorage();
  try {
    if (primary) {
      primary.removeItem(key);
    }
  } catch {
    // ignore
  }

  const secondary = getSecondaryStorage();
  try {
    if (secondary) {
      secondary.removeItem(key);
    }
  } catch {
    // ignore
  }
};

const getTokenExpiry = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Number.isFinite(payload.exp) ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const expiresAt = getTokenExpiry(token);
  return expiresAt === null || Date.now() >= expiresAt;
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const stored = JSON.parse(readPersistedValue("isAuthenticated", "false"));
      return Boolean(stored);
    } catch {
      return false;
    }
  });

  const [mobile, setMobile] = useState(() => {
    return readPersistedValue("mobile", "") || "";
  });

  const [userRole, setUserRole] = useState(() => {
    return readPersistedValue("userRole", "") || "";
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = readPersistedValue("user", "");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role === "Employee" && !parsed.allowedPermissions) {
          parsed.allowedPermissions = [];
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const stored = readPersistedValue("token", "");
    return stored || "";
  });

  const [refreshToken, setRefreshToken] = useState(() => {
    const stored = readPersistedValue("refreshToken", "");
    return stored || "";
  });

  const [sessionLoaded, setSessionLoaded] = useState(false);

  const login = useCallback((userData) => {
    const role = userData.role || "";
    const mobileValue = userData.mobile || "";
    const userValue = userData.user || userData;
    const tokenValue = userData.token || "";
    const refreshValue = userData.refreshToken || "";
    const allowedPermissions =
      userData.allowedPermissions || userData.user?.allowedPermissions || [];

    setIsAuthenticated(true);
    setMobile(mobileValue);
    setUserRole(role);
    setUser({ ...userValue, allowedPermissions });
    if (tokenValue) {
      setToken(tokenValue);
      writePersistedValue("token", tokenValue);
    }
    if (refreshValue) {
      setRefreshToken(refreshValue);
      writePersistedValue("refreshToken", refreshValue);
    }
    writePersistedValue("loginDate", new Date().toISOString());

    writePersistedValue("isAuthenticated", "true");
    writePersistedValue("mobile", mobileValue);
    writePersistedValue("userRole", role);
    writePersistedValue("user", JSON.stringify({ ...userValue, allowedPermissions }));

    return true;
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      writePersistedValue("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateTokens = useCallback(({ token: newToken, refreshToken: newRefresh }) => {
    if (newToken) {
      setToken(newToken);
      writePersistedValue("token", newToken);
    }
    if (newRefresh) {
      setRefreshToken(newRefresh);
      writePersistedValue("refreshToken", newRefresh);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setMobile("");
    setUserRole("");
    setToken("");
    setRefreshToken("");
    setUser(null);

    [
      "isAuthenticated",
      "mobile",
      "userRole",
      "token",
      "refreshToken",
      "user",
      "loginDate",
    ].forEach((key) => removePersistedValue(key));
  }, []);

  const validateSession = useCallback(() => {
    const persistedAuth = readPersistedValue("isAuthenticated", "false");
    if (
      persistedAuth === "true" &&
      isTokenExpired(readPersistedValue("token", ""))
    ) {
      logout();
    }
    setSessionLoaded(true);
  }, [logout]);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const storedToken = token || readPersistedValue("token", "");
    const expiresAt = getTokenExpiry(storedToken);
    const expireSession = () => logout();
    if (expiresAt === null || Date.now() >= expiresAt) {
      expireSession();
      return undefined;
    }

    const timeoutId = window.setTimeout(
      expireSession,
      expiresAt - Date.now(),
    );
    const checkExpiry = () => {
      if (Date.now() >= expiresAt) expireSession();
    };
    window.addEventListener("focus", checkExpiry);
    document.addEventListener("visibilitychange", checkExpiry);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("focus", checkExpiry);
      document.removeEventListener("visibilitychange", checkExpiry);
    };
  }, [isAuthenticated, token, logout]);

  const synchronizeAuthState = useCallback((event) => {
    if (event.key === "isAuthenticated") {
      const newState = JSON.parse(event.newValue || "false");
      setIsAuthenticated(Boolean(newState));
    }
    if (event.key === "mobile") {
      setMobile(event.newValue || "");
    }
    if (event.key === "userRole") {
      setUserRole(event.newValue || "");
    }
    if (event.key === "user") {
      try {
        setUser(JSON.parse(event.newValue) || null);
      } catch {
        setUser(null);
      }
    }
    if (event.key === "token") {
      setToken(event.newValue || "");
    }
    if (event.key === "refreshToken") {
      setRefreshToken(event.newValue || "");
    }
  }, []);

  useEffect(() => {
    const handler = synchronizeAuthState;
    window.addEventListener("storage", synchronizeAuthState);

    return () => {
      window.removeEventListener("storage", synchronizeAuthState);
    };
  }, [synchronizeAuthState]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      mobile,
      userRole,
      user,
      token,
      refreshToken,
      sessionLoaded,
      login,
      logout,
      updateTokens,
      updateUser,
      validateSession,
    }),
    [
      isAuthenticated,
      mobile,
      userRole,
      user,
      token,
      refreshToken,
      sessionLoaded,
      login,
      logout,
      updateTokens,
      updateUser,
      validateSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
