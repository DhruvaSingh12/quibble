import kyInstance from "@/lib/ky";

export async function logout() {
    try {
        await kyInstance.post("auth/logout");
    } catch (e) {
        console.error(e);
    }
    window.location.href = "/login";
}