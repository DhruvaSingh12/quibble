import kyInstance from "@/lib/ky";
import { PostData } from "@/lib/types";

export async function submitPost(input: {content: string, attachments?: {url: string, type: "IMAGE" | "VIDEO", mimeType?: string}[]}) {
    try {
        const response = await kyInstance.post("posts", { json: input }).json<PostData>();
        return response;
    } catch (error) {
        console.error("Failed to submit post:", error);
        throw new Error("Failed to submit post");
    }
}

// Fetch users that the current user is following for mention suggestions
export async function getFollowingSuggestions(searchTerm: string) {
    try {
        const response = await kyInstance.get("posts/mention-suggestions", { searchParams: { q: searchTerm } }).json<any[]>();
        return response;
    } catch (error) {
        console.error("Error fetching following suggestions:", error);
        return [];
    }
}