"use client";

import { BookmarkInfo, PostData } from "@/lib/types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  post: PostData;
}

export default function BookmarkButton({ post }: BookmarkButtonProps) {
  const queryClient = useQueryClient();

  const isBookmarked = post.bookmarks.length > 0;

  const mutation = useMutation({
    mutationFn: () =>
      fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" }).then((res) => {
        if (!res.ok) throw new Error("Failed to toggle bookmark");
        return res.json() as Promise<BookmarkInfo>;
      }),
    onMutate: async () => {
      // Optimistically update all feeds containing this post
      const queryFilters = [{ queryKey: ["post-feed"] }, { queryKey: ["bookmarks-feed"] }];
      
      for (const queryFilter of queryFilters) {
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
                    bookmarks: isBookmarked ? [] : [{ userId: "optimistic" }],
                  };
                }),
              })),
            };
          });
      }
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["post-feed"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks-feed"] });
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
        isBookmarked
          ? "text-primary"
          : "text-muted-foreground hover:text-primary"
      )}
    >
      <Bookmark
        className={cn("size-[18px]", isBookmarked && "fill-primary")}
      />
    </button>
  );
}
