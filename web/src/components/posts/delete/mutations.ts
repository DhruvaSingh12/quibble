import { useToast } from "../../ui/use-toast";
import { InfiniteData, QueryFilters, QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { deletePost } from "./actions";
import { PostsPage } from "@/lib/types";

export function useDeletePostMutation() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const router = useRouter();
    const pathname = usePathname();
    const mutation = useMutation({
        mutationFn: deletePost,
        onSuccess: async (deletedPost) => {
            const queryFilter: QueryFilters = { queryKey: ["post-feed"] };
            await queryClient.cancelQueries(queryFilter);
            queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
                queryFilter,
                (oldData) => {
                    if (!oldData) return;
                    return {
                        pageParams: oldData.pageParams,
                        pages: oldData.pages.map((page) => ({
                            nextCursor: page.nextCursor,
                            posts: page.posts.filter(p => p.id !== deletedPost.id)
                        }))
                    }
                }
            )

            toast({
                title: "Success",
                description: "Your post has been deleted.",
            })

            if (pathname === `/posts/${deletedPost.id}`) {
                router.push('/users/${deletedPost.user.username}');
            }
        },
        onError(error) {
            console.error(error);
            toast({
                title: "Error",
                description: "An error occured while deleting the post. Please try again.",
                variant: "destructive"
            })
        },
    })

    return mutation;
}