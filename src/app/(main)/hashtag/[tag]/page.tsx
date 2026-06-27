"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getPostsByHashtag } from "./actions";
import Post from "@/components/posts/Post";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import PostsLoadingSkeleton, { PostLoadingSkeleton } from "@/components/posts/PostLoadingSkeleton";
import { SearchX } from "lucide-react";

export default function HashtagPage() {
    const params = useParams();
    const hashtag = params.tag as string;

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey: ["post-feed", "hashtag", hashtag],
        queryFn: async ({ pageParam }) => {
            const response = await getPostsByHashtag(hashtag, pageParam);
            if (!response) throw new Error("No posts found");
            return response;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
        staleTime: 1000 * 60, // 1 minute
        retry: false,
        refetchOnMount: true,
        refetchOnWindowFocus: false
    });

    const posts = data?.pages.flatMap(page => page.posts) || [];

    return (
        <div className="w-full mt-[3px] lg:mt-[8px] flex flex-col rounded-lg p-4 items-center justify-center space-y-4">
            <div className="w-full border-b border-border pb-4">
                <h1 className="text-3xl font-bold">#{hashtag}</h1>
                <p className="text-muted-foreground mt-2">
                    {posts.length > 0 ? `${posts.length} posts found` : 'Loading...'}
                </p>
            </div>

            {status === "pending" ? (
                <PostsLoadingSkeleton />
            ) : status === "error" ? (
                <div className="p-6 text-center w-full">
                    <p className="text-red-500">Error loading posts</p>
                    <p className="text-muted-foreground mt-2">
                        Something went wrong
                    </p>
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center w-full">
                    <SearchX className="h-16 w-16 text-muted-foreground/40 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No posts found</h3>
                    <p className="text-muted-foreground">No posts found with #{hashtag}</p>
                </div>
            ) : (
                <div className="w-full">
                    <InfiniteScrollContainer
                        onButtonReached={() => hasNextPage && !isFetching && fetchNextPage()}
                        className="space-y-0"
                    >
                        <div className="w-full">
                            {posts.map(post => (
                                <Post key={post.id} post={post} />
                            ))}
                            {isFetchingNextPage && <PostLoadingSkeleton />}
                        </div>
                    </InfiniteScrollContainer>
                </div>
            )}
        </div>
    );
}
