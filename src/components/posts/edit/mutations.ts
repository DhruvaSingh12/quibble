import { useToast } from "../../ui/use-toast";
import { InfiniteData, QueryFilters, QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { editPost } from "./actions";
import { PostsPage } from "@/lib/types";

export function useEditPostMutation() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    
    const mutation = useMutation({
        mutationFn: ({ id, content }: { id: string; content: string }) => editPost(id, content),
        onSuccess: async (updatedPost) => {
            const queryFilter: QueryFilters<InfiniteData<PostsPage, string | null>, Error, InfiniteData<PostsPage, string | null>, QueryKey> = { queryKey: ["post-feed"] };
            await queryClient.cancelQueries(queryFilter);
            
            queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
                queryFilter,
                (oldData) => {
                    if (!oldData) return;
                    return {
                        pageParams: oldData.pageParams,
                        pages: oldData.pages.map((page) => ({
                            nextCursor: page.nextCursor,
                            posts: page.posts.map(p => p.id === updatedPost.id ? updatedPost : p)
                        }))
                    }
                }
            );

            toast({
                title: "Success",
                description: "Your post has been updated.",
            });
        },
        onError(error) {
            console.error(error);
            toast({
                title: "Error",
                description: "An error occurred while updating the post. Please try again.",
                variant: "destructive"
            });
        },
    });

    return mutation;
}
