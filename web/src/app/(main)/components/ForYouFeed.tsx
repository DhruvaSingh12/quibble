"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton, { PostLoadingSkeleton } from "@/components/posts/PostLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";

export default function ForYouFeed() {
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["post-feed", "for-you"],
    queryFn: ({ pageParam }) => kyInstance.get("posts/for-you", pageParam ? { searchParams: { cursor: pageParam } } : {}).json<PostsPage>(),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });

  const posts = data?.pages.flatMap(page => page.posts) || [];

  if (status === "pending") return (<PostsLoadingSkeleton />);
  if (status === "success" && !posts.length && !hasNextPage) return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <SearchX className="h-16 w-16 text-muted-foreground/40 mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">No posts found</h3>
      <p className="text-muted-foreground">No one has posted anything yet.</p>
    </div>
  );
  if (status === "error") return (<p className="text-center text-destructive">An error occured while loading the posts.</p>);

  return (
    <InfiniteScrollContainer
      onButtonReached={() => hasNextPage && !isFetching && fetchNextPage()}
      className="space-y-0">
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <PostLoadingSkeleton />}
    </InfiniteScrollContainer>
  );
}