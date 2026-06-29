import { buildApp } from "./app";
import { env } from "./config/env";
import { logger } from "./logging/logger";
import { initSentry } from "./monitoring/sentry";
import { initEventHandlers } from "./events/event-bus";
import { Server } from "http";
import { initSocket } from "./socket";
import { initCronJobs } from "./jobs/cron";

async function start() {
  initSentry();
  initEventHandlers();
  const app = buildApp();
  
  const server = new Server(app);

  initSocket(server);
  initCronJobs();

  server.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      logger.info("Closed out remaining connections.");
      process.exit(0);
    });
    
    setTimeout(() => {
      logger.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});
