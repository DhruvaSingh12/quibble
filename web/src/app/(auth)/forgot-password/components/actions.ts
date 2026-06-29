import { ForgotPasswordValues } from "@/lib/validation";

export async function requestPasswordReset(
  values: ForgotPasswordValues
): Promise<{ error?: string }> {
  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "Something went wrong. Please try again later." };
    }

    return {};
  } catch (error) {
    console.error("Password reset request error:", error);
    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}
