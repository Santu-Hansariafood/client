import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (server) => {
  const corsOrigin = (process.env.CORS_ORIGIN || "*").trim();
  const corsOrigins =
    corsOrigin && corsOrigin !== "*"
      ? corsOrigin
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : "*";

  io = new Server(server, {
    path: "/api/socket.io/",
    cors: {
      origin: corsOrigins === "*" ? true : corsOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const bearerToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }
      socket.user = decoded;
      next();
    });
  });

  io.on("connection", (socket) => {
    const { mobile, role } = socket.user;

    console.log(
      `User connected: ${mobile} (${role}) - Socket ID: ${socket.id}`,
    );

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
