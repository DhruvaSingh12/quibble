"use client";

import useFollowerInfo from "@/hooks/useFollowerInfo";
import kyInstance from "@/lib/ky";
import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/Button";
import { UserMinus, UserPlus2Icon } from "lucide-react";
import { FollowerInfo } from "@/lib/types";

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

      queryClient.setQueryData<FollowerInfo>(queryKey, {
        ...previousState,
        followers: previousState.followers + (previousState.isFollowedByUser ? -1 : 1),
        isFollowedByUser: !previousState.isFollowedByUser,
      });

      return { previousState };
    },
    onError: (error, variables, context) => {
      if (context?.previousState) {
        queryClient.setQueryData(queryKey, context.previousState);
      }
      console.error(error);
      toast({
        variant: "destructive",
        description: "Something went wrong. Please try again.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <Button
      variant={data?.isFollowedByUser ? "secondary" : "default"}
      onClick={() => mutate()}
      className="p-4 rounded-full"
    >
      {data?.isFollowedByUser ? (
        <UserMinus className="w-5 h-5" aria-label="Unfollow" />
      ) : (
        <UserPlus2Icon className="w-5 h-5" aria-label="Follow" />
      )}
    </Button>
  );
}
