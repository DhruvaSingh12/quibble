"use client";

import Post from "@/components/posts/Post";
import { PostData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";

interface SinglePostProps {
  post: PostData;
}

export default function SinglePost({ post: initialPost }: SinglePostProps) {
  const { data: post } = useQuery({
    queryKey: ["post-data", initialPost.id],
    queryFn: () => kyInstance.get(`/api/posts/${initialPost.id}`).json<PostData>(),
    initialData: initialPost,
  });

  return <Post post={post} />;
}
