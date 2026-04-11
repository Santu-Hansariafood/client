import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import "react-toastify/dist/ReactToastify.css";

const AuthContext = createContext();

const getTodayKey = () => {
  try {
    return new Date().toLocaleDateString("en-CA");
  } catch {
    return "";
  }
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("isAuthenticated"));
      const loginDate = localStorage.getItem("loginDate");
      const today = getTodayKey();
      if (stored && loginDate === today) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  const [mobile, setMobile] = useState(() => {
    return localStorage.getItem("mobile") || "";
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("userRole") || "";
  });

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const sessionTimeoutRef = useRef(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  const login = (userData) => {
    const role = userData.role || "";
    const mobileValue = userData.mobile || "";
    const userValue = userData.user || userData;
    const tokenValue = userData.token || "";

    setIsAuthenticated(true);
    setMobile(mobileValue);
    setUserRole(role);
    setUser(userValue);
    if (tokenValue) {
      setToken(tokenValue);
    }

    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("mobile", mobileValue);
    localStorage.setItem("userRole", role);
    localStorage.setItem("user", JSON.stringify(userValue));
    localStorage.setItem("loginDate", getTodayKey());
    if (tokenValue) {
      localStorage.setItem("token", tokenValue);
    }

    startSessionTimer(true);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setMobile("");
    setUserRole("");
    setToken("");
    setUser(null);

    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("mobile");
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loginDate");

    clearSessionTimer();
  };

  const startSessionTimer = (force = false) => {
    clearSessionTimer();
    if (!isAuthenticated && !force) {
      return;
    }
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    if (msUntilMidnight <= 0) {
      return;
    }
    sessionTimeoutRef.current = setTimeout(() => {
      logout();
    }, msUntilMidnight);
  };

  const clearSessionTimer = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  };

  const handleUserActivity = () => {};

  const synchronizeAuthState = (event) => {
    if (event.key === "isAuthenticated") {
      const newState = JSON.parse(event.newValue);
      setIsAuthenticated(newState);
      newState ? startSessionTimer() : clearSessionTimer();
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
    const activityEvents = ["mousemove", "keypress", "click"];
    activityEvents.forEach((event) =>
      window.addEventListener(event, handleUserActivity),
    );
    window.addEventListener("storage", synchronizeAuthState);

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, handleUserActivity),
      );
      window.removeEventListener("storage", synchronizeAuthState);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      startSessionTimer();
    } else {
      clearSessionTimer();
    }
  }, [isAuthenticated]);

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
