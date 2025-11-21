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
            orderBy: {
                followingId: 'desc',
            },
        });

        const transformedList = followingList.map(item => ({
            id: item.following.id,
            username: item.following.username,
            displayName: item.following.displayName,
            avatarUrl: item.following.avatarUrl,
            followers: item.following._count.followers,
            isFollowedByViewer: item.following.followers.length > 0
        }));

        return NextResponse.json({ followingList: transformedList });
    } catch (error) {
        console.error("Error fetching following:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
