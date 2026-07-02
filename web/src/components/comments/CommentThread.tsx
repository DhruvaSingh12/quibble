"use client";

import { CommentsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import CommentItem from "./CommentItem";
import { Loader2 } from "lucide-react";

interface CommentThreadProps {
  postId: string;
  parentId: string;
  postAuthorId: string;
  depth: number;
}

export default function CommentThread({
  postId,
  parentId,
  postAuthorId,
  depth,
}: CommentThreadProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["replies", parentId],
    queryFn: async ({ pageParam }) => {
      const searchParams = pageParam ? { cursor: pageParam } : undefined;
      return kyInstance.get(`posts/${postId}/comments/${parentId}/replies`, { searchParams }).json<CommentsPage>();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const replies = data?.pages.flatMap((page) => page.comments) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-2 ml-8">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {(() => {
        const seenIds = new Set<string>();
        return replies
          .filter((reply) => {
            if (!reply.id || seenIds.has(reply.id)) return false;
            seenIds.add(reply.id);
            return true;
          })
          .map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              postAuthorId={postAuthorId}
              depth={depth}
            />
          ));
      })()}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="ml-8 text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 py-1"
        >
          {isFetchingNextPage ? (
            <Loader2 className="size-3 animate-spin" />
          ) : null}
          Load more replies
        </button>
      )}
    </div>
  );
}
