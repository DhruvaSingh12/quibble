import { z } from "zod";
import { loginSchema, signUpSchema, createPostSchema, updateUserProfileSchema } from "../validation";

export type LoginDTO = z.infer<typeof loginSchema>;
export type SignUpDTO = z.infer<typeof signUpSchema>;
export type CreatePostDTO = z.infer<typeof createPostSchema>;
export type UpdateProfileDTO = z.infer<typeof updateUserProfileSchema>;

export interface UserDTO {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface NotificationDTO {
  id: string;
  type: string;
  actor: UserDTO;
  createdAt: Date;
  read: boolean;
  link?: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
}
