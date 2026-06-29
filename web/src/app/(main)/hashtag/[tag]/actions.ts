import { PostData } from "@/lib/types";

export async function getPostsByHashtag(hashtag: string, page: number = 1, pageSize: number = 10) {
    try {
        const response = await fetch(`/api/posts/hashtag/${encodeURIComponent(hashtag)}?page=${page}&pageSize=${pageSize}`);
        if (!response.ok) {
            throw new Error("Failed to fetch hashtag posts");
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching hashtag posts:", error);
        return {
            posts: [] as PostData[],
            hasNextPage: false,
            currentPage: page
        };
    }
}
