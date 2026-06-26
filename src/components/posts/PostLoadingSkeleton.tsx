import { Skeleton } from "@/components/ui/Skeleton"

export default function PostsLoadingSkeleton() {
   return (
    <div className="space-y-0 w-full">
        <PostLoadingSkeleton />
        <PostLoadingSkeleton />
        <PostLoadingSkeleton />
    </div>
   )
}

function PostLoadingSkeleton() {
  return (
    <div className="w-full p-4 border-b border-border animate-pulse space-y-3">
        <div className="flex flex-wrap gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
            </div>
        </div>
        <Skeleton className="h-16 w-full rounded" />
    </div>
  )
}