import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
    if (!socket) {
        let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        
        if (typeof window !== "undefined") {
            const hostname = window.location.hostname;
            if (hostname !== "localhost" && apiUrl.includes("localhost")) {
                apiUrl = apiUrl.replace("localhost", hostname);
            }
        }

        socket = io(apiUrl, {
            auth: { token },
            withCredentials: true,
            autoConnect: false,
        });
    }
    return socket;
};
