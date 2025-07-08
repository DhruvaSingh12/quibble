"use server";

import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { validateRequest } from "@/auth";

export async function getUserByUsername(username: string) {
    try {
        const { user } = await validateRequest();
        if (!user) {
            throw new Error("Unauthorized");
        }

        const userData = await prisma.user.findUnique({
            where: { username },
            select: getUserDataSelect(user.id),
        });

        if (!userData) {
            return null;
        }

        return userData;
    } catch (error) {
        console.error("Error fetching user by username:", error);
        return null;
    }
}
