"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sendOTPEmail, generateOTP } from "@/lib/email";

export async function verifyEmail(
    email: string,
    otp: string
): Promise<{ error?: string; success?: boolean }> {
    try {
        const verification = await prisma.emailVerification.findFirst({
            where: {
                email,
                otp,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
        });

        if (!verification) {
            return {
                error: "Invalid or expired verification code.",
            };
        }

        if (!verification.user) {
            return {
                error: "User not found.",
            };
        }

        await prisma.user.update({
            where: { id: verification.userId! },
            data: { emailVerified: true },
        });

        await prisma.emailVerification.deleteMany({
            where: { email },
        });

        const session = await lucia.createSession(verification.user.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        (await cookies()).set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
        );

        return { success: true };
    } catch (error) {
        console.error("Email verification error:", error);
        return {
            error: "Something went wrong. Please try again.",
        };
    }
}

export async function resendVerificationEmail(
    email: string
): Promise<{ error?: string; success?: boolean }> {
    try {
        const user = await prisma.user.findFirst({
            where: {
                email,
                emailVerified: false,
            },
        });

        if (!user) {
            return {
                error: "User not found or already verified.",
            };
        }

        await prisma.emailVerification.deleteMany({
            where: { email },
        });

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.emailVerification.create({
            data: {
                email,
                otp,
                userId: user.id,
                expiresAt,
            },
        });

        const emailResult = await sendOTPEmail(email, otp, user.username);
        if (!emailResult.success) {
            return {
                error: "Failed to send verification email. Please try again.",
            };
        }

        return { success: true };
    } catch (error) {
        console.error("Resend verification error:", error);
        return {
            error: "Something went wrong. Please try again.",
        };
    }
}
