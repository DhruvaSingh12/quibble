import { validateRequest } from "@/auth";
import FollowButton from "@/components/follow/FollowButton";
import FollowerCount from "@/components/follow/FollowerCount";
import UserAvatar from "@/components/UserAvatar";
import { FollowerInfo, UserData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import UserPosts from "./components/UserPosts";
import Linkify from "@/components/Linkify";
import EditProfileButton from "./components/EditProfileButton";
import MessageButton from "./components/MessageButton";
import FollowingCount from "@/components/follow/FollowingCount";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";
import { cookies } from "next/headers";

interface PageProps {
  params: Promise<{ username: string }>;
}

const getUser = cache(async (username: string) => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${username}`, {
    headers: sessionId ? { Cookie: `session=${sessionId}` } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) notFound();
    throw new Error("Failed to fetch user");
  }

  return res.json() as Promise<UserData>;
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;

  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) return {};

  const user = await getUser(username);

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

  const user = await getUser(username);

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
  user: Awaited<ReturnType<typeof getUser>>;
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
      (f: any) => f.followerId === loggedInUserId,
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
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col cursor-default w-fit">
                <h1 className="text-2xl sm:text-3xl font-bold">{user.displayName}</h1>
                <div className="text-muted-foreground">@{user.username}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Joined {formatDate(user.createdAt, "do MMM yyyy")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="shrink-0 flex items-center gap-2">
          {user.id === loggedInUserId ? (
            <EditProfileButton user={user} />
          ) : (
            <>
              <MessageButton userId={user.id} />
              <FollowButton userId={user.id} initialState={followerInfo} />
            </>
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
            <div className="overflow-hidden whitespace-pre-line wrap-break-word text-foreground">
              {user.bio}
            </div>
          </Linkify>
        </div>
      )}
    </div>
  );
}