import kyInstance from "@/lib/ky";
import { HTTPError } from "ky";

export async function verifyEmail(
    email: string,
    otp: string
): Promise<{ error?: string; success?: boolean }> {
    try {
        await kyInstance.post("auth/verify-email", { json: { email, otp } });
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
