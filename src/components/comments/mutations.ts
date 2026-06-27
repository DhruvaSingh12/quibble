"use client";

import { CommentData, CommentsPage } from "@/lib/types";
import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

export function useCreateCommentMutation(postId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      content,
      parentId,
      gifUrl,
    }: {
      content: string;
      parentId?: string;
      gifUrl?: string;
    }) => {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId, gifUrl }),
      });
      if (!res.ok) throw new Error("Failed to create comment");
      return res.json() as Promise<CommentData>;
    },
    onSuccess: (newComment) => {
      if (!newComment.parentId) {
        // Top-level comment: prepend to the comments list
        queryClient.setQueriesData<InfiniteData<CommentsPage, string | null>>(
          { queryKey: ["comments", postId] },
          (oldData) => {
            if (!oldData) return oldData;
            const firstPage = oldData.pages[0];
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  comments: [newComment, ...firstPage.comments],
                  nextCursor: firstPage.nextCursor,
                },
                ...oldData.pages.slice(1),
              ],
            };
          }
        );
      } else {
        // Reply: invalidate the replies query for the parent
        queryClient.invalidateQueries({
          queryKey: ["replies", newComment.parentId],
        });
        // Also invalidate parent comment's reply count
        queryClient.invalidateQueries({
          queryKey: ["comments", postId],
        });
      }

      // Update post comment count in feed
      queryClient.invalidateQueries({ queryKey: ["post-feed"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCommentMutation(postId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(
        `/api/posts/${postId}/comments/${commentId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
      queryClient.invalidateQueries({ queryKey: ["post-feed"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    },
  });
}
