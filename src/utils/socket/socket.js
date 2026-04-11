import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
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
    path: "/api/socket.io/",
    transports: ["polling", "websocket"],
    auth: {
      token: token,
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  console.log("Connecting socket...");

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  console.log("Disconnecting socket...");
  if (socket) socket.disconnect();
};

export const subscribeToNotifications = (cb) => {
  if (!socket) return true;
  socket.on("notification", (msg) => {
    console.log("New notification received via socket");
    return cb(null, msg);
  });
};

export const getSocket = () => socket;
