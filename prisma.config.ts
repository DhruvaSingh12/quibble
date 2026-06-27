import { defineConfig } from "prisma/config";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
