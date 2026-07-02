import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { redis } from "../config/redis";
import { logger } from "../logging/logger";
import { parseAuthCookies } from "../middleware/authenticate";
import { registerChatHandlers } from "./chatHandlers";

export let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();

  // Prevent unhandled error crashes if Redis is down
  pubClient.on("error", () => { });
  subClient.on("error", () => { });

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("192.168") || origin.includes("10.")) {
          callback(null, true);
        } else {
          const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : "http://localhost:3000";
          if (origin === frontendUrl) {
            callback(null, origin);
          } else {
            callback(null, frontendUrl);
          }
        }
      },
      credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
  });

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      const token = socket.handshake.auth?.token;
      
      if (!cookieHeader && !token) return next(new Error("Unauthorized"));

      const reqMock = { headers: { cookie: cookieHeader, authorization: token ? `Bearer ${token}` : undefined } };
      const { user } = await parseAuthCookies(reqMock as any);

      if (!user) return next(new Error("Unauthorized"));

      socket.data.user = user;
      next();
    } catch (e) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    logger.info(`User ${user.id} connected via WebSocket`);

    // Join personal room for targeted events (like notifications)
    socket.join(`user:${user.id}`);

    // Register handlers
    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      logger.info(`User ${user.id} disconnected`);
    });
  });

  return io;
};

