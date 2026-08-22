import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { FollowerPage } from "@/lib/types";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import BounceLoader from "@/components/BounceLoader";
import UserAvatar from "@/components/UserAvatar";
import FollowButton from "./FollowButton";
import Link from "next/link";
import { useSession } from "@/providers/SessionProvider";

interface FollowerListProps {
  userId: string;
  onClose: () => void;
}

export default function FollowerList({ userId, onClose }: FollowerListProps) {
  const { user: currentUser } = useSession();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ["followers", userId],
    queryFn: async ({ pageParam }) => {
      const searchParams = pageParam ? `?cursor=${pageParam}` : "";
      const result = await kyInstance.get(`users/${userId}/followers${searchParams}`).json<FollowerPage>();
      return result;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  const followers = data?.pages.flatMap(page => page.followerList) || [];

  if (status === "pending") {
    return <BounceLoader className="min-h-50" />;
  }

  if (status === "error") {
    return <p className="p-4 text-center text-destructive">Error loading followers</p>;
  }

  if (followers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <h3 className="mb-2 text-lg font-medium text-card-foreground">
          No followers yet
        </h3>
        <p className="text-center text-sm text-muted-foreground">
          When people follow this account, you&apos;ll see them here.
        </p>
      </div>
    );
  }

  return (
    <InfiniteScrollContainer
      className="flex flex-col gap-1 pb-4"
      onButtonReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      <ul>
        {followers.map((follower) => {
          const isCurrentUser = currentUser.id === follower.id;

          return (
            <li
              key={follower.id}
              className="px-5 py-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-1 md:gap-2">
                <Link
                  href={`/users/${follower.username}`}
                  className="shrink-0"
                  onClick={onClose}
                >
                  <UserAvatar
                    avatarUrl={follower.avatarUrl}
                    size={500}
                    className="h-10 w-10 rounded-full ring-2 ring-primary/10 transition-all hover:ring-primary/20"
                  />
                </Link>

                <div className="min-w-0 ml-2 flex-1">
                  <Link
                    href={`/users/${follower.username}`}
                    className="block"
                    onClick={onClose}
                  >
                    <div className="truncate font-semibold text-card-foreground hover:underline">
                      {follower.displayName}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      @{follower.username}
                    </div>
                  </Link>
                </div>

                {!isCurrentUser && (
                  <div className="shrink-0">
                    <FollowButton
                      userId={follower.id}
                      initialState={{
                        id: follower.id,
                        username: follower.username,
                        displayName: follower.displayName,
                        avatarUrl: follower.avatarUrl,
                        bio: follower.bio,
                        followers: follower.followers,
                        isFollowedByUser: follower.isFollowedByUser,
                      }}
                    />
                  </div>
                )}

                {isCurrentUser && (
                  <div className="shrink-0">
                    <span className="rounded-full bg-muted px-3 py-2 text-base font-medium text-muted-foreground">
                      You
                    </span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {isFetchingNextPage && <BounceLoader className="min-h-25" />}
    </InfiniteScrollContainer>
  );
}