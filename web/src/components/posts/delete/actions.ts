import kyInstance from "@/lib/ky";

export async function deletePost(id: string) {
    try {
        const response = await kyInstance.delete(`posts/${id}`).json<{id: string, user: {username: string}}>();
        return response;
    } catch (error) {
        console.error("Failed to delete post:", error);
        throw new Error("Failed to delete post");
    }
}