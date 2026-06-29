import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { eventBus } from "../../events/event-bus";
import { getCommentDataInclude } from "../../utils/prisma-includes";


// Reactions
export const toggleLike = async (req: Request, res: Response) => {
    const { postId } = req.params as Record<string, string>;
  const user = req.user!;

  const existingLike = await prisma.like.findUnique({ where: { userId_postId: { userId: user.id, postId } } });

  if (existingLike) {
    await prisma.like.delete({ where: { userId_postId: { userId: user.id, postId } } });
    res.json({ isLiked: false });
  } else {
    // Delete any existing dislike first
    await prisma.dislike.deleteMany({ where: { userId: user.id, postId } });

    await prisma.like.create({ data: { userId: user.id, postId } });
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post) {
      eventBus.emitEvent("post:liked", { postId, userId: user.id, authorId: post.userId });
    }
    res.json({ isLiked: true });
  }
};

export const toggleDislike = async (req: Request, res: Response) => {
    const { postId } = req.params as Record<string, string>;
  const user = req.user!;

  const existingDislike = await prisma.dislike.findUnique({ where: { userId_postId: { userId: user.id, postId } } });

  if (existingDislike) {
    await prisma.dislike.delete({ where: { userId_postId: { userId: user.id, postId } } });
    res.json({ isDisliked: false });
  } else {
    // Delete any existing like first
    await prisma.like.deleteMany({ where: { userId: user.id, postId } });

    await prisma.dislike.create({ data: { userId: user.id, postId } });
    res.json({ isDisliked: true });
  }
};
export const toggleBookmark = async (req: Request, res: Response) => {
    const { postId } = req.params as Record<string, string>;
  const user = req.user!;

  const existing = await prisma.bookmark.findUnique({ where: { userId_postId: { userId: user.id, postId } } });

  if (existing) {
    await prisma.bookmark.delete({ where: { userId_postId: { userId: user.id, postId } } });
    res.json({ isBookmarked: false });
  } else {
    await prisma.bookmark.create({ data: { userId: user.id, postId } });
    res.json({ isBookmarked: true });
  }
};

// Follows 
export const toggleFollow = async (req: Request, res: Response) => {
    const { userId } = req.params as Record<string, string>;
  const loggedInUser = req.user!;

  if (userId === loggedInUser.id) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: loggedInUser.id, followingId: userId } },
  });

  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: loggedInUser.id, followingId: userId } },
    });
    res.json({ isFollowing: false });
  } else {
    await prisma.follow.create({
      data: { followerId: loggedInUser.id, followingId: userId },
    });
    eventBus.emitEvent("user:followed", { followerId: loggedInUser.id, followingId: userId });
    res.json({ isFollowing: true });
  }
};

// Comments 
export const getComments = async (req: Request, res: Response) => {
    const { postId } = req.params as Record<string, string>;
  const user = req.user!;
  const cursor = req.query.cursor as string | undefined;
  const PAGE_SIZE = 10;

  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    include: getCommentDataInclude(user.id),
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    cursor: cursor ? { id: cursor } : undefined,
  });

  const nextCursor = comments.length > PAGE_SIZE ? comments[PAGE_SIZE].id : null;
  res.json({
    comments: comments.slice(0, PAGE_SIZE),
    nextCursor
  });
};

export const getReplies = async (req: Request, res: Response) => {
    const { postId, parentId } = req.params as Record<string, string>;
  const user = req.user!;
  const cursor = req.query.cursor as string | undefined;
  const PAGE_SIZE = 10;

  const comments = await prisma.comment.findMany({
    where: { postId, parentId },
    include: getCommentDataInclude(user.id),
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    cursor: cursor ? { id: cursor } : undefined,
  });

  const nextCursor = comments.length > PAGE_SIZE ? comments[PAGE_SIZE].id : null;
  res.json({
    comments: comments.slice(0, PAGE_SIZE),
    nextCursor
  });
};

export const createComment = async (req: Request, res: Response) => {
    const { postId } = req.params as Record<string, string>;
  const { content, parentId, gifUrl } = req.body;
  const user = req.user!;

  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      userId: user.id,
      parentId,
      gifUrl,
    },
    include: getCommentDataInclude(user.id),
  });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post) {
    eventBus.emitEvent("comment:created", { commentId: comment.id, postId, authorId: post.userId, commenterId: user.id });
  }

  res.status(201).json(comment);
};

export const deleteComment = async (req: Request, res: Response) => {
    const { commentId } = req.params as Record<string, string>;
  const user = req.user!;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return res.status(404).json({ error: "Not found" });
  if (comment.userId !== user.id) return res.status(403).json({ error: "Unauthorized" });

  await prisma.comment.delete({ where: { id: commentId } });
  res.json({ success: true });
};

export const toggleCommentLike = async (req: Request, res: Response) => {
    const { commentId } = req.params as Record<string, string>;
  const user = req.user!;

  const existing = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId: user.id, commentId } },
  });

  if (existing) {
    await prisma.commentLike.delete({
      where: { userId_commentId: { userId: user.id, commentId } },
    });
    res.json({ isLiked: false });
  } else {
    await prisma.commentLike.create({
      data: { userId: user.id, commentId },
    });
    res.json({ isLiked: true });
  }
};

