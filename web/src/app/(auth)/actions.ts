"use server";

import kyInstance from "@/lib/ky";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function logout() {
    try {
        await kyInstance.post("auth/logout");
    } catch (e) {
        console.error(e);
    }
    
    (await cookies()).delete("session");
    redirect("/login");
}