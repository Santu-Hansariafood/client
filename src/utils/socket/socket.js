import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const SOCKET_URL = BASE_URL.startsWith("http")
  ? new URL(BASE_URL).origin
  : window.location.origin;

let socket = null;
let activeSocketKey = null;
let activeNotificationHandler = null;

export const initiateSocket = (token) => {
  if (!token) {
    disconnectSocket();
    return null;
  }

  const socketKey = token;

  if (socket && socket.connected && activeSocketKey === socketKey) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    path: "/api/socket.io",
    transports: ["polling", "websocket"],
    secure: true,
    withCredentials: true,
    auth: {
      token: token,
    },
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
    timeout: 15000,
  });

  activeSocketKey = socketKey;
  activeNotificationHandler = null;

  socket.on("connect", () => {
    // Socket connected successfully.
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.warn("Socket disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = null;
  activeSocketKey = null;
  activeNotificationHandler = null;
};

export const subscribeToNotifications = (cb) => {
  if (!socket) return () => {};

  if (activeNotificationHandler) {
    socket.off("notification", activeNotificationHandler);
  }

  activeNotificationHandler = (msg) => {
    cb(null, msg);
  };

  socket.on("notification", activeNotificationHandler);

  return () => {
    if (socket && activeNotificationHandler) {
      socket.off("notification", activeNotificationHandler);
      activeNotificationHandler = null;
    }
  };
};

export const getSocket = () => socket;
