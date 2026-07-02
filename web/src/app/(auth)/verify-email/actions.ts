"use server";

import kyInstance from "@/lib/ky";
import { HTTPError } from "ky";
import { cookies } from "next/headers";

export async function verifyEmail(
    email: string,
    otp: string
): Promise<{ error?: string; success?: boolean }> {
    try {
        const res = await kyInstance.post("auth/verify-email", { json: { email, otp } }).json<{ token?: string }>();
        
        if (res.token) {
            (await cookies()).set("session", res.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/"
            });
        }
        
        return { success: true };
    } catch (error) {
        if (error instanceof HTTPError) {
            const data = await error.response.json().catch(() => ({}));
            return { error: data.error || "Failed to verify email." };
        }
        return { error: "Something went wrong. Please try again." };
    }
}

export async function resendVerificationEmail(
    email: string
): Promise<{ error?: string; success?: boolean }> {
    try {
        await kyInstance.post("auth/resend-otp", { json: { email } });
        return { success: true };
    } catch (error) {
        if (error instanceof HTTPError) {
            const data = await error.response.json().catch(() => ({}));
            return { error: data.error || "Failed to resend verification email." };
        }
        return { error: "Something went wrong. Please try again." };
    }
}
