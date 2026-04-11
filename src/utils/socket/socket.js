import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_URL = BASE_URL.replace(/\/api$/, "");

let socket;

export const initiateSocket = (token) => {
  if (!token) {
    console.error("No token provided for socket connection");
    return null;
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: {
      token: token,
    },
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
