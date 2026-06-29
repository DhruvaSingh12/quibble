import { Router } from "express";
import * as socialController from "./social.controller";
import { authenticate } from "../../middleware/authenticate";

export const socialRouter = Router();

socialRouter.use(authenticate);

socialRouter.post("/posts/:postId/like", socialController.toggleLike);
socialRouter.post("/posts/:postId/dislike", socialController.toggleDislike);
socialRouter.post("/posts/:postId/bookmark", socialController.toggleBookmark);

socialRouter.post("/users/:userId/follow", socialController.toggleFollow);

socialRouter.get("/posts/:postId/comments", socialController.getComments);
socialRouter.get("/posts/:postId/comments/:parentId/replies", socialController.getReplies);
socialRouter.post("/posts/:postId/comments", socialController.createComment);
socialRouter.delete("/comments/:commentId", socialController.deleteComment);
socialRouter.post("/comments/:commentId/like", socialController.toggleCommentLike);

