import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import { env } from "./config/env";
import { requestLogger } from "./middleware/request-logger";
import { errorHandler } from "./middleware/error-handler";
import { healthRouter } from "./monitoring/health";
import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { postsRouter } from "./modules/posts/posts.routes";
import { socialRouter } from "./modules/social/social.routes";
import { integrationsRouter } from "./modules/integrations/integrations.routes";
import chatRouter from "./modules/chat/chat.routes";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./modules/integrations/uploadthing";

export function buildApp() {
  const app = express();

  // Trust proxy if we are behind a reverse proxy (e.g. Railway, Nginx)
  app.set("trust proxy", 1);

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("192.168") || origin.includes("10.")) {
          callback(null, true);
        } else {
          callback(null, env.FRONTEND_URL);
        }
      },
      credentials: true,
    })
  );

  // Standard Middleware
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Logging
  app.use(requestLogger);

  // Routes
  app.use("/", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/posts", postsRouter);
  app.use("/api/v1", socialRouter);
  app.use("/api/v1/chat", chatRouter);
  app.use("/api/v1", integrationsRouter);
  app.use("/api/uploadthing", createRouteHandler({ router: uploadRouter }));
  
  // API Routes will be mounted here
  // app.use("/api/v1", routes);

  // Error Handler
  app.use(errorHandler);

  return app;
}
