"use server";

import { forgotPasswordSchema, ForgotPasswordValues } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { nanoid } from "nanoid";

export async function requestPasswordReset(
  values: ForgotPasswordValues
): Promise<{ error?: string }> {
  try {
    // Validate input
    const { email } = forgotPasswordSchema.parse(values);

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    // Whether the user exists or not, we return the same message
    // This is a security measure to prevent email enumeration attacks
    if (!user) {
      // We don't want to leak if an email exists in our database
      // Wait a bit to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {}; // Return success even if user not found
    }

    // Generate a token
    const token = nanoid(32);
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    // Store the reset token in the database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    // Send email with reset link
    await sendPasswordResetEmail(user.email!, token, user.username);

    return {};
  } catch (error) {
    console.error("Password reset request error:", error);
    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}
