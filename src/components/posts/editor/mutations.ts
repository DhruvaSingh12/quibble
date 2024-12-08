import { useToast } from "@/components/ui/use-toast";
import { InfiniteData, QueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { submitPost } from "./actions";
import { PostsPage } from "@/lib/types";

export function useSubmitPostMutation() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: submitPost,
        onSuccess: async (newPost) => {
            const queryFilter: QueryFilters = { queryKey: ["post-feed", "for-you"] };
            await queryClient.cancelQueries(queryFilter);
            queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
                queryFilter,
                (oldData) => {
                    const firstPage = oldData?.pages[0];
                    if (firstPage) {
                        return {
                            pageParams: oldData.pageParams,
                            pages: [{
                                posts: [newPost, ...firstPage.posts],
                                nextCursor: firstPage.nextCursor
                            },
                            ...oldData.pages.slice(1)
                            ]
                        }
                    }
                });

                queryClient.invalidateQueries({
                    queryKey: queryFilter.queryKey,
                    predicate(query) {
                        return !query.state.data;
                    }
                })

                toast({
                    title: "Success",
                    description: "Your post has been submitted.",
                })
        },
        onError: (error) => {
            console.error(error);
            toast({
                title: "Error",
                description: "An error occured while submitting your post. Please try again.",
                variant: "destructive"
            })
        }
    });

    return mutation;
}