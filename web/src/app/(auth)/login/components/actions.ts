"use server";

import { LoginValues } from "@/lib/validation";
import kyInstance from "@/lib/ky";
import { HTTPError } from "ky";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function login(
    credentials: LoginValues
): Promise<{ error?: string }> {
    try {
        const res = await kyInstance.post("auth/login", { json: credentials }).json<{ token?: string }>();
        
        if (res.token) {
            (await cookies()).set("session", res.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/"
            });
        }
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

    return {};
}
