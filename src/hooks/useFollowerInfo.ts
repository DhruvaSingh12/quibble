import kyInstance from "@/lib/ky";
import { FollowerInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export default function useFollowerInfo(
  userId: string,
  initialState: FollowerInfo,
) {
  const query = useQuery({
    queryKey: ["follower-info", userId],
    queryFn: () =>
      kyInstance.get(`/api/users/${userId}/followers`).json<FollowerInfo>(),
    initialData: initialState,
    // Set a shorter staleTime to ensure data is refreshed more frequently
    staleTime: 1000 * 60, // 1 minute
    // Add refetchOnMount to ensure fresh data when component mounts
    refetchOnMount: true,
  });

  return query;
}