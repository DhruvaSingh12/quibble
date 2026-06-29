import { ResetPasswordValues } from "@/lib/validation";

interface ResetPasswordParams extends ResetPasswordValues {
  token: string;
}

export async function resetPassword(
  values: ResetPasswordParams
): Promise<{ error?: string }> {
  try {
    const response = await fetch("/api/auth/reset-password", {
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
    console.error("Password reset error:", error);
    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}
