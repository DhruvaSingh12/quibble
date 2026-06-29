import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("8080"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32).default("development_secret_do_not_use_in_prod_12345"),
  FRONTEND_URL: z.string().url(),
  SENTRY_DSN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
