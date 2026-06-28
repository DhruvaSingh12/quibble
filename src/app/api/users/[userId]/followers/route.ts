import { NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { user: loggedInUser } = await validateRequest();
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    const follows = await prisma.follow.findMany({
      where: { followingId: userId },
      select: {
        follower: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
            followers: {
              where: {
                followerId: loggedInUser.id,
              },
              select: {
                followerId: true,
              },
            },
            _count: {
              select: {
                followers: true,
              },
            },
          },
        },
      },
      take: pageSize + 1,
      cursor: cursor ? { followerId_followingId: { followerId: cursor, followingId: userId } } : undefined,
      orderBy: { followerId: 'asc' },
    });

    const nextCursor = follows.length > pageSize ? follows[pageSize].follower.id : null;

    const data = {
      followerList: follows.slice(0, pageSize).map((f) => ({
        id: f.follower.id,
        username: f.follower.username,
        displayName: f.follower.displayName,
        avatarUrl: f.follower.avatarUrl,
        bio: f.follower.bio,
        joined: f.follower.createdAt,
        isFollowedByUser: f.follower.followers.length > 0,
        followers: f.follower._count.followers,
      })),
      nextCursor,
    };

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const { user: loggedInUser } = await validateRequest();
  if (!loggedInUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: loggedInUser.id,
        followingId: userId,
      },
    },
    create: {
      followerId: loggedInUser.id,
      followingId: userId,
    },
    update: {},
  });

  return NextResponse.json({ message: "Followed successfully" }, { status: 200 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const { user: loggedInUser } = await validateRequest();
  if (!loggedInUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: loggedInUser.id,
      followingId: userId,
    },
  });

  return NextResponse.json({ message: "Unfollowed successfully" }, { status: 200 });
}
