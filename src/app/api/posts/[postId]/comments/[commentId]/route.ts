import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: { select: { userId: true } },
        _count: { select: { replies: true } },
      },
    });

    if (!comment || comment.postId !== postId) {
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only comment author or post author can delete
    const isCommentAuthor = comment.userId === user.id;
    const isPostAuthor = comment.post.userId === user.id;

    if (!isCommentAuthor && !isPostAuthor) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (comment._count.replies > 0) {
      // Soft delete — comment has replies, keep the tree intact
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: "[deleted]",
          isDeleted: true,
        },
      });
    } else {
      // Hard delete — no replies, remove entirely
      await prisma.comment.delete({
        where: { id: commentId },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
