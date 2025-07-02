"use server";

import prisma from "@/lib/prisma";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { sendOTPEmail, generateOTP } from "@/lib/email";

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
    try {
        if (!username || username.length < 3) {
            return { available: false, error: "Username must be at least 3 characters long." };
        }

        if (username.length > 20) {
            return { available: false, error: "Username must not exceed 20 characters." };
        }

        if (/\s/.test(username)) {
            return { available: false, error: "Username must not contain spaces." };
        }

        if (!/^[a-zA-Z_]/.test(username)) {
            return { available: false, error: "Username must start with a letter or underscore." };
        }

        if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(username)) {
            return { available: false, error: "Username can only contain letters, numbers, underscores, and hyphens." };
        }

        const existingUsername = await prisma.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: "insensitive",
                },
            },
        });

        if (existingUsername) {
            return { available: false, error: "Username already exists." };
        }

        return { available: true };
    } catch (error) {
        console.error("Username check error:", error);
        return { available: false, error: "Unable to check username availability." };
    }
}

export async function checkEmailAvailability(email: string): Promise<{ available: boolean; error?: string }> {
    try {
        if (!email || !email.includes("@")) {
            return { available: false, error: "Please enter a valid email address." };
        }

        const existingEmail = await prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: "insensitive",
                },
            },
        });

        if (existingEmail) {
            return { available: false, error: "Email already exists." };
        }

        return { available: true };
    } catch (error) {
        console.error("Email check error:", error);
        return { available: false, error: "Unable to check email availability." };
    }
}

export async function signUp(
    credentials: SignUpValues
): Promise<{ error?: string; requiresVerification?: boolean; email?: string }> {
    try {
        const { username, email, password } = signUpSchema.parse(credentials);
    
        const [usernameCheck, emailCheck] = await Promise.all([
            checkUsernameAvailability(username),
            checkEmailAvailability(email)
        ]);

        if (!usernameCheck.available) {
            return { error: usernameCheck.error || "Username already exists." };
        }

        if (!emailCheck.available) {
            return { error: emailCheck.error || "Email already exists." };
        }

        const passwordHash = await hash(password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1,
        });

        const userId = generateIdFromEntropySize(10);

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

        const emailResult = await sendOTPEmail(email, otp, username);
        if (!emailResult.success) {
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

