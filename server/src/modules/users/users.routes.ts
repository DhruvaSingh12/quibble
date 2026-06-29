import { Router } from "express";
import * as usersController from "./users.controller";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { updateUserProfileSchema } from "../../shared";
import { z } from "zod";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get("/who-to-follow", usersController.getWhoToFollow);
usersRouter.get("/:userId/followers", usersController.getFollowers);
usersRouter.get("/:userId/following", usersController.getFollowing);
usersRouter.get("/:username", usersController.getUserProfile);
usersRouter.patch("/me", validate(z.object({ body: updateUserProfileSchema })), usersController.updateUserProfile);

