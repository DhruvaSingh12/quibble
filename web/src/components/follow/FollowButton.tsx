"use client";

import useFollowerInfo from "@/hooks/useFollowerInfo";
import kyInstance from "@/lib/ky";
import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
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
    mutationFn: () => kyInstance.post(`users/${userId}/follow`),
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
    <button
      onClick={() => mutate()}
      className="text-foreground hover:opacity-80 transition-opacity flex items-center justify-center bg-transparent border-none p-0 cursor-pointer"
    >
      {data?.isFollowedByUser ? (
        <FaCircleMinus className="w-7 h-7" aria-label="Unfollow" />
      ) : (
        <FaCirclePlus className="w-7 h-7" aria-label="Follow" />
      )}
    </button>
  );
}