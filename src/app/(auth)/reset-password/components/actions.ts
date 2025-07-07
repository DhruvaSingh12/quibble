"use server";

import { resetPasswordSchema, ResetPasswordValues } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { hash } from "@node-rs/argon2";

interface ResetPasswordParams extends ResetPasswordValues {
  token: string;
}

export async function resetPassword(
  values: ResetPasswordParams
): Promise<{ error?: string }> {
  try {
    // Validate password
    resetPasswordSchema.parse({
      password: values.password,
      confirmPassword: values.confirmPassword
    });

    // Validate token
    const { token } = values;
    
    // Check if token exists and is not expired
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        token,
        expires: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!passwordReset) {
      return { error: "Invalid or expired reset token" };
    }

    // Hash the new password
    const passwordHash = await hash(values.password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Update the user's password
    await prisma.user.update({
      where: {
        id: passwordReset.userId,
      },
      data: {
        passwordHash,
      },
    });

    // Delete all password reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: {
        userId: passwordReset.userId,
      },
    });

    return {};
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}
