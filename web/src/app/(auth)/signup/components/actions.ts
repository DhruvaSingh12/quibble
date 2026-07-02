import { SignUpValues } from "@/lib/validation";
import kyInstance from "@/lib/ky";
import { HTTPError } from "ky";

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
    try {
        return await kyInstance.post("auth/check-username", { json: { username } }).json();
    } catch (error) {
        return { available: false, error: "Unable to check username availability." };
    }
}

export async function checkEmailAvailability(email: string): Promise<{ available: boolean; error?: string }> {
    try {
        return await kyInstance.post("auth/check-email", { json: { email } }).json();
    } catch (error) {
        return { available: false, error: "Unable to check email availability." };
    }
}

export async function signUp(
    credentials: SignUpValues
): Promise<{ error?: string; requiresVerification?: boolean; email?: string }> {
    try {
        const data = await kyInstance.post("auth/signup", { json: credentials }).json<any>();
        return data;
    } catch (error) {
        if (error instanceof HTTPError) {
            const data = await error.response.json().catch(() => ({}));
            return { error: data.error || "Failed to sign up." };
        }
        return { error: "Something went wrong. Please try again." };
    }
}
