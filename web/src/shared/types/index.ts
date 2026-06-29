export interface PostsPage {
    posts: any[];
    nextCursor: string | null;
}

export interface CommentsPage {
    comments: any[];
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

export interface CommentReactionInfo {
    likes: number;
    isLikedByUser: boolean;
}
