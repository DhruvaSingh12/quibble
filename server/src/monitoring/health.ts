import { prisma } from "../config/prisma";
﻿import { Router } from "express";
import { redis } from "../config/redis";

export const healthRouter = Router();

healthRouter.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisPing = await redis.ping();
    if (redisPing !== "PONG") throw new Error("Redis ping failed");

    res.status(200).json({ status: "ok" });
  } catch (error: any) {
    res.status(503).json({ status: "error", message: error.message });
  }
});
