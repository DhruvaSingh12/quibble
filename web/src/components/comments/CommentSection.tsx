"use client";

import { CommentsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import CommentInput from "./CommentInput";
import kyInstance from "@/lib/ky";
import CommentItem from "./CommentItem";
import { Loader2 } from "lucide-react";

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
}

export default function CommentSection({
  postId,
  postAuthorId,
}: CommentSectionProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: async ({ pageParam }) => {
      const searchParams = pageParam ? { cursor: pageParam } : undefined;
      return kyInstance.get(`posts/${postId}/comments`, { searchParams }).json<CommentsPage>();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];

  return (
    <div className="p-3 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold">
          {comments.length > 0
            ? `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`
            : "Comments"}
        </h3>
      </div>

      {/* Input */}
      <div className="mb-6">
        <CommentInput postId={postId} />
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-0">
          {(() => {
            const seenIds = new Set<string>();
            return comments
              .filter((comment) => {
                if (!comment.id || seenIds.has(comment.id)) return false;
                seenIds.add(comment.id);
                return true;
              })
              .map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={postId}
                  postAuthorId={postAuthorId}
                  depth={0}
                />
              ));
          })()}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-muted"
          >
            {isFetchingNextPage ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : null}
            Load more comments
          </button>
        </div>
      )}
    </div>
  );
}
