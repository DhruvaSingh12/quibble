"use client";

import kyInstance from "@/lib/ky";
import { PostData, ReactionInfo } from "@/lib/types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  post: PostData;
}

export default function LikeButton({ post }: LikeButtonProps) {
  const queryClient = useQueryClient();

  const isLiked = post.likes.length > 0;
  const likeCount = post._count.likes;

  const mutation = useMutation({
    mutationFn: () =>
      kyInstance.post(`posts/${post.id}/like`).json<ReactionInfo>(),
    onMutate: async () => {
      const queryFilter = { queryKey: ["post-feed"] };
      await queryClient.cancelQueries(queryFilter);
      await queryClient.cancelQueries({ queryKey: ["post-data", post.id] });

      queryClient.setQueriesData<{
        pages: { posts: PostData[]; nextCursor: string | null }[];
        pageParams: unknown[];
      }>(queryFilter, (oldData) => {
        if (!oldData) return oldData;
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => ({
            nextCursor: page.nextCursor,
            posts: page.posts.map((p) => {
              if (p.id !== post.id) return p;
              return {
                ...p,
                likes: isLiked ? [] : [{ userId: "optimistic" }],
                dislikes: isLiked ? p.dislikes : [],
                _count: {
                  ...p._count,
                  likes: isLiked ? p._count.likes - 1 : p._count.likes + 1,
                  dislikes:
                    !isLiked && p.dislikes.length > 0
                      ? p._count.dislikes - 1
                      : p._count.dislikes,
                },
              };
            }),
          })),
        };
      });

      // Optimistically update single post page
      queryClient.setQueryData<PostData>(["post-data", post.id], (oldData?: PostData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          likes: isLiked ? [] : [{ userId: "optimistic" }],
          dislikes: isLiked ? oldData.dislikes : [],
          _count: {
            ...oldData._count,
            likes: isLiked ? oldData._count.likes - 1 : oldData._count.likes + 1,
            dislikes:
              !isLiked && oldData.dislikes.length > 0
                ? oldData._count.dislikes - 1
                : oldData._count.dislikes,
          },
        };
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["post-feed"] });
      queryClient.invalidateQueries({ queryKey: ["post-data", post.id] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-data", post.id] });
    },
  });

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors cursor-pointer",
        isLiked
          ? "text-primary"
          : "text-muted-foreground hover:text-primary"
      )}
    >
      <ThumbsUp
        className={cn("size-[18px]", isLiked && "fill-primary")}
      />
      <span className="tabular-nums text-[13px]">{likeCount}</span>
    </button>
  );
}
