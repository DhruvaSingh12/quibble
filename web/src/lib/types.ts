import type { Prisma } from "@prisma/client";

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
                following: true,
                posts: true,
            },
        },
    } satisfies Prisma.UserSelect;
}

export type UserData = Prisma.UserGetPayload<{
    select: ReturnType<typeof getUserDataSelect>;
}>;

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

export type PostData = Prisma.PostGetPayload<{
    include: ReturnType<typeof getPostDataInclude>;
}>;

export interface PostsPage {
    posts: PostData[];
    nextCursor: string | null;
}

export function getCommentDataInclude(loggedInUserId: string) {
    return {
        user: {
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
            },
        },
        _count: {
            select: {
                replies: true,
                commentLikes: true,
            },
        },
        commentLikes: {
            where: { userId: loggedInUserId },
            select: { userId: true },
        },
    } satisfies Prisma.CommentInclude;
}

export type CommentData = Prisma.CommentGetPayload<{
    include: ReturnType<typeof getCommentDataInclude>;
}>;

export interface CommentsPage {
    comments: CommentData[];
    nextCursor: string | null;
}

export interface ReactionInfo {
    likes: number;
    dislikes: number;
    isLikedByUser: boolean;
    isDislikedByUser: boolean;
}

export interface BookmarkInfo {
    isBookmarkedByUser: boolean;
}

export interface FollowerInfo {
    followers: number;
    isFollowedByUser: boolean;
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    followerInfo?: { 
        id: string;
        username: string;
        name: string;
        avatarUrl: string | null;
        bio: string | null;
        joined: string;
        isFollowedByUser?: boolean;
    }[];
}

export interface FollowerListItem {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    joined: Date;
    followers: number;
    isFollowedByUser: boolean;
}

export interface FollowerPage {
    followerList: FollowerListItem[];
    nextCursor: string | null;
}

export interface FollowingPage {
    followingList: FollowerListItem[];
    nextCursor: string | null;
}

export interface Phonetic {
    text?: string;
    audio?: string;
    sourceUrl?: string;
    license?: {
        name: string;
        url: string;
    };
}

export interface Definition {
    definition: string;
    synonyms: string[];
    antonyms: string[];
    example?: string;
}

export interface Meaning {
    partOfSpeech: string;
    definitions: Definition[];
    synonyms: string[];
    antonyms: string[];
}

export interface DictionaryResponse {
    word: string;
    phonetics: Phonetic[];
    meanings: Meaning[];
    origin?: string;
    license?: {
        name: string;
        url: string;
    };
    sourceUrls: string[];
}

export interface CommentReactionInfo {
    likes: number;
    isLikedByUser: boolean;
}
