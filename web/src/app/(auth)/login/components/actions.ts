import { LoginValues } from "@/lib/validation";

export async function login(
    credentials: LoginValues
): Promise<{ error?: string }> {
    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { error: errorData.error || "Invalid credentials or something went wrong." };
        }
        
        window.location.href = "/";
        return {};
    } catch (error) {
        console.error(error);
        return {
            error: "Something went wrong. Please try again later.",
        };
    }
}
