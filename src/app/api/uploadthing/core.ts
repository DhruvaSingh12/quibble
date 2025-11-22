import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { createUploadthing, FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

const f = createUploadthing();

export const fileRouter = {
  avatar: f({
    image: { maxFileSize: "1MB" },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");

      return { user };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.user.id);
      console.log("File url:", file.ufsUrl);

      try {
        const oldAvatarUrl = metadata.user.avatarUrl;

        if (oldAvatarUrl) {
          const key = oldAvatarUrl.split("/").pop();

          if (key) {
            console.log("Attempting to delete old avatar with key:", key);
            await new UTApi().deleteFiles(key);
            console.log("Old avatar deleted");
          }
        }

        const newAvatarUrl = file.ufsUrl;

        await prisma.user.update({
          where: { id: metadata.user.id },
          data: {
            avatarUrl: newAvatarUrl,
          },
        });

        console.log("Database updated with new avatar URL");

        return { avatarUrl: newAvatarUrl };
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
        throw error;
      }
    }),

  attachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "64MB", maxFileCount: 2 },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      const media = await prisma.media.create({
        data: {
          url: file.ufsUrl,
          type: file.type.startsWith("image/") ? "IMAGE" : "VIDEO",
        },
      });

      return { mediaId: media.id };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;