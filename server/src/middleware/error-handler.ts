import { ErrorRequestHandler } from "express";
import { logger } from "../logging/logger";
import { ZodError } from "zod";
import * as Sentry from "@sentry/node";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  Sentry.captureException(err);
  logger.error({ err, req: { method: req.method, url: req.url } }, "Unhandled error");

  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: err.issues });
    return;
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
