import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import {
  getAuthUserFromTokenPayload,
  isTokenIssuedBeforePasswordChange,
} from "../utils/authSession.js";
import { getConfiguredCorsOrigins } from "../utils/corsOrigins.js";

let io;

export const initSocket = (server) => {
  const corsOrigins = getConfiguredCorsOrigins();

  io = new Server(server, {
    path: "/api/socket.io",
    cors: {
      origin: (origin, callback) =>
        callback(null, !origin || corsOrigins.has(origin)),
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 20000,
    pingInterval: 25000,
  });
  
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const bearerToken = token.startsWith("Bearer ") ? token.slice(7) : token;
      const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
      const authUser = await getAuthUserFromTokenPayload(decoded);

      if (!authUser) {
        return next(new Error("Authentication error: User not found"));
      }

      if (isTokenIssuedBeforePasswordChange(decoded, authUser)) {
        return next(new Error("Authentication error: Session expired"));
      }

      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { mobile, role } = socket.user;

    if (role) {
      socket.join(role);
    }

    if (mobile) {
      socket.join(`user:${mobile}`);
    }

    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${mobile} - ${reason}`);
    });

    socket.on("error", (error) => {
      console.error(`Socket error for ${mobile}:`, error);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

export const emitNotification = (notification) => {
  if (!io) return;

  const { recipient, recipientRole } = notification;

  if (recipient === "all") {
    io.to(recipientRole).emit("notification", notification);
  } else {
    io.to(`user:${recipient}`).emit("notification", notification);
  }
};
