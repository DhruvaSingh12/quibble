import { prisma } from "../config/prisma";
﻿import cron from "node-cron";
import { logger } from "../logging/logger";
import { UTApi } from "uploadthing/server";


// Delete orphaned media (where postId is null and they are older than 24h)
export const initCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    logger.info("Running orphaned media cleanup cron job");

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const orphanedMedia = await prisma.media.findMany({
        where: {
          postId: null,
          createdAt: {
            lte: twentyFourHoursAgo,
          },
        },
        select: {
          id: true,
          url: true,
        },
      });

      if (orphanedMedia.length === 0) {
        logger.info("No orphaned media to cleanup.");
        return;
      }

      const utapi = new UTApi();
      const keys = orphanedMedia.map(m => m.url.split("/f/")[1]).filter(Boolean);
      
      if (keys.length > 0) {
        await utapi.deleteFiles(keys);
      }

      const deletedCount = await prisma.media.deleteMany({
        where: {
          id: {
            in: orphanedMedia.map(m => m.id),
          },
        },
      });

      logger.info(`Successfully deleted ${deletedCount.count} orphaned media files.`);
    } catch (error) {
      logger.error({ error }, "Failed to execute orphaned media cleanup");
    }
  });

  logger.info("Cron jobs initialized");
};

