export async function editPost(id: string, content: string) {
    const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    });

    if (!response.ok) {
        throw new Error("Failed to edit post");
    }

    return response.json();
}
