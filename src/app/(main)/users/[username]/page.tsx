import { validateRequest } from "@/auth";
import FollowButton from "@/components/follow/FollowButton";
import FollowerCount from "@/components/follow/FollowerCount";
import UserAvatar from "@/components/UserAvatar";
import prisma from "@/lib/prisma";
import { FollowerInfo, getUserDataSelect, UserData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import UserPosts from "./components/UserPosts";
import Linkify from "@/components/Linkify";
import EditProfileButton from "./components/EditProfileButton";
import FollowingCount from "@/components/follow/FollowingCount";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";

interface PageProps {
  params: Promise<{ username: string }>;
}

const getUser = cache(async (username: string, loggedInUserId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: getUserDataSelect(loggedInUserId),
  });

  if (!user) notFound();

  return user;
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;

  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) return {};

  const user = await getUser(username, loggedInUser.id);

  return {
    title: `${user.displayName} (@${user.username})`,
  };
}

export default async function Page({ params }: PageProps) {
  const { username } = await params;

  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const user = await getUser(username, loggedInUser.id);

  return (
    <main className="w-full mt-[3px] lg:mt-[8px] flex-col rounded-lg p-4 items-center justify-center space-y-4">
      <div className="w-full min-w-0 space-y-4 px-2">
        <UserProfile user={user} loggedInUserId={loggedInUser.id} />
        <UserPosts userId={user.id} />
      </div>
    </main>
  );
}

interface UserProfileProps {
  user: UserData;
  loggedInUserId: string;
}

async function UserProfile({ user, loggedInUserId }: UserProfileProps) {
  const userInfo: FollowerInfo = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    followers: user._count.followers,
    isFollowedByUser: user.followers.some(
      ({ followerId }) => followerId === loggedInUserId,
    ),
    bio: user.bio,
  };

  const followerInfo = {
    ...userInfo,
    followers: user._count.followers,
  };

  return (
    <div className="h-fit w-full pb-6 border-b border-border flex flex-col gap-4">
      {/* Avatar */}
      <div className="w-full">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          size={500}
          className="h-28 w-28 sm:h-36 sm:w-36 rounded-full"
        />
      </div>

      {/* Header Row: Name & Button */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-bold">{user.displayName}</h1>
          <div className="text-muted-foreground">@{user.username}</div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-2">
                  <Info className="h-5 w-5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Joined {formatDate(user.createdAt, "do MMM yyyy")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {user.id === loggedInUserId ? (
            <EditProfileButton user={user} />
          ) : (
            <FollowButton userId={user.id} initialState={followerInfo} />
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-transparent px-3 text-sm font-medium shadow-sm transition-colors cursor-default">
          <span className="flex items-center gap-2">
            <span className="font-semibold">{formatNumber(user._count.posts)}</span>
            <span>{user._count.posts === 1 ? "Post" : "Posts"}</span>
          </span>
        </div>
        <FollowerCount userId={user.id} initialState={followerInfo} />
        <FollowingCount userId={user.id} initialState={{ following: user._count.following }} />
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="pt-2">
          <hr className="mb-4 border-border" />
          <Linkify>
            <div className="overflow-hidden whitespace-pre-line break-words text-foreground">
              {user.bio}
            </div>
          </Linkify>
        </div>
      )}
    </div>
  );
}
