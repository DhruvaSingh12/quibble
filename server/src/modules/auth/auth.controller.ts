import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { hash, verify } from "@node-rs/argon2";
import { createSession, setSessionCookie, clearSessionCookie, invalidateSession, invalidateAllUserSessions } from "./session.service";
import { sendOTPEmail, generateOTP, sendPasswordResetEmail } from "../../integrations/email";
import { AUTH_CONSTANTS } from "../../shared";
import crypto from "crypto";


function generateUserId(): string {
  const bytes = new Uint8Array(15);
  crypto.getRandomValues(bytes);
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let bits = 0, value = 0, output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

export const checkUsername = async (req: Request, res: Response) => {
  const { username } = req.body;
  const user = await prisma.user.findFirst({ where: { username: { equals: username, mode: "insensitive" } } });
  res.json({ available: !user });
};

export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  res.json({ available: !user });
};

export const signup = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const passwordHash = await hash(password, AUTH_CONSTANTS.ARGON2_OPTIONS);
  const userId = generateUserId();

  await prisma.user.create({
    data: { id: userId, username, displayName: username, email, passwordHash, emailVerified: false },
  });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.OTP_EXPIRES_IN);

  await prisma.emailVerification.create({
    data: { email, otp, userId, expiresAt },
  });

  const emailResult = await sendOTPEmail(email, otp, username);
  if (!emailResult.success) {
    await prisma.emailVerification.deleteMany({ where: { email, userId } });
    await prisma.user.delete({ where: { id: userId } });
    return res.status(500).json({ error: "Failed to send verification email" });
  }

  res.status(201).json({ requiresVerification: true, email });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await prisma.user.findFirst({ where: { username: { equals: username, mode: "insensitive" } } });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (user.email && !user.emailVerified) {
    return res.status(403).json({ error: "Please verify your email address before logging in", requiresVerification: true, email: user.email });
  }

  const validPassword = await verify(user.passwordHash, password, AUTH_CONSTANTS.ARGON2_OPTIONS);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const session = await createSession(user.id);
  setSessionCookie(res, session.id, session.expiresAt);
  res.json({ success: true, user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl } });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  
  const verification = await prisma.emailVerification.findFirst({
    where: { email, otp },
    orderBy: { createdAt: "desc" },
  });

  if (!verification || verification.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired verification code." });
  }

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  await prisma.emailVerification.deleteMany({ where: { email } });

  const session = await createSession(user.id);
  setSessionCookie(res, session.id, session.expiresAt);
  res.json({ success: true });
};

export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.emailVerified) return res.status(400).json({ error: "Email already verified" });

  await prisma.emailVerification.deleteMany({ where: { email } });
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.OTP_EXPIRES_IN);

  await prisma.emailVerification.create({
    data: { email, otp, userId: user.id, expiresAt },
  });

  const emailResult = await sendOTPEmail(email, otp, user.username);
  if (!emailResult.success) {
    return res.status(500).json({ error: "Failed to send verification email" });
  }
  res.json({ success: true });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) {
    // Return success anyway for security
    return res.json({ success: true });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + AUTH_CONSTANTS.RESET_TOKEN_EXPIRES_IN);

  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
  await prisma.passwordReset.create({
    data: { userId: user.id, token, expires },
  });

  await sendPasswordResetEmail(email, token, user.username);
  res.json({ success: true });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetRecord || resetRecord.expires < new Date()) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  const passwordHash = await hash(password, AUTH_CONSTANTS.ARGON2_OPTIONS);
  
  await prisma.user.update({
    where: { id: resetRecord.userId },
    data: { passwordHash },
  });

  await prisma.passwordReset.deleteMany({ where: { userId: resetRecord.userId } });
  await invalidateAllUserSessions(resetRecord.userId);
  
  res.json({ success: true });
};

export const logout = async (req: Request, res: Response) => {
  if (req.session) {
    await invalidateSession(req.session.id);
  }
  clearSessionCookie(res);
  res.json({ success: true });
};

export const logoutAll = async (req: Request, res: Response) => {
  if (req.user) {
    await invalidateAllUserSessions(req.user.id);
  }
  clearSessionCookie(res);
  res.json({ success: true });
};

export const me = async (req: Request, res: Response) => {
  res.json({ user: req.user });
};
