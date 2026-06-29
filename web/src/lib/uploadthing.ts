import { generateReactHelpers } from "@uploadthing/react";
import type { AppFileRouter } from "./uploadRouter";

export const { useUploadThing, uploadFiles } = generateReactHelpers<AppFileRouter>();

