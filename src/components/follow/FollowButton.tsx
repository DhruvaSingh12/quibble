"use client";

import useFollowerInfo from "@/hooks/useFollowerInfo";
import kyInstance from "@/lib/ky";
import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import { Button } from "../ui/Button";
import { FollowerInfo } from "@/lib/types";
import { FaCircleMinus, FaCirclePlus } from "react-icons/fa6";

interface FollowButtonProps {
  userId: string;
  initialState: FollowerInfo;
}

export default function FollowButton({
  userId,
  initialState,
}: FollowButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useFollowerInfo(userId, initialState);

  const queryKey: QueryKey = ["follower-info", userId];

  const { mutate } = useMutation({
    mutationFn: () =>
      data?.isFollowedByUser
        ? kyInstance.delete(`/api/users/${userId}/followers`)
        : kyInstance.post(`/api/users/${userId}/followers`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<FollowerInfo>(queryKey);

      if (!previousState) return { previousState };

      const newState = {
        ...previousState,
        followers: previousState.followers + (previousState.isFollowedByUser ? -1 : 1),
        isFollowedByUser: !previousState.isFollowedByUser,
      };

      // Update FollowButton state
      queryClient.setQueryData<FollowerInfo>(queryKey, newState);

      // Optimistically update post feeds where this user is the author
      const queryFilter = { queryKey: ["post-feed"] };
      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueriesData<any>(queryFilter, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) => {
              if (post.user.id !== userId) return post;
              return {
                ...post,
                user: {
                  ...post.user,
                  followers: newState.isFollowedByUser ? [{ followerId: "optimistic" }] : [],
                  _count: {
                    ...post.user._count,
                    followers: newState.followers,
                  },
                },
              };
            }),
          })),
        };
      });

      return { previousState };
    },
    onError: (error, _variables, context) => {
      if (context?.previousState) {
        queryClient.setQueryData(queryKey, context.previousState);
      }
      queryClient.invalidateQueries({ queryKey: ["post-feed"] });
      console.error(error);
      toast({
        variant: "destructive",
        description: "Something went wrong. Please try again.",
      });
    },
  });

  return (
    <Button
      variant="ghost"
      onClick={() => mutate()}
      className="rounded-full px-3 hover:bg-transparent hover:opacity-80 text-foreground p-0 min-h-0 h-auto"
    >
      {data?.isFollowedByUser ? (
        <FaCircleMinus className="w-7 h-7" aria-label="Unfollow" />
      ) : (
        <FaCirclePlus className="w-7 h-7" aria-label="Follow" />
      )}
    </Button>
  );
}