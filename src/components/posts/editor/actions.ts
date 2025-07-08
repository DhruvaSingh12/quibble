"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";

export async function submitPost(input: string) {
    const {user} = await validateRequest();
    if(!user) throw Error("Unauthorised")
    
    const{content} = createPostSchema.parse({content : input});

    const newPost = await prisma.post.create({
        data: {
            content,
            userId: user.id
        },
        include: getPostDataInclude(user.id),
    });

    return newPost;
}

// Fetch users that the current user is following for mention suggestions
export async function getFollowingSuggestions(searchTerm: string) {
    try {
        const { user } = await validateRequest();
        if (!user) {
            throw new Error("Unauthorized");
        }

        // Find users that the current user is following
        const followingUsers = await prisma.user.findMany({
            where: {
                followers: {
                    some: {
                        followerId: user.id
                    }
                },
                AND: [
                    {
                        OR: [
                            { username: { contains: searchTerm, mode: 'insensitive' } },
                            { displayName: { contains: searchTerm, mode: 'insensitive' } }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
            },
            orderBy: {
                displayName: 'asc'
            },
            take: 5
        });

        // If we don't have 5 following users, get some other users to fill in            
        // console.log(`Found ${followingUsers.length} following users matching "${searchTerm}"`);
            
            if (followingUsers.length < 5) {
                const otherUsers = await prisma.user.findMany({
                    where: {
                        AND: [
                            { id: { not: user.id } }, // Not the current user
                            { 
                                id: { 
                                    notIn: followingUsers.map(u => u.id) // Not already in results
                                } 
                            },
                            {
                                OR: [
                                    { username: { contains: searchTerm, mode: 'insensitive' } },
                                    { displayName: { contains: searchTerm, mode: 'insensitive' } }
                                ]
                            }
                        ]
                    },
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true
                    },
                    orderBy: {
                        displayName: 'asc'
                    },
                    take: 5 - followingUsers.length
                });
                
                console.log(`Found ${otherUsers.length} additional users matching "${searchTerm}"`);
                const result = [...followingUsers, ...otherUsers];
                console.log('Returning total users:', result.length);
                return result;
            }

            console.log('Returning following users:', followingUsers.length);
            return followingUsers;
    } catch (error) {
        console.error("Error fetching following suggestions:", error);
        return [];
    }
}