import { Router } from "express";
import * as postsController from "./posts.controller";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { createPostSchema } from "../../shared";
import { z } from "zod";

export const postsRouter = Router();

postsRouter.use(authenticate);

postsRouter.post("/", validate(z.object({ body: createPostSchema })), postsController.createPost);
postsRouter.get("/for-you", postsController.getForYouFeed);
postsRouter.get("/following", postsController.getFollowingFeed);
postsRouter.get("/bookmarks", postsController.getBookmarksFeed);
postsRouter.get("/user/:userId", postsController.getUserPostsFeed);
postsRouter.get("/hashtag/:hashtag", postsController.getPostsByHashtag);
postsRouter.get("/trending-topics", postsController.getTrendingTopics);
postsRouter.get("/mention-suggestions", postsController.getMentionSuggestions);

postsRouter.get("/:id", postsController.getPostById);
postsRouter.put("/:id", postsController.editPost);
postsRouter.delete("/:id", postsController.deletePost);

