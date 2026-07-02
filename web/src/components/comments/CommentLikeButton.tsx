"use client";

import kyInstance from "@/lib/ky";
import { CommentData, CommentReactionInfo } from "@/lib/types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentLikeButtonProps {
  comment: CommentData;
}

export default function CommentLikeButton({ comment }: CommentLikeButtonProps) {
  const queryClient = useQueryClient();

  const isLiked = (comment.commentLikes?.length || 0) > 0;
  const likeCount = comment._count?.commentLikes || 0;

  const mutation = useMutation({
    mutationFn: () =>
      kyInstance.post(`comments/${comment.id}/like`).json<CommentReactionInfo>(),
    onMutate: async () => {
      // Invalidate specific comment queries if we know them, but for now we invalidate the general post feed
      // since comments are often fetched within post-comments or nested replies.
      const queryFilter = { queryKey: ["comments"] };
      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueriesData<{
        pages: { comments: CommentData[]; nextCursor: string | null }[];
        pageParams: unknown[];
      }>(queryFilter, (oldData) => {
        if (!oldData) return oldData;
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => ({
            nextCursor: page.nextCursor,
            comments: page.comments.map((c) => {
              if (c.id !== comment.id) return c;
              return {
                ...c,
                commentLikes: isLiked ? [] : [{ userId: "optimistic" }],
                _count: {
                  ...c._count,
                  commentLikes: isLiked 
                    ? Math.max(0, (c._count?.commentLikes || 1) - 1) 
                    : (c._count?.commentLikes || 0) + 1,
                },
              };
            }),
          })),
        };
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
      className={cn(
        "flex items-center gap-1.5 text-xs font-semibold transition-colors",
        isLiked
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Heart
        className={cn("size-3.5", isLiked && "fill-foreground")}
      />
      {likeCount > 0 && <span className="tabular-nums text-[11px]">{likeCount}</span>}
    </button>
  );
}
