import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../logging/logger";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 500, 5000),
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err: any) => {
  if (err.code === "ECONNREFUSED" || (err.message && err.message.includes("ECONNREFUSED"))) return;
  logger.error({ err }, "Redis error");
});
