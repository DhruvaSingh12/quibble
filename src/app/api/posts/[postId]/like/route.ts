import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { ReactionInfo } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: { userId: user.id, postId },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
    } else {
      // Like + remove dislike if exists
      await prisma.$transaction([
        prisma.like.create({
          data: { userId: user.id, postId },
        }),
        prisma.dislike.deleteMany({
          where: { userId: user.id, postId },
        }),
      ]);
    }

    const [likeCount, dislikeCount, userLike, userDislike] = await Promise.all([
      prisma.like.count({ where: { postId } }),
      prisma.dislike.count({ where: { postId } }),
      prisma.like.findUnique({
        where: { userId_postId: { userId: user.id, postId } },
      }),
      prisma.dislike.findUnique({
        where: { userId_postId: { userId: user.id, postId } },
      }),
    ]);

    const data: ReactionInfo = {
      likes: likeCount,
      dislikes: dislikeCount,
      isLikedByUser: !!userLike,
      isDislikedByUser: !!userDislike,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
