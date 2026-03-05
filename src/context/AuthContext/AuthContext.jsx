import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("isAuthenticated")) || false;
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

  const sessionTimeoutRef = useRef(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  const login = (userData) => {
    setIsAuthenticated(true);
    setMobile(userData.mobile || "");
    setUserRole(userData.role || "");
    if (userData.token) {
      setToken(userData.token);
    }

    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("mobile", userData.mobile || "");
    localStorage.setItem("userRole", userData.role || "");
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }
    // No auto logout; keep the session persistent
  };

  const logout = () => {
    setIsAuthenticated(false);
    setMobile("");
    setUserRole("");
    setToken("");

    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("mobile");
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");

    clearSessionTimer();
  };

  const startSessionTimer = () => {};

  const clearSessionTimer = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  };

  const handleUserActivity = () => {
    // No session timeout; keep user logged in
  };

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
  };

  useEffect(() => {
    const activityEvents = ["mousemove", "keypress", "click"];
    activityEvents.forEach((event) =>
      window.addEventListener(event, handleUserActivity)
    );
    window.addEventListener("storage", synchronizeAuthState);

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, handleUserActivity)
      );
      window.removeEventListener("storage", synchronizeAuthState);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    // No-op; persistence handled via localStorage token
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      mobile,
      userRole,
      token,
      login,
      logout,
    }),
    [isAuthenticated, mobile, userRole, token]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ToastContainer />
    </AuthContext.Provider>
  );
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
