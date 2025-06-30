"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";

export async function editPost(id: string, content: string) {
    const { user } = await validateRequest();
    if (!user) throw new Error("Unauthorized");

    const post = await prisma.post.findUnique({
        where: { id },
    });

    if (!post) throw new Error("Post not found");
    if (post.userId !== user.id) throw new Error("Unauthorized");

    const updatedPost = await prisma.post.update({
        where: { id },
        data: { content },
        include: getPostDataInclude(user.id),
    });

    return updatedPost;
}
