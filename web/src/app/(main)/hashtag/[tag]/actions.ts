import kyInstance from "@/lib/ky";
import { PostData } from "@/lib/types";

export interface HashtagPageResult {
    posts: PostData[];
    hasNextPage: boolean;
    currentPage: number;
}

export async function getPostsByHashtag(hashtag: string, page: number = 1, pageSize: number = 10): Promise<HashtagPageResult> {
    try {
        const response = await kyInstance.get(`posts/hashtag/${encodeURIComponent(hashtag)}`, {
            searchParams: { page, pageSize }
        }).json<HashtagPageResult>();
        return response;
    } catch (error) {
        console.error("Error fetching hashtag posts:", error);
        return {
            posts: [] as PostData[],
            hasNextPage: false,
            currentPage: page
        };
    }
}
