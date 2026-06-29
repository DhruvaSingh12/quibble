import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { FollowingPage } from "@/lib/types";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import BounceLoader from "@/components/BounceLoader";
import UserAvatar from "@/components/UserAvatar";
import FollowButton from "./FollowButton";
import Link from "next/link";
import { useSession } from "@/providers/SessionProvider";

interface FollowingListProps {
  userId: string;
  onClose: () => void;
}

export default function FollowingList({ userId, onClose }: FollowingListProps) {
  const { user: currentUser } = useSession();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ["following", userId],
    queryFn: async ({ pageParam }) => {
      const searchParams = pageParam ? `?cursor=${pageParam}` : "";
      const result = await kyInstance.get(`/api/users/${userId}/following${searchParams}`).json<FollowingPage>();
      return result;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  const following = data?.pages.flatMap(page => page.followingList) || [];

  if (status === "pending") {
    return <BounceLoader className="min-h-[200px]" />;
  }

  if (status === "error") {
    return <p className="p-4 text-center text-destructive">Error loading following</p>;
  }

  if (following.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <h3 className="mb-2 text-lg font-medium text-card-foreground">
          Not following anyone
        </h3>
        <p className="text-center text-sm text-muted-foreground">
          When this account follows people, you&apos;ll see them here.
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
        {following.map((followedUser) => {
          const isCurrentUser = currentUser.id === followedUser.id;

          return (
            <li
              key={followedUser.id}
              className="px-5 py-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-1 md:gap-2">
                <Link
                  href={`/users/${followedUser.username}`}
                  className="flex-shrink-0"
                  onClick={onClose}
                >
                  <UserAvatar
                    avatarUrl={followedUser.avatarUrl}
                    size={500}
                    className="h-10 w-10 rounded-full ring-2 ring-primary/10 transition-all hover:ring-primary/20"
                  />
                </Link>

                <div className="min-w-0 ml-2 flex-1">
                  <Link
                    href={`/users/${followedUser.username}`}
                    className="block"
                    onClick={onClose}
                  >
                    <div className="truncate font-semibold text-card-foreground hover:underline">
                      {followedUser.displayName}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      @{followedUser.username}
                    </div>
                  </Link>

                </div>

                {!isCurrentUser && (
                  <div className="flex-shrink-0">
                    <FollowButton
                      userId={followedUser.id}
                      initialState={{
                        id: followedUser.id,
                        username: followedUser.username,
                        displayName: followedUser.displayName,
                        avatarUrl: followedUser.avatarUrl,
                        bio: followedUser.bio,
                        followers: followedUser.followers,
                        isFollowedByUser: followedUser.isFollowedByUser,
                      }}
                    />
                  </div>
                )}

                {isCurrentUser && (
                  <div className="flex-shrink-0">
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
      {isFetchingNextPage && <BounceLoader className="min-h-[100px]" />}
    </InfiniteScrollContainer>
  );
}