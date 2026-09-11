import { createContext, useContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import "react-toastify/dist/ReactToastify.css";

const getSafeStorage = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const readPersistedValue = (key, fallback = null) => {
  const storage = getSafeStorage();
  const sessionValue = storage?.getItem(key);
  if (sessionValue !== null) return sessionValue;

  try {
    const legacyValue = localStorage.getItem(key);
    if (legacyValue !== null) return legacyValue;
  } catch {
    // ignore legacy storage issues
  }

  return fallback;
};

const writePersistedValue = (key, value) => {
  if (key === "token") return;

  const storage = getSafeStorage();
  try {
    if (storage) {
      storage.setItem(key, value);
    }
  } catch {
    // ignore storage issues
  }

  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore legacy storage issues
  }
};

const removePersistedValue = (key) => {
  const storage = getSafeStorage();
  try {
    if (storage) {
      storage.removeItem(key);
    }
  } catch {
    // ignore storage issues
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // ignore legacy storage issues
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const stored = JSON.parse(readPersistedValue("isAuthenticated", "false"));
      const token = readPersistedValue("token", "");
      if (stored && !isTokenExpired(token)) {
        return true;
      }
      if (stored) {
        ["isAuthenticated", "mobile", "userRole", "token", "user", "loginDate"].forEach((key) => removePersistedValue(key));
      }
      return false;
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
      const token = readPersistedValue("token", "");
      if (stored && !isTokenExpired(token)) {
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
    if (isTokenExpired(stored)) {
      return "";
    }
    return stored || "";
  });

  const login = (userData) => {
    const role = userData.role || "";
    const mobileValue = userData.mobile || "";
    const userValue = userData.user || userData;
    const tokenValue = userData.token || "";
    const allowedPermissions = userData.allowedPermissions || userData.user?.allowedPermissions || [];

    setIsAuthenticated(true);
    setMobile(mobileValue);
    setUserRole(role);
    setUser({ ...userValue, allowedPermissions });
    if (tokenValue) {
      setToken(tokenValue);
    }

    writePersistedValue("isAuthenticated", "true");
    writePersistedValue("mobile", mobileValue);
    writePersistedValue("userRole", role);
    writePersistedValue("user", JSON.stringify({ ...userValue, allowedPermissions }));

    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setMobile("");
    setUserRole("");
    setToken("");
    setUser(null);

    ["isAuthenticated", "mobile", "userRole", "token", "user", "loginDate"].forEach((key) => removePersistedValue(key));
  };

  const synchronizeAuthState = (event) => {
    if (event.key === "isAuthenticated") {
      const newState = JSON.parse(event.newValue);
      setIsAuthenticated(newState);
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
  };

  useEffect(() => {
    window.addEventListener("storage", synchronizeAuthState);

    return () => {
      window.removeEventListener("storage", synchronizeAuthState);
    };
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      mobile,
      userRole,
      user,
      token,
      login,
      logout,
    }),
    [isAuthenticated, mobile, userRole, user, token],
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
