"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const { user: loggedInUser } = await validateRequest();
        if (!loggedInUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const url = new URL(request.url);
        const cursor = url.searchParams.get("cursor") || undefined;
        const pageSize = 10;

        const followingList = await prisma.follow.findMany({
            where: {
                followerId: userId,
            },
            select: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                        bio: true,
                        createdAt: true,
                        followers: {
                            where: {
                                followerId: loggedInUser.id,
                            },
                            select: {
                                followerId: true,
                            },
                        },
                        _count: {
                            select: {
                                followers: true,
                            },
                        },
                    },
                },
            },
            take: pageSize + 1,
            cursor: cursor ? { followerId_followingId: { followerId: userId, followingId: cursor } } : undefined,
            orderBy: {
                followingId: 'desc',
            },
        });

        const nextCursor = followingList.length > pageSize ? followingList[pageSize].following.id : null;

        const transformedList = followingList.slice(0, pageSize).map(item => ({
            id: item.following.id,
            username: item.following.username,
            displayName: item.following.displayName,
            avatarUrl: item.following.avatarUrl,
            bio: item.following.bio,
            joined: item.following.createdAt,
            followers: item.following._count.followers,
            isFollowedByUser: item.following.followers.length > 0
        }));

        return NextResponse.json({ followingList: transformedList, nextCursor });
    } catch (error) {
        console.error("Error fetching following:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
