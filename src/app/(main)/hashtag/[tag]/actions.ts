"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";

export async function getPostsByHashtag(hashtag: string, page: number = 1, pageSize: number = 10) {
    const { user } = await validateRequest();
    if (!user) throw new Error("Unauthorized");

    const skip = (page - 1) * pageSize;

    const posts = await prisma.post.findMany({
        where: {
            content: {
                contains: `#${hashtag}`, 
                mode: 'insensitive' 
            }
        },
        include: getPostDataInclude(user.id),
        orderBy: {
            createdAt: 'desc'
        },
        take: pageSize + 1, 
        skip
    });
    
    const filteredPosts = posts.filter(post => {
        const hashtagPattern = new RegExp(`#${hashtag}\\b`, 'i');
        return hashtagPattern.test(post.content);
    });

    const hasNextPage = filteredPosts.length > pageSize;
    const displayPosts = filteredPosts.slice(0, pageSize);

    console.log(`Hashtag search for #${hashtag}:`, {
        totalFound: posts.length,
        afterFiltering: filteredPosts.length,
        returning: displayPosts.length,
        hasNextPage
    });

    return {
        posts: displayPosts,
        hasNextPage,
        currentPage: page
    };
}
