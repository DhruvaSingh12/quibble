import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { BookmarkInfo } from "@/lib/types";

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

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId: user.id, postId },
      },
    });

    if (existingBookmark) {
      // Unbookmark
      await prisma.bookmark.delete({
        where: { id: existingBookmark.id },
      });
    } else {
      // Bookmark
      await prisma.bookmark.create({
        data: { userId: user.id, postId },
      });
    }

    const userBookmark = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });

    const data: BookmarkInfo = {
      isBookmarkedByUser: !!userBookmark,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
