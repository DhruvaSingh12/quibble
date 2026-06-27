import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getCommentDataInclude, CommentsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      include: getCommentDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = comments.length > pageSize ? comments[pageSize].id : null;

    const data: CommentsPage = {
      comments: comments.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const { content, parentId, gifUrl } = await req.json();

    const hasContent = content && typeof content === "string" && content.trim().length > 0;
    const hasGif = gifUrl && typeof gifUrl === "string";

    if (!hasContent && !hasGif) {
      return Response.json({ error: "Content or GIF is required" }, { status: 400 });
    }

    // If replying, verify the parent comment exists and belongs to the same post
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment || parentComment.postId !== postId) {
        return Response.json({ error: "Invalid parent comment" }, { status: 400 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: hasContent ? content.trim() : "",
        gifUrl: hasGif ? gifUrl : null,
        userId: user.id,
        postId,
        parentId: parentId || null,
      },
      include: getCommentDataInclude(user.id),
    });

    return Response.json(comment);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
