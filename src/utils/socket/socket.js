import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const SOCKET_URL = BASE_URL.startsWith("http")
  ? new URL(BASE_URL).origin
  : window.location.origin;

let socket;

export const initiateSocket = (token) => {
  if (!token) {
    console.error("No token provided for socket connection");
    return null;
  }

  socket = io(SOCKET_URL, {
    path: "/api/socket.io",
    transports: ["websocket", "polling"],
    auth: {
      token: token,
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  console.log("Connecting socket...");

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
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
  console.log("Disconnecting socket...");
  if (socket) socket.disconnect();
};

export const subscribeToNotifications = (cb) => {
  if (!socket) return;

  socket.off("notification");

  socket.on("notification", (msg) => {
    console.log("New notification received via socket");
    cb(null, msg);
  });
};

export const getSocket = () => socket;
