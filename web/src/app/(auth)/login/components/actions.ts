import { LoginValues } from "@/lib/validation";
import kyInstance from "@/lib/ky";
import { HTTPError } from "ky";

export async function login(
    credentials: LoginValues
): Promise<{ error?: string }> {
    try {
        await kyInstance.post("auth/login", { json: credentials });
        window.location.href = "/";
        return {};
    } catch (error) {
        if (error instanceof HTTPError) {
            const errorData = await error.response.json().catch(() => ({}));
            return { error: errorData.error || "Invalid credentials or something went wrong." };
        }
        console.error(error);
        return {
            error: "Something went wrong. Please try again later.",
        };
    }
}
