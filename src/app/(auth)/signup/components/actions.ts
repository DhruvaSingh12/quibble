"use server";

import prisma from "@/lib/prisma";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { sendOTPEmail, generateOTP } from "@/lib/email";

export async function signUp(
    credentials: SignUpValues
): Promise<{ error?: string; requiresVerification?: boolean; email?: string }> {
    try {
        const { username, email, password } = signUpSchema.parse(credentials);
        
        // Check for existing username
        const existingUsername = await prisma.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: "insensitive",
                },
            },
        });
        if (existingUsername) {
            return {
                error: "Username already exists.",
            };
        }

        // Check for existing email
        const existingEmail = await prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: "insensitive",
                },
            },
        });
        if (existingEmail) {
            return {
                error: "Email already exists.",
            };
        }

        // Hash password
        const passwordHash = await hash(password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1,
        });

        const userId = generateIdFromEntropySize(10);

        // Create user but mark as unverified
        await prisma.user.create({
            data: {
                id: userId,
                username,
                displayName: username,
                email,
                passwordHash,
                emailVerified: false,
            },
        });

        // Generate and save OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.emailVerification.create({
            data: {
                email,
                otp,
                userId,
                expiresAt,
            },
        });

        // Send verification email
        const emailResult = await sendOTPEmail(email, otp, username);
        if (!emailResult.success) {
            // Clean up the user and verification record if email fails
            await prisma.emailVerification.deleteMany({
                where: { email, userId }
            });
            await prisma.user.delete({
                where: { id: userId }
            });
            return {
                error: "Failed to send verification email. Please try again.",
            };
        }

        return {
            requiresVerification: true,
            email,
        };

    } catch (error) {
        console.error(error);
        return {
            error: "Something went wrong. Please try again.",
        };
    }
}

