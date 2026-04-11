import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (server) => {
  const corsOrigin = (process.env.CORS_ORIGIN || "*").trim();
  const corsOrigins =
    corsOrigin && corsOrigin !== "*"
      ? corsOrigin.split(",").map((s) => s.trim()).filter(Boolean)
      : "*";

  io = new Server(server, {
    cors: {
      origin: corsOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const bearerToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    try {
      const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { mobile, role } = socket.user;
    
    console.log(`User connected: ${mobile} (${role}) - Socket ID: ${socket.id}`);

    // Automatically join rooms based on authenticated user data
    if (mobile) {
      socket.join(mobile);
      console.log(`Socket ${socket.id} joined room: ${mobile}`);
    }
    
    if (role) {
      socket.join(role);
      console.log(`Socket ${socket.id} joined role room: ${role}`);
    }
    
    // Join general 'all' room
    socket.join("all");

    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${mobile} - Reason: ${reason}`);
    });

    socket.on("error", (error) => {
      console.error(`Socket error for user ${mobile}:`, error);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const emitNotification = (notification) => {
  if (!io) return;

  const { recipient, recipientRole } = notification;

  if (recipient === "all") {
    // Send to everyone in the role room
    io.to(recipientRole).emit("notification", notification);
  } else {
    // Send to specific user room
    io.to(recipient).emit("notification", notification);
  }
};
