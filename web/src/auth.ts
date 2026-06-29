import { cache } from "react";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "session";

export interface Session {
    id: string;
    userId: string;
    expiresAt: Date;
}

export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    googleId: string | null;
}

// Validate request and return user + session
export const validateRequest = cache(
    async (): Promise<
        { user: User; session: Session } | { user: null; session: null }
    > => {
        const sessionId = (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;

        if (!sessionId) {
            return {
                user: null,
                session: null,
            };
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
                headers: {
                    Cookie: `${SESSION_COOKIE_NAME}=${sessionId}`
                },
                cache: "no-store"
            });
            if (!res.ok) return { user: null, session: null };

            const data = await res.json();
            return {
                user: data.user,
                session: { id: sessionId, userId: data.user.id, expiresAt: new Date() }
            };
        } catch {
            return { user: null, session: null };
        }
    }
);