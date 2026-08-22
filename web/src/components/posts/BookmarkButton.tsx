"use client";

import kyInstance from "@/lib/ky";
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
      kyInstance.post(`posts/${post.id}/bookmark`).json<BookmarkInfo>(),
    onMutate: async () => {
      // Optimistically update all feeds containing this post
      const queryFilters = [{ queryKey: ["post-feed"] }, { queryKey: ["bookmarks-feed"] }];
      
      await queryClient.cancelQueries({ queryKey: ["post-data", post.id] });
      
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

      // Optimistically update single post page
      queryClient.setQueryData<PostData>(["post-data", post.id], (oldData?: PostData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          bookmarks: isBookmarked ? [] : [{ userId: "optimistic" }],
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
        isBookmarked
          ? "text-primary"
          : "text-muted-foreground hover:text-primary"
      )}
    >
      <Bookmark
        className={cn("size-4.5", isBookmarked && "fill-primary")}
      />
    </button>
  );
}
