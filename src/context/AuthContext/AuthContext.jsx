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
  const SESSION_DURATION = 30 * 60 * 1000;

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

  const login = (userData) => {
    setIsAuthenticated(true);
    setMobile(userData.mobile || "");
    setUserRole(userData.role || "");

    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("mobile", userData.mobile || "");
    localStorage.setItem("userRole", userData.role || "");
    localStorage.setItem("sessionTimestamp", Date.now().toString());

    startSessionTimer();
  };

  const logout = () => {
    setIsAuthenticated(false);
    setMobile("");
    setUserRole("");

    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("mobile");
    localStorage.removeItem("userRole");
    localStorage.removeItem("sessionTimestamp");

    clearSessionTimer();
  };

  const startSessionTimer = () => {
    clearSessionTimer();
    sessionTimeoutRef.current = setTimeout(() => {
      logout();
      toast.info("Session expired due to inactivity.", {
        position: "top-center",
        autoClose: 5000,
      });
    }, SESSION_DURATION);
  };

  const clearSessionTimer = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  };

  const handleUserActivity = () => {
    if (isAuthenticated) {
      localStorage.setItem("sessionTimestamp", Date.now().toString());
      startSessionTimer();
    }
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
      login,
      logout,
    }),
    [isAuthenticated, mobile, userRole]
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
