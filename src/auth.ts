import prisma from "./lib/prisma";
import { cache } from "react";
import { cookies } from "next/headers";

// Session configuration
const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SESSION_COOKIE_NAME = "session";

// Types
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

// Base32 encoding for session IDs (no padding, lowercase)
function encodeBase32LowerCaseNoPadding(bytes: Uint8Array): string {
    const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
    let bits = 0;
    let value = 0;
    let output = "";

    for (let i = 0; i < bytes.length; i++) {
        value = (value << 8) | bytes[i];
        bits += 8;

        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
}

// Generate a cryptographically secure session ID
export function generateSessionId(): string {
    const bytes = new Uint8Array(25);
    crypto.getRandomValues(bytes);
    return encodeBase32LowerCaseNoPadding(bytes);
}

// Create a new session
export async function createSession(userId: string): Promise<Session> {
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 1000 * SESSION_EXPIRES_IN_SECONDS);

    const session: Session = {
        id: sessionId,
        userId,
        expiresAt,
    };

    await prisma.session.create({
        data: {
            id: session.id,
            userId: session.userId,
            expiresAt: session.expiresAt,
        },
    });

    return session;
}

// Validate and refresh session
export async function validateSession(sessionId: string): Promise<{ session: Session; user: User } | { session: null; user: null }> {
    const result = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
    });

    if (!result) {
        return { session: null, user: null };
    }

    const { user: dbUser, ...session } = result;

    // Check if session is expired
    if (Date.now() >= session.expiresAt.getTime()) {
        await prisma.session.delete({ where: { id: session.id } });
        return { session: null, user: null };
    }

    const user: User = {
        id: dbUser.id,
        username: dbUser.username,
        displayName: dbUser.displayName,
        avatarUrl: dbUser.avatarUrl,
        googleId: dbUser.googleId,
    };

    // Refresh session if it's past halfway to expiration
    if (Date.now() >= session.expiresAt.getTime() - (1000 * SESSION_EXPIRES_IN_SECONDS) / 2) {
        const newExpiresAt = new Date(Date.now() + 1000 * SESSION_EXPIRES_IN_SECONDS);
        await prisma.session.update({
            where: { id: session.id },
            data: { expiresAt: newExpiresAt },
        });
        session.expiresAt = newExpiresAt;
    }

    return { session, user };
}

// Invalidate a single session
export async function invalidateSession(sessionId: string): Promise<void> {
    await prisma.session.delete({ where: { id: sessionId } });
}

// Invalidate all user sessions
export async function invalidateAllUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
}

// Cookie management
export async function setSessionCookie(sessionId: string, expiresAt: Date): Promise<void> {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();
    
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
        secure: isProduction,
    });
}

export async function deleteSessionCookie(): Promise<void> {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();
    
    cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        secure: isProduction,
    });
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

        const result = await validateSession(sessionId);

        // Refresh session cookie if session was refreshed
        if (result.session) {
            try {
                await setSessionCookie(result.session.id, result.session.expiresAt);
            } catch {}
        }

        return result;
    }
);