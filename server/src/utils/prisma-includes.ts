import { Prisma } from "@prisma/client";

export function getUserDataSelect(loggedInUserId: string) {
    return {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        followers: {
            where: {
                followerId: loggedInUserId,
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
    } satisfies Prisma.UserSelect;
}

export function getPostDataInclude(loggedInUserId: string) {
    return {
        user: {
            select: getUserDataSelect(loggedInUserId),
        },
        attachments: true,
        likes: {
            where: { userId: loggedInUserId },
            select: { userId: true },
        },
        dislikes: {
            where: { userId: loggedInUserId },
            select: { userId: true },
        },
        bookmarks: {
            where: { userId: loggedInUserId },
            select: { userId: true },
        },
        _count: {
            select: {
                likes: true,
                dislikes: true,
                comments: true,
            },
        },
    } satisfies Prisma.PostInclude;
}

export function getCommentDataInclude(loggedInUserId: string) {
    return {
        user: {
            select: getUserDataSelect(loggedInUserId),
        },
        commentLikes: {
            where: { userId: loggedInUserId },
            select: { userId: true },
        },
        _count: {
            select: {
                commentLikes: true,
                replies: true,
            },
        },
    } satisfies Prisma.CommentInclude;
}

