import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import UserAvatar from "./UserAvatar";
import { formatNumber } from "@/lib/utils";
import FollowButton from "./follow/FollowButton";
import UserTooltip from "./UserTooltip";
import { cookies } from "next/headers";
import { UserData } from "@/lib/types";

interface TrendsSidebarProps {
  className?: string;
}

export default function TrendsSidebar({ className }: TrendsSidebarProps) {
  return (
    <div className={className}>
      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <WhoToFollow />
        <TrendingTopics />
      </Suspense>
    </div>
  )
}

const getWhoToFollow = async (): Promise<UserData[]> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/who-to-follow`, {
      headers: {
        "Cookie": `session=${sessionCookie}`
      },
      next: { revalidate: 900 } // 15 minutes
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
};

async function WhoToFollow() {
  const usersToFollow = await getWhoToFollow();

  if (!usersToFollow.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-4">
      <div className="text-xl font-semibold mb-2">Who to follow</div>
      <div className="space-y-4">
        {usersToFollow.map((user) => (
          <div key={user.id} className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <UserTooltip user={user}>
              <Link
                href={`/users/${user.username}`}
                className="flex items-center gap-3"
              >
                <UserAvatar avatarUrl={user.avatarUrl} className="flex-none" />
                <div>
                  <p className="line-clamp-1 break-all font-semibold hover:underline">
                    {user.displayName}
                  </p>
                  <p className="line-clamp-1 break-all text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </Link>
            </UserTooltip>
            <FollowButton
              userId={user.id}
              initialState={{
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                followers: user._count.followers,
                isFollowedByUser: user.followers.some(
                  (f: any) => f.followerId === user.id,
                ),
                bio: user.bio,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const getTrendingTopics = async (): Promise<{ hashtag: string; count: number }[]> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/posts/trending-topics`, {
      headers: {
        "Cookie": `session=${sessionCookie}`
      },
      next: { revalidate: 3600 } // 1 hour
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
};

async function TrendingTopics() {
  const trendingTopics = await getTrendingTopics();
  if (!trendingTopics.length) return null;

  return <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
    <h2 className="text-xl font-semibold mb-4">Trending Topics</h2>
    <div className="space-y-4">
      {trendingTopics.map(({ hashtag, count }) => {
        return (
          <Link key={hashtag} href={`/hashtag/${hashtag}`} className="flex flex-row justify-between hover:opacity-80 transition-opacity">
            <p className="line-clamp-1 break-all font-semibold hover:underline" title={`#${hashtag}`}>{`#${hashtag}`}</p>
            <p className="line-clamp-1 break-all text-muted-foreground">{formatNumber(count)} {count === 1 ? "post" : "posts"}</p>
          </Link>
        )
      })}
    </div>
  </div>
}