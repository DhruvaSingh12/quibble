import prisma from "@/lib/prisma";
import { UTApi } from "uploadthing/server";
import { NextResponse } from "next/server";

/**
 * Cleanup orphaned media records.
 *
 * Deletes Media entries that were uploaded but never attached to a post
 * (postId is null) and are older than 6 hours. Also deletes the actual
 * files from UploadThing storage.
 *
 * This endpoint should be called by a cron job (e.g., Vercel Cron).
 * To set up, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-media",
 *     "schedule": "0 *\/6 * * *"
 *   }]
 * }
 */

const ORPHAN_THRESHOLD_HOURS = 6;

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const threshold = new Date(
      Date.now() - ORPHAN_THRESHOLD_HOURS * 60 * 60 * 1000,
    );

    // Find orphaned media
    const orphanedMedia = await prisma.media.findMany({
      where: {
        postId: null,
        createdAt: { lt: threshold },
      },
      select: {
        id: true,
        url: true,
      },
    });

    if (orphanedMedia.length === 0) {
      return NextResponse.json({
        message: "No orphaned media found",
        deleted: 0,
      });
    }

    // Extract UploadThing file keys from URLs
    const fileKeys = orphanedMedia
      .map((m) => {
        // URL format: https://utfs.io/f/KEY or https://APPID.ufs.sh/f/KEY
        const parts = m.url.split("/");
        return parts[parts.length - 1];
      })
      .filter(Boolean);

    // Delete from UploadThing storage
    if (fileKeys.length > 0) {
      try {
        const utapi = new UTApi();
        await utapi.deleteFiles(fileKeys);
      } catch (error) {
        console.error("Failed to delete files from UploadThing:", error);
        // Continue with DB cleanup even if UT deletion fails
      }
    }

    // Delete from database
    const result = await prisma.media.deleteMany({
      where: {
        id: { in: orphanedMedia.map((m) => m.id) },
      },
    });

    console.log(
      `[Cleanup] Deleted ${result.count} orphaned media records (threshold: ${ORPHAN_THRESHOLD_HOURS}h)`,
    );

    return NextResponse.json({
      message: `Cleaned up ${result.count} orphaned media records`,
      deleted: result.count,
      threshold: `${ORPHAN_THRESHOLD_HOURS} hours`,
    });
  } catch (error) {
    console.error("[Cleanup] Error:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 },
    );
  }
}
