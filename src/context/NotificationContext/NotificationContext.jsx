import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "../AuthContext/AuthContext";
import {
  initiateSocket,
  disconnectSocket,
  subscribeToNotifications,
} from "../../utils/socket/socket";
import api from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { mobile, userRole, isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(
    async (unreadOnly = false) => {
      if (!isAuthenticated || !mobile) return;
      try {
        const response = await api.get("/notifications", {
          params: {
            mobile,
            role: userRole,
            unreadOnly: unreadOnly ? "true" : "false",
            todayOnly: "false",
          },
        });
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n) => !n.isRead).length);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    },
    [mobile, userRole, isAuthenticated],
  );

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && mobile && token) {
      fetchNotifications(false);

      const socket = initiateSocket(token);

      const playNotificationSound = () => {
        try {
          const audio = new Audio(
            "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
          );
          audio.volume = 0.5;
          audio
            .play()
            .catch((e) => console.warn("Audio play blocked by browser:", e));
        } catch (error) {
          console.error("Failed to play notification sound:", error);
        }
      };

      const flashTabTitle = (title) => {
        const originalTitle = document.title;
        let isFlash = false;
        const interval = setInterval(() => {
          document.title = isFlash ? `🔔 ${title}` : originalTitle;
          isFlash = !isFlash;
        }, 1000);

        const stopFlash = () => {
          clearInterval(interval);
          document.title = originalTitle;
          window.removeEventListener("focus", stopFlash);
          window.removeEventListener("click", stopFlash);
        };

        window.addEventListener("focus", stopFlash);
        window.addEventListener("click", stopFlash);
        setTimeout(stopFlash, 10000);
      };

      subscribeToNotifications((err, newNotification) => {
        if (err) return;

        setNotifications((prev) => {
          const exists = prev.some((n) => n._id === newNotification._id);
          if (exists) return prev;
          return [newNotification, ...prev];
        });

        setUnreadCount((prev) => prev + 1);

        playNotificationSound();

        flashTabTitle(newNotification.title);

        if ("vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }

        if ("Notification" in window && Notification.permission === "granted") {
          const notification = new window.Notification(newNotification.title, {
            body: newNotification.message,
            icon: "/logo/logo.png",
            badge: "/logo/logo.png",
            vibrate: [200, 100, 200],
            tag: newNotification._id,
            renotify: true,
          });

          notification.onclick = () => {
            window.focus();
            markAsRead(newNotification._id);
            notification.close();
          };
        }

        toast.info(
          <div className="flex items-center gap-4 py-1">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full animate-pulse" />
              <img
                src="/logo/logo.png"
                alt="Logo"
                className="w-12 h-12 rounded-2xl shadow-lg border-2 border-white/50 relative z-10"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="font-bold text-sm text-slate-800 tracking-tight leading-tight">
                {newNotification.title}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {newNotification.message}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded">
                  New Message
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
            </div>
          </div>,
          {
            toastId: newNotification._id,
            onClick: () => markAsRead(newNotification._id),
            className: "premium-toast-container",
            bodyClassName: "premium-toast-body",
            progressClassName: "premium-toast-progress",
            icon: false,
          },
        );
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [isAuthenticated, mobile, userRole, fetchNotifications, token]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
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
        const wasUnread = prev.find((n) => n._id === id && !n.isRead);
        if (wasUnread)
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
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
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};
