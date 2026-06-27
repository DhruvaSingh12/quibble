"use client";

import { PostData, ReactionInfo } from "@/lib/types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DislikeButtonProps {
  post: PostData;
}

export default function DislikeButton({ post }: DislikeButtonProps) {
  const queryClient = useQueryClient();

  const isDisliked = post.dislikes.length > 0;
  const dislikeCount = post._count.dislikes;

  const mutation = useMutation({
    mutationFn: () =>
      fetch(`/api/posts/${post.id}/dislike`, { method: "POST" }).then(
        (res) => {
          if (!res.ok) throw new Error("Failed to toggle dislike");
          return res.json() as Promise<ReactionInfo>;
        }
      ),
    onMutate: async () => {
      const queryFilter = { queryKey: ["post-feed"] };
      await queryClient.cancelQueries(queryFilter);

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
                dislikes: isDisliked ? [] : [{ userId: "optimistic" }],
                likes: isDisliked ? p.likes : [],
                _count: {
                  ...p._count,
                  dislikes: isDisliked
                    ? p._count.dislikes - 1
                    : p._count.dislikes + 1,
                  likes:
                    !isDisliked && p.likes.length > 0
                      ? p._count.likes - 1
                      : p._count.likes,
                },
              };
            }),
          })),
        };
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["post-feed"] });
    },
  });

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors",
        isDisliked
          ? "text-destructive"
          : "text-muted-foreground hover:text-destructive"
      )}
    >
      <ThumbsDown
        className={cn("size-[18px]", isDisliked && "fill-destructive")}
      />
      <span className="tabular-nums text-[13px]">{dislikeCount}</span>
    </button>
  );
}
