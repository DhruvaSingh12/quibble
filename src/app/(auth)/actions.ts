"use server";

import { validateRequest, invalidateSession, deleteSessionCookie } from "@/auth";
import { redirect } from "next/navigation";

export async function logout() {
    const {session} = await validateRequest();

    if(!session) {
        throw new Error("Unauthorized");
    }

    await invalidateSession(session.id);
    await deleteSessionCookie();

    return redirect("/login");
}