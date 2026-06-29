export async function logout() {
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
    } catch (e) {
        console.error(e);
    }
    window.location.href = "/login";
}