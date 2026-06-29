export async function verifyEmail(
    email: string,
    otp: string
): Promise<{ error?: string; success?: boolean }> {
    try {
        const response = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        });
        const data = await response.json();
        
        if (!response.ok) {
            return { error: data.error || "Failed to verify email." };
        }
        
        return { success: true };
    } catch (error) {
        return { error: "Something went wrong. Please try again." };
    }
}

export async function resendVerificationEmail(
    email: string
): Promise<{ error?: string; success?: boolean }> {
    try {
        const response = await fetch("/api/auth/resend-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        
        if (!response.ok) {
            return { error: data.error || "Failed to resend verification email." };
        }
        
        return { success: true };
    } catch (error) {
        return { error: "Something went wrong. Please try again." };
    }
}
