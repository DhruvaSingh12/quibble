import * as Sentry from "@sentry/node";
import { env } from "../config/env";
import { logger } from "../logging/logger";

export function initSentry() {
  if (!env.SENTRY_DSN) {
    logger.info("Sentry DSN not provided, skipping Sentry initialization");
    return;
  }
  
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
  });
  logger.info("Sentry initialized");
}
