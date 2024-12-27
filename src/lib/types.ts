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
                posts: true,
                followers: true,
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
    } satisfies Prisma.PostInclude;
}

export type PostData = Prisma.PostGetPayload<{
    include: ReturnType<typeof getPostDataInclude>;
}>;

export interface PostsPage {
    posts: PostData[];
    nextCursor: string | null;
}

export interface FollowerInfo {
    followers: number;
    isFollowedByUser: boolean;
    followerList: {
        id: string;
        username: string;
        name: string;
        avatarUrl: string | null;
        bio: string | null;
        joined: string;
    }[];
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

export interface Follower {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: string;
    isFollowing?: boolean; // Add this if it's part of your data
    followersCount?: number; // Add this if it's part of your data
    followerList?: { // Add this if it's part of your data
        id: string;
        username: string;
        name: string;
        avatarUrl: string | null;
        bio: string | null;
        joined: string;
    }[];
}
