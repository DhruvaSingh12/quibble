"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton, { PostLoadingSkeleton } from "@/components/posts/PostLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { useSession } from "@/providers/SessionProvider";

export default function ByYouFeed() {
  const { user } = useSession();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "by-you"],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          `posts/user/${user.id}`,
          pageParam ? { searchParams: { cursor: pageParam } } : {},
        )
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !posts.length && !hasNextPage) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <PenLine className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No posts created</h3>
        <p className="text-muted-foreground">Write your first post to see it here.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading your posts.
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-0"
      onButtonReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <PostLoadingSkeleton />}
    </InfiniteScrollContainer>
  );
}
