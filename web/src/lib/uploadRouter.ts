import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  avatar: f({ image: { maxFileSize: "512KB" } }).onUploadComplete(() => {}),
  attachment: f({ image: { maxFileSize: "4MB", maxFileCount: 5 }, video: { maxFileSize: "64MB", maxFileCount: 5 }, audio: { maxFileSize: "16MB", maxFileCount: 2 } }).onUploadComplete(() => {}),
} satisfies FileRouter;

export type AppFileRouter = typeof uploadRouter;
