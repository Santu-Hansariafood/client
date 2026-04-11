import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "../AuthContext/AuthContext";
import { initiateSocket, disconnectSocket, subscribeToNotifications } from "../../utils/socket/socket";
import api from "../../utils/apiClient/apiClient";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { mobile, userRole, isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    if (!isAuthenticated || !mobile) return;
    try {
      const response = await api.get("/notifications", {
        params: {
          mobile,
          role: userRole,
          unreadOnly: unreadOnly ? "true" : "false",
          todayOnly: "false", // Get all for dashboard if needed
        },
      });
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, [mobile, userRole, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && mobile && token) {
      fetchNotifications(false); // Fetch all on initial load

      const socket = initiateSocket(token);

      subscribeToNotifications((err, newNotification) => {
        if (err) return;
        
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show browser notification if permission granted
        if ("Notification" in window && Notification.permission === "granted") {
          new window.Notification(newNotification.title, {
            body: newNotification.message,
            icon: "/logo/logo.png",
          });
        }
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [isAuthenticated, mobile, userRole, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all", { mobile, role: userRole });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const filtered = prev.filter((n) => n._id !== id);
        const wasUnread = prev.find(n => n._id === id && !n.isRead);
        if (wasUnread) setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        return filtered;
      });
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
