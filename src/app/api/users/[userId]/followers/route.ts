import { NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
    req: Request,
    { params: { userId } }: { params: { userId: string } }
) {
    try {
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

        const followerList = user.followers.map((f, index) => ({
            index: index + 1,
            id: f.follower.id,
            username: f.follower.username,
            displayName: f.follower.displayName,
            avatarUrl: f.follower.avatarUrl,
            bio: f.follower.bio,
            joined: f.follower.createdAt,
        }));

        const data = {
            followers: user._count.followers,
            isFollowedByUser: !!user.followers.find(
                (f) => f.follower.id === loggedInUser.id
            ),
            followerList,
        };

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error fetching followers:", error.stack || error.message);
        } else {
            console.error("Error fetching followers:", error);
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: Request,
    { params: { userId } }: { params: { userId: string } },
  ) {
    try {
      const { user: loggedInUser } = await validateRequest();
  
      if (!loggedInUser) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      await prisma.$transaction([
        prisma.follow.upsert({
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
        }),
      ]);
  
      return new Response();
    } catch (error) {
      console.error(error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }
  
  export async function DELETE(
    req: Request,
    { params: { userId } }: { params: { userId: string } },
  ) {
    try {
      const { user: loggedInUser } = await validateRequest();
  
      if (!loggedInUser) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      await prisma.$transaction([
        prisma.follow.deleteMany({
          where: {
            followerId: loggedInUser.id,
            followingId: userId,
          },
        }),
      ]);
  
      return new Response();
    } catch (error) {
      console.error(error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }
