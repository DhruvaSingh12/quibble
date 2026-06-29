import { UploadThingError } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/express";
import { parseAuthCookies } from "../../middleware/authenticate";
import { Request } from "express";

const f = createUploadthing();

export const uploadRouter = {
  avatar: f({ image: { maxFileSize: "512KB" } })
    .middleware(async ({ req }) => {
      const expressReq = req as unknown as Request;
      const { user } = await parseAuthCookies(expressReq);
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
  attachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "64MB", maxFileCount: 5 },
    audio: { maxFileSize: "16MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const expressReq = req as unknown as Request;
      const { user } = await parseAuthCookies(expressReq);
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;