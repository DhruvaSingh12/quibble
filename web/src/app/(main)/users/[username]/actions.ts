import kyInstance from "@/lib/ky";
import { UpdateUserProfileValues } from "@/lib/validation";
import { UserData } from "@/lib/types";

export async function updateUserProfile(values: UpdateUserProfileValues) {
    try {
        const response = await kyInstance.patch("users/me", {
            json: values
        }).json<UserData>();
        return response;
    } catch (error) {
        console.error("Failed to update profile:", error);
        throw new Error("Failed to update profile");
    }
}