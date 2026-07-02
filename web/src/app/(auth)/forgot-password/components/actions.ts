import { ForgotPasswordValues } from "@/lib/validation";
import kyInstance from "@/lib/ky";
import { HTTPError } from "ky";

export async function requestPasswordReset(
  values: ForgotPasswordValues
): Promise<{ error?: string }> {
  try {
    await kyInstance.post("auth/forgot-password", { json: values });
    return {};
  } catch (error) {
    if (error instanceof HTTPError) {
      const data = await error.response.json().catch(() => ({}));
      return { error: data.error || "Something went wrong. Please try again later." };
    }
    console.error("Password reset request error:", error);
    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}
