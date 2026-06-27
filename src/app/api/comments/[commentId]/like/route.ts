import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        userId: true,
      },
    });

    if (!comment) {
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }

    const like = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: loggedInUser.id,
          commentId,
        },
      },
    });

    if (like) {
      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId: loggedInUser.id,
            commentId,
          },
        },
      });

      return Response.json({
        likes: await prisma.commentLike.count({ where: { commentId } }),
        isLikedByUser: false,
      });
    } else {
      await prisma.commentLike.create({
        data: {
          userId: loggedInUser.id,
          commentId,
        },
      });

      return Response.json({
        likes: await prisma.commentLike.count({ where: { commentId } }),
        isLikedByUser: true,
      });
    }
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
