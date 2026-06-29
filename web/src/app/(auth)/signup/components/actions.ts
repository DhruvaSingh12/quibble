import { SignUpValues } from "@/lib/validation";

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
    try {
        const response = await fetch("/api/auth/check-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        return { available: false, error: "Unable to check username availability." };
    }
}

export async function checkEmailAvailability(email: string): Promise<{ available: boolean; error?: string }> {
    try {
        const response = await fetch("/api/auth/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        return { available: false, error: "Unable to check email availability." };
    }
}

export async function signUp(
    credentials: SignUpValues
): Promise<{ error?: string; requiresVerification?: boolean; email?: string }> {
    try {
        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials)
        });
        const data = await response.json();
        
        if (!response.ok) {
            return { error: data.error || "Failed to sign up." };
        }
        
        return data;
    } catch (error) {
        return { error: "Something went wrong. Please try again." };
    }
}

