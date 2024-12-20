"use client";

import { FollowerInfo, UserData } from "@/lib/types";
import { useSession } from "@/providers/SessionProvider";
import { PropsWithChildren } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/Tooltip";
import Link from "next/link";
import UserAvatar from "./UserAvatar";
import FollowButton from "./FollowButton";
import Linkify from "./Linkify";
import FollowerCount from "./FollowerCount";

interface UserTooltipProps extends PropsWithChildren {
    user: UserData;
}

export default function UserTooltip({ user, children }: UserTooltipProps) {
    const { user: loggedInUser } = useSession();

    const followerState: FollowerInfo = {
        followers: user._count.followers,
        isFollowedByUser: !!user.followers.some(
            ({ followerId }) => followerId === loggedInUser.id
        )
    }


    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent>
                    <div className="flex max-w-80 flex-col gap-3 break-words px-1 py-2.5 md:min-w-52">
                        <div className="flex items-center justify-between gap-2">
                            <Link href={`/user/${user.username}`}>
                                <UserAvatar size={70} avatarUrl={user.avatarUrl} />
                            </Link>
                            {loggedInUser.id !== user.id && (
                                <FollowButton userId={user.id} initialState={followerState} />
                            )}
                        </div>
                        <div>
                            <Link href={`/user/${user.username}`}>
                                <div className="block text-lg font-semibold hover:underline">
                                    {user.displayName}
                                </div>
                            </Link>
                            <p className="text-sm text-muted-foreground">
                                @{user.username}
                            </p>
                        </div>
                        {user.bio && (
                            <Linkify>
                                <div className="line-clamp-4 whitespace-pre-line">
                                    {user.bio}
                                </div>
                            </Linkify>
                        )}
                        <FollowerCount userId={user.id} initialState={followerState} />
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}