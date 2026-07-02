import { prisma } from "../../config/prisma";
import { UserDTO, AUTH_CONSTANTS } from "../../shared";
import crypto from "crypto";
import { Response } from "express";
import { env } from "../../config/env";


export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

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

export function generateSessionId(): string {
  const bytes = new Uint8Array(25);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

export async function createSession(userId: string): Promise<Session> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.SESSION_MAX_AGE);
  const session = { id: sessionId, userId, expiresAt };
  await prisma.session.create({ data: session });
  return session;
}

export async function validateSession(sessionId: string): Promise<{ session: Session; user: UserDTO } | { session: null; user: null }> {
  const result = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!result) return { session: null, user: null };
  const { user: dbUser, ...session } = result;

  if (Date.now() >= session.expiresAt.getTime()) {
    await prisma.session.delete({ where: { id: session.id } });
    return { session: null, user: null };
  }

  const user: UserDTO = {
    id: dbUser.id,
    username: dbUser.username,
    displayName: dbUser.displayName,
    avatarUrl: dbUser.avatarUrl,
  };

  if (Date.now() >= session.expiresAt.getTime() - AUTH_CONSTANTS.SESSION_MAX_AGE / 2) {
    const newExpiresAt = new Date(Date.now() + AUTH_CONSTANTS.SESSION_MAX_AGE);
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    });
    session.expiresAt = newExpiresAt;
  }
  return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export function setSessionCookie(res: Response, sessionId: string, expiresAt: Date) {
  const isProduction = env.NODE_ENV === "production";
  res.cookie("session", sessionId, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    expires: expiresAt,
    secure: isProduction,
  });
}

export function clearSessionCookie(res: Response) {
  const isProduction = env.NODE_ENV === "production";
  res.cookie("session", "", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 0,
    secure: isProduction,
  });
}