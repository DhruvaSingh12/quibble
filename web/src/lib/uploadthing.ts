import { generateReactHelpers } from "@uploadthing/react";
import type { AppFileRouter } from "./uploadRouter";

const isServer = typeof window === 'undefined';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const { useUploadThing, uploadFiles } = generateReactHelpers<AppFileRouter>({
    url: isServer ? `${apiUrl}/api/uploadthing` : `/api/uploadthing`
});

