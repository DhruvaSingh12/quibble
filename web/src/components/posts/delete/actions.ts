export async function deletePost(id: string) {
    const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Failed to delete post");
    }

    return response.json();
}