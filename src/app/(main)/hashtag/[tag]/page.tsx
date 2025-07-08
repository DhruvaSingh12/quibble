"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getPostsByHashtag } from "./actions";
import Post from "@/components/posts/Post";
import { PostData } from "@/lib/types";
import { Skeleton } from "@/components/ui/Skeleton";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";

export default function HashtagPage() {
    const params = useParams();
    const hashtag = params.tag as string;
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, error, isFetching } = 
        useQuery({
            queryKey: ["hashtagPosts", hashtag, page],
            queryFn: async () => {
                const response = await getPostsByHashtag(hashtag, page);
                if (!response) {
                    throw new Error("No posts found");
                }
                return response;
            },
            staleTime: 1000 * 60, // 1 minute
            retry: false,
            refetchOnMount: true,
            refetchOnWindowFocus: false
        });

    const loadMorePosts = () => {
        if (!isFetching && data?.hasNextPage) {
            setPage(prev => prev + 1);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto min-h-screen py-[9px]">
            <div className="w-full bg-card rounded-2xl mb-4 p-6 shadow-sm">
                <h1 className="text-3xl font-bold">#{hashtag}</h1>
                <p className="text-muted-foreground mt-2">
                    {data ? `${data.posts.length} posts found` : 'Loading...'}
                </p>
            </div>

            {isLoading ? (
                <div className="space-y-6 w-full">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="w-full h-40 rounded-2xl" />
                    ))}
                </div>
            ) : isError ? (
                <div className="bg-card rounded-2xl p-6 text-center shadow-sm">
                    <p className="text-red-500">Error loading posts</p>
                    <p className="text-muted-foreground mt-2">
                        {(error as Error)?.message || "Something went wrong"}
                    </p>
                </div>
            ) : data?.posts.length === 0 ? (
                <div className="bg-card rounded-2xl p-6 text-center shadow-sm">
                    <p className="text-xl">No posts found with #{hashtag}</p>
                </div>
            ) : (
                <InfiniteScrollContainer
                    onButtonReached={loadMorePosts}
                >
                    <div className="space-y-4">
                        {data?.posts.map((post: PostData) => (
                            <Post key={post.id} post={post} />
                        ))}
                        {isFetching && (
                            <div className="py-4">
                                <Skeleton className="h-32" />
                            </div>
                        )}
                    </div>
                </InfiniteScrollContainer>
            )}
        </div>
    );
}
