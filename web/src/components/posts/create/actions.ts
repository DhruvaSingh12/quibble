export async function submitPost(input: {content: string, attachments?: {url: string, type: "IMAGE" | "VIDEO", mimeType?: string}[]}) {
    const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
    });

    if (!response.ok) {
        throw new Error("Failed to submit post");
    }

    return response.json();
}

// Fetch users that the current user is following for mention suggestions
export async function getFollowingSuggestions(searchTerm: string) {
    try {
        const response = await fetch(`/api/posts/mention-suggestions?q=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) return [];
        return response.json();
    } catch (error) {
        console.error("Error fetching following suggestions:", error);
        return [];
    }
}