import { createContext, useContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import "react-toastify/dist/ReactToastify.css";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("isAuthenticated"));
      if (stored) {
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
    if (tokenValue) {
      localStorage.setItem("token", tokenValue);
    }

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
