import { prisma } from "../../config/prisma";
﻿import { Request, Response } from "express";
import { getPostDataInclude } from "../../utils/prisma-includes";
import { eventBus } from "../../events/event-bus";

const PAGE_SIZE = 12;

export const createPost = async (req: Request, res: Response) => {
  const { content, attachments } = req.body;
  const user = req.user!;

  const newPost = await prisma.post.create({
    data: {
      content,
      userId: user.id,
      ...(attachments && attachments.length > 0 && {
        attachments: {
          create: attachments.map((a: any) => ({
            url: a.url,
            type: a.type,
            mimeType: a.mimeType
          }))
        }
      })
    },
    include: getPostDataInclude(user.id),
  });

  eventBus.emitEvent("post:created", { postId: newPost.id, authorId: user.id });

  res.status(201).json(newPost);
};

export const editPost = async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
  const { content } = req.body;
  const user = req.user!;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.userId !== user.id) return res.status(403).json({ error: "Unauthorized" });

  const updatedPost = await prisma.post.update({
    where: { id },
    data: { content },
    include: getPostDataInclude(user.id),
  });

  res.json(updatedPost);
};

export const deletePost = async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
  const user = req.user!;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.userId !== user.id) return res.status(403).json({ error: "Unauthorized" });

  await prisma.post.delete({ where: { id } });
  res.json({ success: true });
};

export const getPostById = async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
  const user = req.user!;

  const post = await prisma.post.findUnique({
    where: { id },
    include: getPostDataInclude(user.id),
  });

  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
};

export const getForYouFeed = async (req: Request, res: Response) => {
  const user = req.user!;
  const cursor = req.query.cursor as string | undefined;

  const posts = await prisma.post.findMany({
    include: getPostDataInclude(user.id),
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    cursor: cursor ? { id: cursor } : undefined,
  });

  const nextCursor = posts.length > PAGE_SIZE ? posts[PAGE_SIZE].id : null;
  res.json({ posts: posts.slice(0, PAGE_SIZE), nextCursor });
};

export const getFollowingFeed = async (req: Request, res: Response) => {
  const user = req.user!;
  const cursor = req.query.cursor as string | undefined;

  const posts = await prisma.post.findMany({
    where: {
      user: {
        followers: {
          some: {
            followerId: user.id,
          },
        },
      },
    },
    include: getPostDataInclude(user.id),
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    cursor: cursor ? { id: cursor } : undefined,
  });

  const nextCursor = posts.length > PAGE_SIZE ? posts[PAGE_SIZE].id : null;
  res.json({ posts: posts.slice(0, PAGE_SIZE), nextCursor });
};

export const getBookmarksFeed = async (req: Request, res: Response) => {
  const user = req.user!;
  const cursor = req.query.cursor as string | undefined;

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    include: {
      post: {
        include: getPostDataInclude(user.id),
      },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    cursor: cursor ? { id: cursor } : undefined,
  });

  const nextCursor = bookmarks.length > PAGE_SIZE ? bookmarks[PAGE_SIZE].id : null;
  const posts = bookmarks.slice(0, PAGE_SIZE).map((b) => b.post);
  res.json({ posts, nextCursor });
};

export const getUserPostsFeed = async (req: Request, res: Response) => {
  const user = req.user!;
    const { userId } = req.params as Record<string, string>;
  const cursor = req.query.cursor as string | undefined;

  const posts = await prisma.post.findMany({
    where: { userId },
    include: getPostDataInclude(user.id),
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    cursor: cursor ? { id: cursor } : undefined,
  });

  const nextCursor = posts.length > PAGE_SIZE ? posts[PAGE_SIZE].id : null;
  res.json({ posts: posts.slice(0, PAGE_SIZE), nextCursor });
};

export const getMentionSuggestions = async (req: Request, res: Response) => {
  const user = req.user!;
  const searchTerm = (req.query.q as string) || "";

  const followingUsers = await prisma.user.findMany({
    where: {
      followers: { some: { followerId: user.id } },
      AND: [
        {
          OR: [
            { username: { contains: searchTerm, mode: "insensitive" } },
            { displayName: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
    orderBy: { displayName: "asc" },
    take: 5,
  });

  if (followingUsers.length < 5) {
    const otherUsers = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: user.id } },
          { id: { notIn: followingUsers.map((u) => u.id) } },
          {
            OR: [
              { username: { contains: searchTerm, mode: "insensitive" } },
              { displayName: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
      orderBy: { displayName: "asc" },
      take: 5 - followingUsers.length,
    });
    return res.json([...followingUsers, ...otherUsers]);
  }

  res.json(followingUsers);
};


export const getPostsByHashtag = async (req: Request, res: Response) => {
    const { hashtag } = req.params as Record<string, string>;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const user = req.user!;

  const skip = (page - 1) * pageSize;

  const posts = await prisma.post.findMany({
    where: {
      content: {
        contains: `#${hashtag}`,
        mode: "insensitive"
      }
    },
    include: getPostDataInclude(user.id),
    orderBy: {
      createdAt: "desc"
    },
    take: pageSize + 1,
    skip
  });

  const filteredPosts = posts.filter(post => {
    const hashtagPattern = new RegExp(`#${hashtag}\\b`, "i");
    return hashtagPattern.test(post.content);
  });

  const hasNextPage = filteredPosts.length > pageSize;
  const displayPosts = filteredPosts.slice(0, pageSize);

  res.json({
    posts: displayPosts,
    hasNextPage,
    currentPage: page
  });
};


export const getTrendingTopics = async (req: Request, res: Response) => {
  const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
    WITH extracted_hashtags AS (
      SELECT 
        LOWER(matches[1]) AS hashtag
      FROM 
        posts,
        LATERAL regexp_matches(content, '#([[:alnum:]_]+)', 'g') AS matches
      WHERE 
        content ~ '#[[:alnum:]_]+'
    )
    SELECT 
      hashtag,
      COUNT(*) as count 
    FROM 
      extracted_hashtags
    GROUP BY 
      hashtag
    ORDER BY 
      count DESC, hashtag ASC
    LIMIT 5`;

  const formattedResult = result.map((row) => ({
    hashtag: row.hashtag,
    count: Number(row.count),
  }));

  res.json(formattedResult);
};

