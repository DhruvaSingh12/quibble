"use client";

import { FollowerInfo, UserData } from "@/lib/types";
import { PropsWithChildren } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/Tooltip";
import Link from "next/link";
import UserAvatar from "./UserAvatar";
import Linkify from "./Linkify";
import { useSession } from "@/providers/SessionProvider";
import FollowButton from "./FollowButton";

interface UserTooltipProps extends PropsWithChildren {
  user: UserData;
}

export default function UserTooltip({ children, user }: UserTooltipProps) {
  const { user: loggedInUser } = useSession();

  if (!user) {
    return <div>Loading...</div>;
  }

  const followerList: FollowerInfo = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    followers: user._count?.followers ?? 0,
    isFollowedByUser: !!user.followers?.some(
      ({ followerId }) => followerId === loggedInUser.id,
    ),
    bio: user.bio,
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          role="tooltip"
          aria-label={`Details about ${user.displayName}`}
        >
          <div className="flex max-w-80 flex-col gap-3 break-words px-1 py-2.5 md:min-w-52">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/users/${user.username}`}>
                <UserAvatar size={70} avatarUrl={user.avatarUrl} />
              </Link>
              {loggedInUser.id !== user.id && (
                <FollowButton userId={user.id} initialState={followerList} />
              )}
            </div>
            <div>
              <Link href={`/users/${user.username}`}>
                <div className="block text-lg font-semibold hover:underline">
                  {user.displayName}
                </div>
              </Link>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
            {user.bio && (
              <Linkify>
                <div className="line-clamp-4 whitespace-pre-line">
                  {user.bio}
                </div>
              </Linkify>
            )}
            <div className="flex flex-row gap-1.5 text-sm text-muted-foreground">
              <span className="font-semibold">
                {user._count?.followers ?? 0}
              </span>
              <p>
                {(user._count?.followers ?? 0) === 1 ? "follower" : "followers"}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
