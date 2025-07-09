import { useToast } from "@/components/ui/use-toast";
import { InfiniteData, useMutation, useQueryClient, Query, QueryKey } from "@tanstack/react-query";
import { submitPost } from "./actions";
import { PostsPage } from "@/lib/types";
import { useSession } from "@/providers/SessionProvider";

export function useSubmitPostMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: submitPost,
    onSuccess: async (newPost) => {
      const queryFilter = {
        queryKey: ["post-feed"] as QueryKey,
        predicate(query: Query<unknown, Error, unknown, QueryKey>) {
          const queryKey = query.queryKey as string[];
          return (
            queryKey.includes("for-you") ||
            (queryKey.includes("user-posts") && queryKey.includes(user.id))
          );
        },
      };
      await queryClient.cancelQueries(queryFilter);
      queryClient.setQueriesData<InfiniteData<PostsPage>>(
        { queryKey: queryFilter.queryKey },
        (oldData) => {
          const firstPage = oldData?.pages[0];
          if (firstPage) {
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  posts: [newPost, ...firstPage.posts],
                  nextCursor: firstPage.nextCursor,
                },
                ...oldData.pages.slice(1),
              ],
            };
          }
          return oldData;
        }
      );

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
        predicate(query) {
          return queryFilter.predicate(query) && !query.state.data;
        },
      });
      toast({
        title: "Success",
        description: "Your post has been submitted.",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "An error occurred while submitting your post. Please try again.",
        variant: "destructive",
      });
    },
  });

  return mutation;
}
