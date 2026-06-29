import { Router } from "express";
import * as authController from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { authRateLimiter } from "../../middleware/rate-limiter";
import { 
  signUpSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from "../../shared";
import { z } from "zod";

export const authRouter = Router();

authRouter.use(authRateLimiter);

authRouter.post("/check-username", validate(z.object({ body: z.object({ username: z.string() }) })), authController.checkUsername);
authRouter.post("/check-email", validate(z.object({ body: z.object({ email: z.string() }) })), authController.checkEmail);
authRouter.post("/signup", validate(z.object({ body: signUpSchema })), authController.signup);
authRouter.post("/login", validate(z.object({ body: loginSchema })), authController.login);
authRouter.post("/verify-email", validate(z.object({ body: z.object({ email: z.string().email(), otp: z.string() }) })), authController.verifyEmail);
authRouter.post("/resend-otp", validate(z.object({ body: z.object({ email: z.string().email() }) })), authController.resendOtp);
authRouter.post("/forgot-password", validate(z.object({ body: forgotPasswordSchema })), authController.forgotPassword);
authRouter.post("/reset-password", validate(z.object({ body: z.intersection(resetPasswordSchema, z.object({ token: z.string() })) })), authController.resetPassword);

authRouter.post("/logout", authenticate, authController.logout);
authRouter.post("/logout-all", authenticate, authController.logoutAll);
authRouter.get("/me", authenticate, authController.me);

