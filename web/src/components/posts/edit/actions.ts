import kyInstance from "@/lib/ky";
import { PostData } from "@/lib/types";

export async function editPost(id: string, content: string) {
    try {
        const response = await kyInstance.put(`posts/${id}`, {
            json: { content }
        }).json<PostData>();
        return response;
    } catch (error) {
        console.error("Failed to edit post:", error);
        throw new Error("Failed to edit post");
    }
}
