import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string(),
  attachments: z.array(z.object({
    url: z.string().url(),
    type: z.enum(["IMAGE", "VIDEO"]),
    mimeType: z.string().optional()
  })).max(5, "You can only attach up to 5 files.").optional(),
}).refine(
  (data) => data.content.trim().length > 0 || (data.attachments && data.attachments.length > 0),
  { message: "Post must have text or media.", path: ["content"] }
);
