import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required!");

export const signUpSchema = z
  .object({
    email: requiredString
      .email("Invalid email address!")
      .regex(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Invalid email format or domain!"
      ),

    username: requiredString
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens."
      )
      .min(3, "Username must be at least 3 characters long.")
      .max(20, "Username must not exceed 20 characters."),

    password: requiredString
      .min(8, "Password must have at least 8 characters.")
      .max(128, "Password cannot exceed 128 characters.")
      .regex(
        /[A-Z]/,
        "Password must contain at least one uppercase letter."
      )
      .regex(
        /[a-z]/,
        "Password must contain at least one lowercase letter."
      )
      .regex(
        /\d/,
        "Password must contain at least one number."
      )
      .regex(
        /[@$!%*?&]/,
        "Password must contain at least one special character (@, $, !, %, *, ?, &)."
      ),

    confirmPassword: requiredString,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match!",
  });

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  username: requiredString.min(3, "Username must be at least 3 characters long."),

  password: requiredString
    .min(8, "Password must have at least 8 characters.")
    .regex(
      /[A-Z]/,
      "Password must contain at least one uppercase letter."
    )
    .regex(
      /[a-z]/,
      "Password must contain at least one lowercase letter."
    )
    .regex(
      /\d/,
      "Password must contain at least one number."
    )
    .regex(
      /[@$!%*?&]/,
      "Password must contain at least one special character (@, $, !, %, *, ?, &)."
    ),
});

export type LoginValues = z.infer<typeof loginSchema>;


export const createPostSchema = z.object({
  content: requiredString.min(1, "Content is required!"),
});