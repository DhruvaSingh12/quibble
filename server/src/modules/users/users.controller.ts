import { prisma } from "../../config/prisma";
import { Request, Response } from "express";


export const updateUserProfile = async (req: Request, res: Response) => {
  const { displayName, bio, avatarUrl } = req.body;
  const user = req.user!;

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      followers: {
        where: { followerId: user.id },
        select: { followerId: true },
      },
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  res.json(updatedUser);
};

export const getUserProfile = async (req: Request, res: Response) => {
    const { username } = req.params as Record<string, string>;
  const loggedInUser = req.user!;

  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      followers: {
        where: { followerId: loggedInUser.id },
        select: { followerId: true },
      },
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json(user);
};


export const getWhoToFollow = async (req: Request, res: Response) => {
  const user = req.user!;

  const usersToFollow = await prisma.user.findMany({
    where: {
      NOT: {
        id: user.id,
      },
      followers: {
        none: {
          followerId: user.id,
        },
      },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      followers: {
        where: { followerId: user.id },
        select: { followerId: true },
      },
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
    take: 5,
  });

  res.json(usersToFollow);
};

export const getFollowers = async (req: Request, res: Response) => {
    const { userId } = req.params as Record<string, string>;
  const loggedInUser = req.user!;
  const cursor = req.query.cursor as string | undefined;
  const PAGE_SIZE = 10;

  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          followers: {
            where: { followerId: loggedInUser.id },
            select: { followerId: true },
          },
          _count: {
            select: {
              followers: true,
            },
          },
        },
      },
    },
    take: PAGE_SIZE + 1,
    cursor: cursor ? { followerId_followingId: { followerId: cursor, followingId: userId } } : undefined,
  });

  const nextCursor = followers.length > PAGE_SIZE ? followers[PAGE_SIZE].followerId : null;
  
  const followerList = followers.slice(0, PAGE_SIZE).map((f) => ({
    id: f.follower.id,
    username: f.follower.username,
    displayName: f.follower.displayName,
    avatarUrl: f.follower.avatarUrl,
    bio: f.follower.bio,
    followers: f.follower._count.followers,
    isFollowedByUser: f.follower.followers.length > 0,
  }));

  res.json({
    followerList,
    nextCursor,
  });
};

export const getFollowing = async (req: Request, res: Response) => {
    const { userId } = req.params as Record<string, string>;
  const loggedInUser = req.user!;
  const cursor = req.query.cursor as string | undefined;
  const PAGE_SIZE = 10;

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          followers: {
            where: { followerId: loggedInUser.id },
            select: { followerId: true },
          },
          _count: {
            select: {
              followers: true,
            },
          },
        },
      },
    },
    take: PAGE_SIZE + 1,
    cursor: cursor ? { followerId_followingId: { followerId: userId, followingId: cursor } } : undefined,
  });

  const nextCursor = following.length > PAGE_SIZE ? following[PAGE_SIZE].followingId : null;
  
  const followingList = following.slice(0, PAGE_SIZE).map((f) => ({
    id: f.following.id,
    username: f.following.username,
    displayName: f.following.displayName,
    avatarUrl: f.following.avatarUrl,
    bio: f.following.bio,
    followers: f.following._count.followers,
    isFollowedByUser: f.following.followers.length > 0,
  }));

  res.json({
    followingList,
    nextCursor,
  });
};
