import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required!");

export const signUpSchema = z.object({
  email: requiredString.email("Invalid email address!").regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format or domain!"),
  username: requiredString.regex(/^[a-zA-Z_][a-zA-Z0-9_-]*$/, "Username must start with a letter or underscore, and can only contain letters, numbers, underscores, and hyphens.").min(3, "Username must be at least 3 characters long.").max(20, "Username must not exceed 20 characters."),
  password: requiredString.min(8, "Password must have at least 8 characters.").max(128, "Password cannot exceed 128 characters.").regex(/[A-Z]/, "Password must contain at least one uppercase letter.").regex(/[a-z]/, "Password must contain at least one lowercase letter.").regex(/\d/, "Password must contain at least one number.").regex(/[@$!%*?&]/, "Password must contain at least one special character (@, $, !, %, *, ?, &)."),
  confirmPassword: requiredString,
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match!",
});

export const loginSchema = z.object({
  username: requiredString.min(3, "Username must be at least 3 characters long."),
  password: requiredString.min(8, "Password must have at least 8 characters.").regex(/[A-Z]/, "Password must contain at least one uppercase letter.").regex(/[a-z]/, "Password must contain at least one lowercase letter.").regex(/\d/, "Password must contain at least one number.").regex(/[@$!%*?&]/, "Password must contain at least one special character (@, $, !, %, *, ?, &)."),
});

export const forgotPasswordSchema = z.object({
  email: requiredString.email("Invalid email address!").regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format or domain!"),
});

export const resetPasswordSchema = z.object({
  password: requiredString.min(8, "Password must have at least 8 characters.").max(128, "Password cannot exceed 128 characters.").regex(/[A-Z]/, "Password must contain at least one uppercase letter.").regex(/[a-z]/, "Password must contain at least one lowercase letter.").regex(/\d/, "Password must contain at least one number.").regex(/[@$!%*?&]/, "Password must contain at least one special character (@, $, !, %, *, ?, &)."),
  confirmPassword: requiredString,
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match!",
});
