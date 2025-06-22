import { NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

// Context.params is a Promise per Next.js generated types
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Await the params promise to extract userId
  const { userId } = await params;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const { user: loggedInUser } = await validateRequest();
  if (!loggedInUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      followers: {
        select: {
          follower: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatarUrl: true,
              bio: true,
              createdAt: true,
            },
          },
        },
      },
      _count: { select: { followers: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const followerList = user.followers.map((f) => ({
    id: f.follower.id,
    username: f.follower.username,
    displayName: f.follower.displayName,
    avatarUrl: f.follower.avatarUrl,
    bio: f.follower.bio,
    joined: f.follower.createdAt,
  }));

  const data = {
    followers: user._count.followers,
    isFollowedByUser: user.followers.some(
      (f) => f.follower.id === loggedInUser.id
    ),
    followerList,
  };

  return NextResponse.json(data, { status: 200 });
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
