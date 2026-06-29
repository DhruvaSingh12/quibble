import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required!");

export const updateUserProfileSchema = z.object({
  displayName: requiredString.min(5, "Display name is required!"),
  bio: z.string().max(160, "Bio cannot exceed 160 characters."),
  avatarUrl: z.string().url().optional(),
});
