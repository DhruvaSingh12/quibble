import { ResetPasswordValues } from "@/lib/validation";
import kyInstance from "@/lib/ky";
import { HTTPError } from "ky";

interface ResetPasswordParams extends ResetPasswordValues {
  token: string;
}

export async function resetPassword(
  values: ResetPasswordParams
): Promise<{ error?: string }> {
  try {
    await kyInstance.post("auth/reset-password", { json: values });
    return {};
  } catch (error) {
    if (error instanceof HTTPError) {
      const data = await error.response.json().catch(() => ({}));
      return { error: data.error || "Something went wrong. Please try again later." };
    }
    console.error("Password reset error:", error);
    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}
