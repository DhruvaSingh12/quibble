import { Request, Response, NextFunction } from "express";
import { validateSession, Session } from "../modules/auth/session.service";
import { UserDTO } from "../shared";
import { parseCookie } from "cookie";

declare global {
  namespace Express {
    interface Request {
      user?: UserDTO;
      session?: Session;
    }
  }
}

export const parseAuthCookies = async (req: Request) => {
  const cookies = req.headers.cookie ? parseCookie(req.headers.cookie) : {};
  let sessionId = cookies.session;
  
  if (!sessionId && req.headers.authorization?.startsWith("Bearer ")) {
    sessionId = req.headers.authorization.split(" ")[1];
  }

  if (!sessionId) return { session: null, user: null };
  return validateSession(sessionId);
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  let sessionId = req.cookies.session;
  if (!sessionId && req.headers.authorization?.startsWith("Bearer ")) {
    sessionId = req.headers.authorization.split(" ")[1];
  }

  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { session, user } = await validateSession(sessionId);
  if (!session || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.session = session;
  req.user = user;
  next();
};

export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  let sessionId = req.cookies.session;
  if (!sessionId && req.headers.authorization?.startsWith("Bearer ")) {
    sessionId = req.headers.authorization.split(" ")[1];
  }
  if (!sessionId) return next();

  const { session, user } = await validateSession(sessionId);
  if (session && user) {
    req.session = session;
    req.user = user;
  }
  next();
};
